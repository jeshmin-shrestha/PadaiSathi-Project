"""
PadaiSathi API v2.0
Replaces backend/app/main.py
Keeps all your working auth + adds summarize + video generation.
"""
from fastapi import FastAPI, HTTPException, Form, UploadFile, File, Depends, BackgroundTasks, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import os, shutil, hashlib, bcrypt, uuid
from datetime import datetime, timezone, timedelta as _timedelta

# Nepal Time = UTC+5:45
_NPT = timezone(_timedelta(hours=5, minutes=45))

def _today_npt():
    """Return today's date in Nepal Time (UTC+5:45)."""
    return datetime.now(_NPT).date()

def _effective_streak(user) -> int:
    """Return the correct streak without touching the DB.
    Applies the same decay rules as decay_streak_if_inactive so that
    admin views and leaderboard always show the true value even if the
    user hasn't logged in yet to trigger the lazy DB update."""
    today = _today_npt()
    if not user.last_activity_date:
        return 0
    if user.last_activity_date < today - timedelta(days=1):
        return 0
    return user.streak or 0
from pathlib import Path
from sqlalchemy.orm import Session

from . import models
from .database import engine, get_db, Base


# google auth
from starlette.requests import Request
from starlette.responses import RedirectResponse, JSONResponse
from .auth import oauth, create_access_token, GOOGLE_REDIRECT_URI, FRONTEND_URL
import secrets
import httpx
import json



# ── AI modules ────────────────────────────────────────────────────────────────
from .ai.pdf_extractor   import extract_text_from_pdf
from .ai.summarizer      import summarize
from .ai.video_generator import generate_video
# ── DB ────────────────────────────────────────────────────────────────────────
Base.metadata.create_all(bind=engine)

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="PadaiSathi API", version="2.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
# Add SessionMiddleware 
from starlette.middleware.sessions import SessionMiddleware
import secrets
app.add_middleware(SessionMiddleware, secret_key=os.getenv("SECRET_KEY", secrets.token_urlsafe(32)))
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "https://padai-sathi-project.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve generated videos as static files
VIDEO_OUT_DIR = Path("generated_videos")
VIDEO_OUT_DIR.mkdir(exist_ok=True)
app.mount("/videos", StaticFiles(directory=str(VIDEO_OUT_DIR)), name="videos")

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# ── Password helpers (bcrypt with SHA256 backward compatibility) ──────────────
def simple_hash_password(password: str) -> str:
    # All new passwords use bcrypt
    return bcrypt.hashpw(
        password.encode('utf-8'),
        bcrypt.gensalt()
    ).decode('utf-8')

def simple_verify_password(plain: str, hashed: str) -> bool:
    # bcrypt hashes always start with $2b$
    if hashed.startswith('$2b$') or hashed.startswith('$2a$'):
        return bcrypt.checkpw(
            plain.encode('utf-8'),
            hashed.encode('utf-8')
        )
    else:
        # Old SHA256 hash — still works for existing users
        return hashlib.sha256(plain.encode()).hexdigest() == hashed

# ── Video job tracker (in-memory) ─────────────────────────────────────────────
_video_jobs: dict = {}   # { summary_id: {status, video_url, error} }

# badges definiations
BADGE_DEFINITIONS = [
    { "id": "trailblazer",        "name": "Trailblazer",        "icon": "🐣", "description": "Upload your first document" },
    { "id": "summary_scout",      "name": "Summary Scout",      "icon": "📝", "description": "Generate 3 summaries" },
    { "id": "summary_sensei",     "name": "Summary Sensei",     "icon": "🧠", "description": "Generate 10 summaries" },
    { "id": "card_sharp",         "name": "Card Sharp",         "icon": "📇", "description": "Generate 25 flashcards" },
    { "id": "deck_destroyer",     "name": "Deck Destroyer",     "icon": "⚡", "description": "Generate 100 flashcards" },
    { "id": "quiz_challenger",    "name": "Quiz Challenger",    "icon": "❓", "description": "Complete 10 quiz questions" },
    { "id": "trivia_titan",       "name": "Trivia Titan",       "icon": "🏆", "description": "Complete 50 quiz questions" },
    { "id": "video_visionary",    "name": "Video Visionary",    "icon": "🎬", "description": "Generate 3 videos" },
    { "id": "knowledge_keeper",   "name": "Knowledge Keeper",   "icon": "📓", "description": "Create 5 notebooks" },
    { "id": "the_archivist",      "name": "The Archivist",      "icon": "🗂️", "description": "Create 15 notebooks" },
    { "id": "point_hunter",       "name": "Point Hunter",       "icon": "💰", "description": "Reach 500 points" },
    { "id": "point_tycoon",       "name": "Point Tycoon",       "icon": "👑", "description": "Reach 2000 points" },
    { "id": "streak_igniter",     "name": "Streak Igniter",     "icon": "🔥", "description": "3-day streak" },
    { "id": "unbreakable",        "name": "Unbreakable",        "icon": "⚔️", "description": "30-day streak" },
    { "id": "iron_will",          "name": "Iron Will",          "icon": "🛡️", "description": "60-day streak" },
    { "id": "eternal_flame",      "name": "Eternal Flame",      "icon": "💎", "description": "90-day streak" },
    { "id": "the_completionist",  "name": "The Completionist",  "icon": "🌟", "description": "Unlock every other badge" },
]
# ── Streak helper ────────────────────────────────────────────────────
from datetime import date, timedelta

def update_streak(user_id: int, db: Session):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return

    today = _today_npt()

    if user.last_activity_date is None:
        # First ever activity — start streak at 1
        user.streak = 1
    elif user.last_activity_date == today:
        return  # already active today, no change
    elif user.last_activity_date == today - timedelta(days=1):
        user.streak += 1  # consecutive day
    else:
        user.streak = 1   # streak broken

    user.last_activity_date = today
    db.commit()
# ═════════════════════════════════════════════════════════════════════════════
# Pydantic models
# ═════════════════════════════════════════════════════════════════════════════

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class SummarizeRequest(BaseModel):
    document_id: int
    user_email: str
    genz_style: bool = True

class VideoRequest(BaseModel):
    summary_id: int
    user_email: str
    theme: str = "subway"


# ═════════════════════════════════════════════════════════════════════════════
# Existing routes — UNCHANGED from your working version
# ═════════════════════════════════════════════════════════════════════════════

@app.get("/")
def root():
    return {
        "app": "PadaiSathi",
        "version": "2.0",
        "status": "active",
        "message": "🚀 API running with AI summarization + video!",
        "database": "SQLite (padaisathi.db)",
        "time": datetime.now().isoformat()
    }

@app.get("/api/health")
def health(db: Session = Depends(get_db)):
    return {
        "status": "healthy",
        "database": "connected",
        "users":     db.query(models.User).count(),
        "documents": db.query(models.Document).count(),
        "summaries": db.query(models.Summary).count(),
        "videos":    db.query(models.Video).count(),
        "timestamp": datetime.now().isoformat()
    }

# Add this import at the top of main.py with the other imports
import re

# ── Replace your existing /api/register route with this ──────────────────────

@app.post("/api/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    import re

    # ── Full name validation ──────────────────────────────────────────────────
    name = user.username.strip()
    if len(name) < 2:
        raise HTTPException(status_code=400, detail="Full name must be at least 2 characters")
    if len(name) > 50:
        raise HTTPException(status_code=400, detail="Full name must be 50 characters or less")
    if not re.match(r'^[a-zA-Z\s]+$', name):
        raise HTTPException(status_code=400, detail="Full name can only contain letters and spaces")

    # ── Email validation ──────────────────────────────────────────────────────
    email = user.email.strip().lower()
    if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
        raise HTTPException(status_code=400, detail="Please enter a valid email address")

    # ── Password validation ───────────────────────────────────────────────────
    if len(user.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    if not re.search(r'[A-Z]', user.password):
        raise HTTPException(status_code=400, detail="Password must contain at least one uppercase letter")
    if not re.search(r'\d', user.password):
        raise HTTPException(status_code=400, detail="Password must contain at least one number")
    if not re.search(r'[^a-zA-Z0-9]', user.password):
        raise HTTPException(status_code=400, detail="Password must contain at least one special character (!@#$%^&*)")
    # ── Check duplicate ───────────────────────────────────────────────────────
    existing = db.query(models.User).filter(
        models.User.email == email
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    new_user = models.User(
        username=name,
        email=email,
        password_hash=simple_hash_password(user.password),
        role="student", points=100, streak=0,
        created_at=datetime.utcnow()
    )
    db.add(new_user); db.commit(); db.refresh(new_user)
    return {"success": True, "message": f"Welcome {name}!", "user": new_user.to_dict()}
@app.post("/api/login")
@limiter.limit("5/minute")
def login(request: Request, user: UserLogin, db: Session = Depends(get_db)):
    if user.email == "demo@padai.com" and user.password == "demo123":
        demo = db.query(models.User).filter(models.User.email == "demo@padai.com").first()
        if not demo:
            demo = models.User(
                username="DemoStudent", email="demo@padai.com",
                password_hash=simple_hash_password("demo123"),
                role="student", points=150, streak=7,
                created_at=datetime.utcnow()
            )
            db.add(demo); db.commit(); db.refresh(demo)
        return {"success": True, "message": "Welcome back, DemoStudent!", "user": demo.to_dict()}

    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or not simple_verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    #  Silent upgrade: if still SHA256, re-hash with bcrypt on login
    if not db_user.password_hash.startswith('$2b$'):
        db_user.password_hash = simple_hash_password(user.password)
        db.commit()
        print(f"[Security] {db_user.email} upgraded to bcrypt ✅")

    decay_streak_if_inactive(db_user.id, db)
    db.refresh(db_user)                    
    return {"success": True, "message": f"Welcome back, {db_user.username}!", "user": db_user.to_dict()}

@app.get("/api/users")
def get_users(db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    result = []
    for u in users:
        d = u.to_dict()
        d['streak'] = _effective_streak(u)   # show correct decayed value
        result.append(d)
    return {"users": result, "total": len(users)}


@app.delete("/api/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role == "admin":
        raise HTTPException(status_code=403, detail="Cannot delete admin accounts")
    db.query(models.UserBadge).filter(models.UserBadge.user_id == user_id).delete()
    db.query(models.PasswordResetToken).filter(models.PasswordResetToken.user_id == user_id).delete()
    db.query(models.Friendship).filter(
        (models.Friendship.sender_id == user_id) |
        (models.Friendship.receiver_id == user_id)
    ).delete(synchronize_session=False)
    db.query(models.Favorite).filter(models.Favorite.user_id == user_id).delete()
    db.query(models.Quiz).filter(models.Quiz.user_id == user_id).delete()
    db.query(models.Flashcard).filter(models.Flashcard.user_id == user_id).delete()
    db.query(models.Video).filter(models.Video.user_id == user_id).delete()
    db.query(models.Summary).filter(models.Summary.user_id == user_id).delete()
    db.query(models.Notebook).filter(models.Notebook.user_id == user_id).delete()
    db.query(models.Document).filter(models.Document.user_id == user_id).delete()
    db.delete(user)
    db.commit()
    return {"success": True, "message": f"User {user.username} deleted"}


# ═════════════════════════════════════════════════════════════════════════════
# Upload — now also extracts text and stores Document record
# ═════════════════════════════════════════════════════════════════════════════
@app.post("/api/upload")
async def upload_pdf(
    email: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    _allowed_exts = {'.pdf', '.pptx', '.txt'}
    _ext = Path(file.filename).suffix.lower()
    if _ext not in _allowed_exts:
        raise HTTPException(status_code=400, detail="Only PDF, PPTX, and TXT files are allowed")

    safe_filename = str(uuid.uuid4()) + Path(file.filename).suffix.lower()
    file_path = str(UPLOAD_DIR / safe_filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        extracted_text = extract_text_from_pdf(file_path)
    except Exception as e:
        extracted_text = ""
        print(f"[Upload] Text extraction warning: {e}")

    # Step 1: Save document FIRST and commit
    doc = models.Document(
        user_id=user.id,
        file_name=file.filename,
        file_path=file_path,
        file_type=_ext.lstrip('.'),
        upload_date=datetime.utcnow(),
        extracted_text=extracted_text,
    )
    db.add(doc)
    db.commit()       # ← commit first
    db.refresh(doc)   # ← now doc.id is available!

    # Step 2: Now create notebook with the real doc.id
    notebook = models.Notebook(
        user_id=user.id,
        document_id=doc.id,  # ← now this has the real ID!
        title=Path(file.filename).stem,
        created_at=datetime.utcnow()
    )
    db.add(notebook)
    user.points = (user.points or 0) + 10
    db.commit()
    update_streak(user.id, db)
    db.refresh(notebook)
    


    new_badges = _check_and_award_badges(user.id, db)
    return {
        "success": True,
        "message": f"PDF '{file.filename}' uploaded successfully!",
        "document_id": doc.id,
        "notebook_id": notebook.id,
        "file_path": file_path,
        "extracted_chars": len(extracted_text or ""),
        "status": "ready_to_summarize",
        "points_earned": 10,
        "total_points": user.points,
        "streak": user.streak,
        "newly_earned_badges": new_badges,
    }
from .ai.quiz_generator import generate_only_flashcards, generate_only_quiz
class ContentRequest(BaseModel):
    summary_id: int
    user_email: str

@app.post("/api/generate-flashcards")
def generate_flashcards(req: ContentRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == req.user_email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    summary = db.query(models.Summary).filter(
        models.Summary.id == req.summary_id,
        models.Summary.user_id == user.id
    ).first()
    if not summary:
        raise HTTPException(status_code=404, detail="Summary not found")

    # ✅ FIX: use original PDF text, not the summary
    doc = db.query(models.Document).filter(
        models.Document.id == summary.document_id
    ).first()
    text = doc.extracted_text if doc and doc.extracted_text else summary.summary_text

    flashcards_list = generate_only_flashcards(text, n=8)

    #  Save each flashcard to database
    saved_flashcards = []
    for card in flashcards_list:
        flashcard = models.Flashcard(
            summary_id=req.summary_id,
            user_id=user.id,
            question=card["question"],
            answer=card["answer"],
            created_at=datetime.utcnow()
        )
        db.add(flashcard)
        saved_flashcards.append(card)

    user.points = (user.points or 0) + 10
    db.commit()
    update_streak(user.id, db)

   
    new_badges = _check_and_award_badges(user.id, db)
    return {
        "success": True,
        "flashcards": saved_flashcards,
        "summary_id": req.summary_id,
        "streak": user.streak,
        "newly_earned_badges": new_badges,
    }

@app.post("/api/generate-quiz")
def generate_quiz(req: ContentRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == req.user_email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    summary = db.query(models.Summary).filter(
        models.Summary.id == req.summary_id,
        models.Summary.user_id == user.id
    ).first()
    if not summary:
        raise HTTPException(status_code=404, detail="Summary not found")

    # REPLACE with:
    doc = db.query(models.Document).filter(
        models.Document.id == summary.document_id
    ).first()
    text = doc.extracted_text if doc and doc.extracted_text else summary.summary_text 
    quiz_list = generate_only_quiz(text, n=8)

    #  Save each quiz question to database
    saved_questions = []
    for q in quiz_list:
        quiz = models.Quiz(
            summary_id=req.summary_id,
            user_id=user.id,
            question=q["question"],
            options=q["options"],
            correct_answer=str(q["correct"]),
            created_at=datetime.utcnow()
        )
        db.add(quiz)
        saved_questions.append(q)

    user.points = (user.points or 0) + 10
    db.commit()
    update_streak(user.id, db) 
    
    new_badges = _check_and_award_badges(user.id, db)
    return {
        "success": True,
        "questions": saved_questions,
        "summary_id": req.summary_id,
        "streak": user.streak,
        "newly_earned_badges": new_badges, 
    }
# ═════════════════════════════════════════════════════════════════════════════
# AI Summarization  (Sprint 3)
# ═════════════════════════════════════════════════════════════════════════════

@app.post("/api/summarize")
def summarize_document(req: SummarizeRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == req.user_email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    doc = db.query(models.Document).filter(
        models.Document.id == req.document_id,
        models.Document.user_id == user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if not doc.extracted_text or len(doc.extracted_text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Document has no extractable text. Try re-uploading the PDF.")

    print(f"[Summarize] Running jeshmin mistral on doc_id={doc.id} ({len(doc.extracted_text)} chars)…")

    try:
        result = summarize(doc.extracted_text, genz_style=req.genz_style)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")

    summary_record = models.Summary(
        document_id=doc.id,
        user_id=user.id,
        summary_text=result["formal_summary"],
        slang_version_text=result["genz_summary"],
        generated_at=datetime.utcnow(),
    )
    db.add(summary_record)
    user.points = (user.points or 0) + 20
    db.commit(); db.refresh(summary_record)
    update_streak(user.id, db) 
    new_badges = _check_and_award_badges(user.id, db)
    return {
        "success": True,
        "summary_id":     summary_record.id,
        "formal_summary": result["formal_summary"],
        "genz_summary":   result["genz_summary"],
        "word_count":     result["word_count"],
        "points_earned":  20,
        "total_points":   user.points,
        "streak":         user.streak,
        "newly_earned_badges": new_badges,
    }


# ═════════════════════════════════════════════════════════════════════════════
# Video Generation  (Sprint 4/5)
# ═════════════════════════════════════════════════════════════════════════════

@app.post("/api/generate-video")
def generate_video_endpoint(
    req: VideoRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.email == req.user_email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    summary = db.query(models.Summary).filter(
        models.Summary.id == req.summary_id,
        models.Summary.user_id == user.id
    ).first()
    if not summary:
        raise HTTPException(status_code=404, detail="Summary not found — generate a summary first")

    _video_jobs[req.summary_id] = {"status": "queued", "video_url": None, "error": None}

    background_tasks.add_task(
        _run_video_pipeline,
        summary_id=req.summary_id,
        genz_text=summary.slang_version_text or summary.summary_text,
        theme=req.theme,
        user_id=user.id,
    )

    return {
        "success": True,
        "message": "Video generation started",
        "summary_id": req.summary_id,
        "status": "queued",
        "poll_url": f"/api/video-status/{req.summary_id}",
    }


from .minio_storage import upload_video, get_video_url, get_signed_url_from_path

def _run_video_pipeline(summary_id: int, genz_text: str, theme: str, user_id: int):
    from .database import SessionLocal
    try:
        _video_jobs[summary_id]["status"] = "processing"

        filename = f"video_{summary_id}_{int(datetime.utcnow().timestamp())}.mp4"

        # Generate video (this is the slow part — no DB connection held open)
        video_path = generate_video(
            summary_text=genz_text,
            output_filename=filename,
            theme=theme,
        )

        # Upload to Azure
        video_url = upload_video(video_path, filename)
        print(f"[Azure] ✅ Uploaded: {video_url}")

        # ── Open a FRESH DB connection here, after all the slow work is done ──
        # The old connection would have timed out during Whisper + video render.
        db = SessionLocal()
        try:
            video_record = models.Video(
                summary_id=summary_id,
                user_id=user_id,
                s3_path=video_url,
                background_theme=theme,
                generated_at=datetime.utcnow(),
            )
            db.add(video_record)
            user = db.query(models.User).filter(models.User.id == user_id).first()
            if user:
                user.points = (user.points or 0) + 15
            db.commit()
            update_streak(user_id, db)
            _check_and_award_badges(user_id, db)
        finally:
            db.close()

        _video_jobs[summary_id]["status"] = "done"
        _video_jobs[summary_id]["video_url"] = get_video_url(filename)  # signed URL for playback
        print(f"[VideoGen] ✅ Done: {filename}")

    except Exception as e:
        _video_jobs[summary_id]["status"] = "error"
        _video_jobs[summary_id]["error"] = str(e)
        print(f"[VideoGen] ❌ Failed: {e}")

        
@app.get("/api/video-status/{summary_id}")
def video_status(summary_id: int):
    job = _video_jobs.get(summary_id)
    if not job:
        raise HTTPException(status_code=404, detail="No video job found for this summary_id")
    return job

@app.get("/api/my-documents")
def my_documents(email: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    docs = db.query(models.Document).filter(models.Document.user_id == user.id).all()
    return {"documents": [d.to_dict() for d in docs]}

@app.get("/api/my-summaries")
def my_summaries(email: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    summaries = db.query(models.Summary).filter(models.Summary.user_id == user.id).all()
    return {"summaries": [s.to_dict() for s in summaries]}
@app.get("/api/my-notebooks")
def my_notebooks(email: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    notebooks = db.query(models.Notebook).filter(
        models.Notebook.user_id == user.id
    ).order_by(models.Notebook.created_at.desc()).all()
    return {"notebooks": [n.to_dict() for n in notebooks]}
@app.get("/api/notebook/{notebook_id}")
def get_notebook_detail(notebook_id: int, email: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    notebook = db.query(models.Notebook).filter(
        models.Notebook.id == notebook_id,
        models.Notebook.user_id == user.id
    ).first()
    if not notebook:
        raise HTTPException(status_code=404, detail="Notebook not found")

    # Get summary for this document
    summary = db.query(models.Summary).filter(
        models.Summary.document_id == notebook.document_id,
        models.Summary.user_id == user.id
    ).order_by(models.Summary.generated_at.desc()).first()

    # Get flashcards, quizzes, videos linked to that summary
    flashcards, quizzes, videos = [], [], []
    if summary:
        flashcards = db.query(models.Flashcard).filter(
            models.Flashcard.summary_id == summary.id
        ).all()
        quizzes = db.query(models.Quiz).filter(
            models.Quiz.summary_id == summary.id
        ).all()
        videos = db.query(models.Video).filter(
            models.Video.summary_id == summary.id
        ).all()

    return {
        "notebook": notebook.to_dict(),
        "summary":    summary.to_dict() if summary else None,
        "flashcards": [f.to_dict() for f in flashcards],
        "quizzes":    [q.to_dict() for q in quizzes],
        "videos":     [{**v.to_dict(), "s3_path": get_signed_url_from_path(v.s3_path)} for v in videos],
    }
# ═══════════════════════════════════════════════════════════════════════════
# ADD THESE TWO ROUTES to main.py  (paste anywhere after the existing routes)
# ═══════════════════════════════════════════════════════════════════════════

from pydantic import BaseModel

class UpdateProfileRequest(BaseModel):
    email: str
    avatar: str = None          # e.g. "wizard", "robot", etc.

class ChangePasswordRequest(BaseModel):
    email: str
    current_password: str
    new_password: str


@app.put("/api/update-profile")
def update_profile(req: UpdateProfileRequest, db: Session = Depends(get_db)):
    """Update avatar (and any future profile fields)."""
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if req.avatar is not None:
        user.avatar = req.avatar          # make sure you add  avatar = Column(String(50), nullable=True)  to the User model

    db.commit()
    db.refresh(user)

    # Return updated user dict so the frontend can refresh localStorage
    return {"success": True, "user": user.to_dict()}


@app.put("/api/change-password")
def change_password(req: ChangePasswordRequest, db: Session = Depends(get_db)):
    """Verify current password then set new one."""
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not simple_verify_password(req.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    if len(req.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    if not re.search(r'[A-Z]', req.new_password):
        raise HTTPException(status_code=400, detail="Password must contain at least one uppercase letter")
    if not re.search(r'\d', req.new_password):
        raise HTTPException(status_code=400, detail="Password must contain at least one number")
    if not re.search(r'[^a-zA-Z0-9]', req.new_password):
        raise HTTPException(status_code=400, detail="Password must contain at least one special character (!@#$%^&*)")
    user.password_hash = simple_hash_password(req.new_password)
    db.commit()

    return {"success": True, "message": "Password updated successfully"}




# ============================================================================
# Google OAuth Routes
# ============================================================================

@app.get("/api/auth/google/login")
async def google_login(request: Request):
    """Redirect to Google login"""
    # Generate a random state for CSRF protection
    state = secrets.token_urlsafe(32)
    request.session['oauth_state'] = state
    
    redirect_uri = GOOGLE_REDIRECT_URI
    
    return await oauth.google.authorize_redirect(request, redirect_uri, state=state)

@app.get("/api/auth/google/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    """Handle Google OAuth callback"""
    try:
        # Verify state to prevent CSRF
        state = request.query_params.get('state')
        if not state or state != request.session.get('oauth_state'):
            raise HTTPException(status_code=400, detail="Invalid state parameter")
        
        # Get token from Google
        token = await oauth.google.authorize_access_token(request)
        
        # Get user info from Google
        userinfo = token.get('userinfo')
        if not userinfo:
            # Fallback: get userinfo from Google's API
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    'https://www.googleapis.com/oauth2/v3/userinfo',
                    headers={'Authorization': f'Bearer {token["access_token"]}'}
                )
                userinfo = resp.json()
        
        # Extract user details
        google_id = userinfo.get('sub')
        email = userinfo.get('email')
        name = userinfo.get('name')
        picture = userinfo.get('picture')
        
        if not email:
            raise HTTPException(status_code=400, detail="Email not provided by Google")
        
        # Check if user exists
        user = db.query(models.User).filter(models.User.email == email).first()
        
        if not user:
            # Create new user using the name from Google
            # Use the full name from Google if available, otherwise fall back to email
            if name and name.strip():
                # Clean the name: remove extra spaces, etc.
                clean_name = " ".join(name.split())  # This removes extra spaces
                username = clean_name
            else:
                # Fallback to email prefix if no name provided
                username = email.split('@')[0]
            
            # Make sure username is unique (add number if needed)
            counter = 1
            original_username = username
            while db.query(models.User).filter(models.User.username == username).first():
                username = f"{original_username}{counter}"
                counter += 1
            
            # Create random password (user will use Google login, so password doesn't matter)
            random_password = secrets.token_urlsafe(16)
                    
            # Create random password (user will use Google login, so password doesn't matter)
            random_password = secrets.token_urlsafe(16)
            
            new_user = models.User(
                username=username,
                email=email,
                password_hash=simple_hash_password(random_password),
                role="student",
                points=100,
                streak=0,
                avatar="avatar1",  # Default avatar
                created_at=datetime.utcnow()
            )
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            user = new_user
            
            # Give bonus points for Google signup
            user.points = (user.points or 0) + 50
            db.commit()
        
        # Create JWT token for your app
        access_token = create_access_token(
            data={"sub": user.email, "user_id": user.id, "username": user.username}
        )
        decay_streak_if_inactive(user.id, db)
        db.refresh(user)
        # Redirect to frontend with token
        frontend_url = f"{FRONTEND_URL}/auth/callback?token={access_token}&email={user.email}&username={user.username}&avatar={user.avatar}"
        return RedirectResponse(url=frontend_url)
        
    except Exception as e:
        print(f"Google OAuth error: {str(e)}")
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error=auth_failed")

@app.post("/api/auth/google/token")
async def google_token_auth(request: Request, db: Session = Depends(get_db)):
    """Alternative: Exchange Google token for app token (for frontend Google Sign-In)"""
    try:
        data = await request.json()
        token = data.get('token')
        
        if not token:
            raise HTTPException(status_code=400, detail="Token required")
        
        # Verify the token with Google
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                'https://www.googleapis.com/oauth2/v3/userinfo',
                headers={'Authorization': f'Bearer {token}'}
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=400, detail="Invalid token")
            
            userinfo = resp.json()
        
        email = userinfo.get('email')
        name = userinfo.get('name')
        
        if not email:
            raise HTTPException(status_code=400, detail="Email not provided")
        
        # Check if user exists
        user = db.query(models.User).filter(models.User.email == email).first()
        
        if not user:
            # Create new user using the name from Google
            if name and name.strip():
                clean_name = " ".join(name.split())
                username = clean_name
            else:
                username = email.split('@')[0]
            
            counter = 1
            original_username = username
            while db.query(models.User).filter(models.User.username == username).first():
                username = f"{original_username}{counter}"
                counter += 1
                    
            random_password = secrets.token_urlsafe(16)
            
            new_user = models.User(
                username=username,
                email=email,
                password_hash=simple_hash_password(random_password),
                role="student",
                points=150,  # Bonus for Google signup
                streak=0,
                avatar="avatar1",
                created_at=datetime.utcnow()
            )
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            user = new_user
        
        # Return user data
        return {
            "success": True,
            "user": user.to_dict(),
            "message": f"Welcome {user.username}!"
        }
        
    except Exception as e:
        print(f"Google token auth error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
@app.get("/api/my-favorites")
def get_favorites(email: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    favs = db.query(models.Favorite).filter(models.Favorite.user_id == user.id).all()
    return {"favorite_notebook_ids": [f.notebook_id for f in favs]}

@app.post("/api/toggle-favorite")
def toggle_favorite(data: dict, db: Session = Depends(get_db)):
    email       = data.get("email")
    notebook_id = data.get("notebook_id")

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    existing = db.query(models.Favorite).filter(
        models.Favorite.user_id     == user.id,
        models.Favorite.notebook_id == notebook_id
    ).first()

    if existing:
        db.delete(existing)
        db.commit()
        return {"favorited": False}
    else:
        fav = models.Favorite(user_id=user.id, notebook_id=notebook_id, created_at=datetime.utcnow())
        db.add(fav)
        db.commit()
        return {"favorited": True}
@app.get("/api/auth/user")
def get_current_user(email: str, db: Session = Depends(get_db)):
    """Get current user by email (for token validation)"""
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user.to_dict()


@app.get("/api/my-stats")
def my_stats(email: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    documents  = db.query(models.Document).filter(models.Document.user_id == user.id).count()
    summaries  = db.query(models.Summary).filter(models.Summary.user_id == user.id).count()
    notebooks  = db.query(models.Notebook).filter(models.Notebook.user_id == user.id).count()
    flashcards = db.query(models.Flashcard).filter(models.Flashcard.user_id == user.id).count()
    quizzes    = db.query(models.Quiz).filter(models.Quiz.user_id == user.id).count()
    videos     = db.query(models.Video).filter(models.Video.user_id == user.id).count()

    return {
        "documents":  documents,
        "summaries":  summaries,
        "notebooks":  notebooks,
        "flashcards": flashcards,
        "quizzes":    quizzes,
        "videos":     videos,
        "streak":     _effective_streak(user),
        "points":     user.points or 0,
    }

def _check_and_award_badges(user_id: int, db: Session):
    """Call this after any action to auto-award new badges."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return []

    # Get already earned badge ids
    earned_ids = {
        b.badge_id for b in db.query(models.UserBadge).filter(
            models.UserBadge.user_id == user_id
        ).all()
    }

    # Fetch current stats
    documents  = db.query(models.Document).filter(models.Document.user_id == user_id).count()
    summaries  = db.query(models.Summary).filter(models.Summary.user_id == user_id).count()
    flashcards = db.query(models.Flashcard).filter(models.Flashcard.user_id == user_id).count()
    quizzes    = db.query(models.Quiz).filter(models.Quiz.user_id == user_id).count()
    videos     = db.query(models.Video).filter(models.Video.user_id == user_id).count()
    notebooks  = db.query(models.Notebook).filter(models.Notebook.user_id == user_id).count()
    points     = user.points or 0
    streak     = user.streak or 0

    # Badge conditions map
    conditions = {
    "trailblazer":      documents  >= 1,
    "summary_scout":    summaries  >= 3,
    "summary_sensei":   summaries  >= 10,
    "card_sharp":       flashcards >= 25,
    "deck_destroyer":   flashcards >= 100,
    "quiz_challenger":  quizzes    >= 10,
    "trivia_titan":     quizzes    >= 50,
    "video_visionary":  videos     >= 3,
    "knowledge_keeper": notebooks  >= 5,
    "the_archivist":    notebooks  >= 15,
    "point_hunter":     points     >= 500,
    "point_tycoon":     points     >= 2000,
    "streak_igniter":   streak     >= 3,
    "unbreakable":      streak     >= 30,
    "iron_will":        streak     >= 60,
    "eternal_flame":    streak     >= 90,
}

    newly_earned = []
    for badge_id, condition_met in conditions.items():
        if condition_met and badge_id not in earned_ids:
            db.add(models.UserBadge(
                user_id=user_id,
                badge_id=badge_id,
                earned_at=datetime.utcnow()
            ))
            earned_ids.add(badge_id)
            newly_earned.append(badge_id)

    # Check overachiever — all other badges earned
    all_other_ids = {b["id"] for b in BADGE_DEFINITIONS if b["id"] != "overachiever"}
    if all_other_ids.issubset(earned_ids) and "overachiever" not in earned_ids:
        db.add(models.UserBadge(
            user_id=user_id,
            badge_id="overachiever",
            earned_at=datetime.utcnow()
        ))
        newly_earned.append("overachiever")

    if newly_earned:
        db.commit()

    return newly_earned


@app.get("/api/my-badges")
def my_badges(email: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    # Auto-check badges on every fetch
    _check_and_award_badges(user.id, db)

    earned = {
        b.badge_id: b.earned_at.isoformat()
        for b in db.query(models.UserBadge).filter(
            models.UserBadge.user_id == user.id
        ).all()
    }

    # Return ALL badges with earned/locked status
    result = []
    for badge in BADGE_DEFINITIONS:
        result.append({
            **badge,
            "earned":    badge["id"] in earned,
            "earned_at": earned.get(badge["id"]),
        })

    return {"badges": result, "earned_count": len(earned), "total": len(BADGE_DEFINITIONS)}


@app.post("/api/check-badges")
def check_badges(data: dict, db: Session = Depends(get_db)):
    """Call after any action to immediately award new badges."""
    email = data.get("email")
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    newly_earned = _check_and_award_badges(user.id, db)
    return {"newly_earned": newly_earned}
# ═════════════════════════════════════════════════════════════════════════════
# FRIENDS SYSTEM  — paste anywhere in main.py after existing routes
# ═════════════════════════════════════════════════════════════════════════════

from sqlalchemy import or_, and_

class FriendRequestBody(BaseModel):
    sender_email:   str
    receiver_email: str

class FriendRespondBody(BaseModel):
    friendship_id: int
    email: str          # the receiver's email (for auth check)
    action: str         # "accept" | "decline"


# ── Send a friend request ─────────────────────────────────────────────────
@app.post("/api/friend-request")
def send_friend_request(req: FriendRequestBody, db: Session = Depends(get_db)):
    sender   = db.query(models.User).filter(models.User.email == req.sender_email).first()
    receiver = db.query(models.User).filter(models.User.email == req.receiver_email).first()

    if not sender:
        raise HTTPException(status_code=401, detail="Sender not found")
    if not receiver:
        raise HTTPException(status_code=404, detail="No user found with that email")
    if sender.id == receiver.id:
        raise HTTPException(status_code=400, detail="You can't add yourself!")

    # Already a friendship in either direction?
    existing = db.query(models.Friendship).filter(
        or_(
            and_(models.Friendship.sender_id   == sender.id,
                 models.Friendship.receiver_id == receiver.id),
            and_(models.Friendship.sender_id   == receiver.id,
                 models.Friendship.receiver_id == sender.id),
        )
    ).first()

    if existing:
        if existing.status == "accepted":
            raise HTTPException(status_code=400, detail="Already friends!")
        if existing.status == "pending":
            raise HTTPException(status_code=400, detail="Friend request already sent!")
        # declined → allow re-send
        existing.status = "pending"
        existing.sender_id   = sender.id
        existing.receiver_id = receiver.id
        db.commit()
        return {"success": True, "message": f"Friend request re-sent to {receiver.username}!"}

    friendship = models.Friendship(
        sender_id=sender.id,
        receiver_id=receiver.id,
        status="pending",
        created_at=datetime.utcnow(),
    )
    db.add(friendship)
    db.commit()
    db.refresh(friendship)
    return {"success": True, "message": f"Friend request sent to {receiver.username}!"}


# ── Accept / Decline a request ────────────────────────────────────────────
@app.post("/api/friend-respond")
def respond_to_friend_request(req: FriendRespondBody, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    friendship = db.query(models.Friendship).filter(
        models.Friendship.id == req.friendship_id,
        models.Friendship.receiver_id == user.id,   # only receiver can respond
        models.Friendship.status == "pending",
    ).first()

    if not friendship:
        raise HTTPException(status_code=404, detail="Friend request not found")

    if req.action not in ("accept", "decline"):
        raise HTTPException(status_code=400, detail="action must be 'accept' or 'decline'")

    friendship.status = "accepted" if req.action == "accept" else "declined"
    db.commit()

    msg = "You are now friends! 🎉" if req.action == "accept" else "Request declined."
    return {"success": True, "message": msg, "status": friendship.status}


# ── Remove a friend ───────────────────────────────────────────────────────
@app.delete("/api/remove-friend")
def remove_friend(email: str, friend_email: str, db: Session = Depends(get_db)):
    user   = db.query(models.User).filter(models.User.email == email).first()
    friend = db.query(models.User).filter(models.User.email == friend_email).first()
    if not user or not friend:
        raise HTTPException(status_code=404, detail="User not found")

    friendship = db.query(models.Friendship).filter(
        or_(
            and_(models.Friendship.sender_id   == user.id,
                 models.Friendship.receiver_id == friend.id),
            and_(models.Friendship.sender_id   == friend.id,
                 models.Friendship.receiver_id == user.id),
        ),
        models.Friendship.status == "accepted"
    ).first()

    if not friendship:
        raise HTTPException(status_code=404, detail="Friendship not found")

    db.delete(friendship)
    db.commit()
    return {"success": True, "message": "Friend removed."}


# ── List friends ──────────────────────────────────────────────────────────
@app.get("/api/my-friends")
def my_friends(email: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    if user.role == "admin":
        return {"friends": [], "count": 0}

    friendships = db.query(models.Friendship).filter(
        or_(
            models.Friendship.sender_id   == user.id,
            models.Friendship.receiver_id == user.id,
        ),
        models.Friendship.status == "accepted"
    ).all()

    friends = []
    for f in friendships:
        friend_user = f.receiver if f.sender_id == user.id else f.sender
        if friend_user.role == "admin":    # skip accidental admin friendships
            continue
        friends.append({
            "friendship_id": f.id,
            "id":       friend_user.id,
            "username": friend_user.username,
            "email":    friend_user.email,
            "points":   friend_user.points,
            "streak":   _effective_streak(friend_user),
            "avatar":   friend_user.avatar or "avatar1",
        })

    return {"friends": friends, "count": len(friends)}

# ── Pending requests (incoming) ───────────────────────────────────────────
@app.get("/api/friend-requests")
def pending_requests(email: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    # Admins have no social features at all
    if user.role == "admin":
        return {"requests": [], "count": 0}

    incoming = db.query(models.Friendship).filter(
        models.Friendship.receiver_id == user.id,
        models.Friendship.status == "pending",
    ).all()

    # Filter out any requests that came from an admin (edge case)
    filtered = [f for f in incoming if f.sender.role != "admin"]

    return {
        "requests": [
            {
                "friendship_id": f.id,
                "from_username": f.sender.username,
                "from_email":    f.sender.email,
                "from_avatar":   f.sender.avatar or "avatar1",
                "sent_at":       f.created_at.isoformat(),
            }
            for f in filtered
        ],
        "count": len(filtered),
    }

# ── Search users by username / email ─────────────────────────────────────
@app.get("/api/search-users")
def search_users(q: str, email: str, db: Session = Depends(get_db)):
    me = db.query(models.User).filter(models.User.email == email).first()
    if not me:
        raise HTTPException(status_code=401, detail="User not found")

    if len(q) < 2:
        return {"users": []}

    results = db.query(models.User).filter(
        or_(
            models.User.username.ilike(f"%{q}%"),
            models.User.email.ilike(f"%{q}%"),
        ),
        models.User.id   != me.id,
        models.User.role != "admin",       # ← exclude admins from search
    ).limit(10).all()

    def get_status(other_user):
        f = db.query(models.Friendship).filter(
            or_(
                and_(models.Friendship.sender_id   == me.id,
                     models.Friendship.receiver_id == other_user.id),
                and_(models.Friendship.sender_id   == other_user.id,
                     models.Friendship.receiver_id == me.id),
            )
        ).first()
        if not f:
            return "none"
        return f.status

    return {
        "users": [
            {
                "id":       u.id,
                "username": u.username,
                "email":    u.email,
                "avatar":   u.avatar or "avatar1",
                "points":   u.points,
                "status":   get_status(u),
            }
            for u in results
        ]
    }

@app.get("/api/leaderboard")
def get_leaderboard(email: str, friends_only: bool = False, db: Session = Depends(get_db)):
    current_user = db.query(models.User).filter(models.User.email == email).first()
    if not current_user:
        raise HTTPException(status_code=401, detail="User not found")

    if friends_only:
        friendships = db.query(models.Friendship).filter(
            or_(
                models.Friendship.sender_id   == current_user.id,
                models.Friendship.receiver_id == current_user.id,
            ),
            models.Friendship.status == "accepted"
        ).all()
        friend_ids = set()
        for f in friendships:
            friend_ids.add(f.receiver_id if f.sender_id == current_user.id else f.sender_id)
        friend_ids.add(current_user.id)

        all_users = db.query(models.User).filter(
            models.User.id.in_(friend_ids),
            models.User.role != "admin",       # ← exclude admins
        ).order_by(models.User.points.desc()).all()
    else:
        all_users = db.query(models.User).filter(
            models.User.role != "admin"         # ← exclude admins
        ).order_by(models.User.points.desc()).all()

    leaderboard = []
    user_rank   = None
    for i, u in enumerate(all_users):
        entry = {
            "rank":     i + 1,
            "username": u.username,
            "email":    u.email,
            "points":   u.points,
            "avatar":   u.avatar or "avatar1",
            "streak":   _effective_streak(u),
            "is_you":   u.email == email,
        }
        leaderboard.append(entry)
        if u.email == email:
            user_rank = i + 1

    return {
        "leaderboard":  leaderboard,
        "your_rank":    user_rank,
        "total_users":  len(all_users),
        "friends_only": friends_only,
    }
@app.get("/api/admin/stats")
def admin_stats(email: str, db: Session = Depends(get_db)):
    """Rich analytics for the admin dashboard."""
    requester = db.query(models.User).filter(models.User.email == email).first()
    if not requester or requester.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    students = db.query(models.User).filter(models.User.role != "admin").all()

    total_points = sum(u.points or 0 for u in students)
    n = len(students) or 1
    avg_points   = round(total_points / n, 1)
    avg_streak   = round(sum(_effective_streak(u) for u in students) / n, 1)

    # Top 10 students by points
    top_users = sorted(students, key=lambda u: u.points or 0, reverse=True)[:10]

    # Points distribution buckets
    buckets = {"0-100": 0, "101-300": 0, "301-600": 0, "601-1000": 0, "1000+": 0}
    for u in students:
        p = u.points or 0
        if   p <= 100:  buckets["0-100"]    += 1
        elif p <= 300:  buckets["101-300"]  += 1
        elif p <= 600:  buckets["301-600"]  += 1
        elif p <= 1000: buckets["601-1000"] += 1
        else:           buckets["1000+"]    += 1

    # Content totals
    docs       = db.query(models.Document).count()
    summaries  = db.query(models.Summary).count()
    flashcards = db.query(models.Flashcard).count()
    quizzes    = db.query(models.Quiz).count()
    videos     = db.query(models.Video).count()
    notebooks  = db.query(models.Notebook).count()

    return {
        "student_count": len(students),
        "total_points":  total_points,
        "avg_points":    avg_points,
        "avg_streak":    avg_streak,
        "top_users": [
            {"name": u.username, "points": u.points or 0, "streak": _effective_streak(u), "avatar": u.avatar}
            for u in top_users
        ],
        "points_dist": [{"range": k, "count": v} for k, v in buckets.items()],
        "content": {
            "documents":  docs,
            "summaries":  summaries,
            "flashcards": flashcards,
            "quizzes":    quizzes,
            "videos":     videos,
            "notebooks":  notebooks,
        },
        "avg_per_user": {
            "documents":  round(docs  / n, 1),
            "summaries":  round(summaries  / n, 1),
            "flashcards": round(flashcards / n, 1),
            "quizzes":    round(quizzes    / n, 1),
        },
    }
@app.get("/api/admin/weekly-activity")
def admin_weekly_activity(email: str, db: Session = Depends(get_db)):
    """
    Returns daily activity counts for the past 7 days.
    Counts: documents uploaded, summaries generated, flashcards, quizzes, videos per day.
    """
    requester = db.query(models.User).filter(models.User.email == email).first()
    if not requester or requester.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    from datetime import timedelta

    today = datetime.utcnow().date()
    days  = [today - timedelta(days=i) for i in range(6, -1, -1)]  # Mon→Sun order

    def count_by_day(model, date_col):
        """Count rows per day for the past 7 days."""
        counts = {}
        for day in days:
            start = datetime(day.year, day.month, day.day, 0, 0, 0)
            end   = datetime(day.year, day.month, day.day, 23, 59, 59)
            n = db.query(model).filter(
                date_col >= start,
                date_col <= end,
            ).count()
            counts[day.isoformat()] = n
        return counts

    doc_counts       = count_by_day(models.Document,  models.Document.upload_date)
    summary_counts   = count_by_day(models.Summary,   models.Summary.generated_at)
    flashcard_counts = count_by_day(models.Flashcard, models.Flashcard.created_at)
    quiz_counts      = count_by_day(models.Quiz,      models.Quiz.created_at)
    video_counts     = count_by_day(models.Video,     models.Video.generated_at)
    notebook_counts  = count_by_day(models.Notebook,  models.Notebook.created_at)  # ← ADD THIS

    # Also count unique active students per day (students who uploaded/summarized)
    active_students_by_day = {}
    for day in days:
        start = datetime(day.year, day.month, day.day, 0, 0, 0)
        end   = datetime(day.year, day.month, day.day, 23, 59, 59)
        # A student is "active" if they did anything that day
        doc_users = set(
            r.user_id for r in db.query(models.Document).filter(
                models.Document.upload_date >= start,
                models.Document.upload_date <= end,
            ).all()
        )
        sum_users = set(
            r.user_id for r in db.query(models.Summary).filter(
                models.Summary.generated_at >= start,
                models.Summary.generated_at <= end,
            ).all()
        )
        active_students_by_day[day.isoformat()] = len(doc_users | sum_users)

    # Build the combined day-by-day array for the chart
    result = []
    day_labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    for i, day in enumerate(days):
        iso = day.isoformat()
        # Use actual weekday name
        label = day.strftime("%a")  # Mon, Tue, etc.
        result.append({
            "day":            label,
            "date":           iso,
            "documents":      doc_counts[iso],
            "summaries":      summary_counts[iso],
            "flashcards":     flashcard_counts[iso],
            "quizzes":        quiz_counts[iso],
            "videos":         video_counts[iso],
            "notebooks":      notebook_counts[iso],
            "active_students": active_students_by_day[iso],
            "total_actions":  (
                doc_counts[iso] +
                summary_counts[iso] +
                flashcard_counts[iso] +
                quiz_counts[iso] +
                video_counts[iso]
            ),
        })

    # Weekly totals
    totals = {
        "documents":       sum(doc_counts.values()),
        "summaries":       sum(summary_counts.values()),
        "flashcards":      sum(flashcard_counts.values()),
        "quizzes":         sum(quiz_counts.values()),
        "videos":          sum(video_counts.values()),
        "notebooks":  sum(notebook_counts.values()),
        "total_actions":   sum(d["total_actions"] for d in result),
        "peak_day":        max(result, key=lambda d: d["total_actions"])["day"] if result else "—",
        "avg_daily_active": round(sum(active_students_by_day.values()) / 7, 1),
    }

    return {"days": result, "totals": totals}

@app.get("/api/my-activity-summary")
def my_activity_summary(email: str, week_offset: int = 0, db: Session = Depends(get_db)):
    """Activity summary — week_offset: 0 = current 30 days, -1 = previous 30 days, etc."""
    from datetime import timedelta
    from sqlalchemy import func

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    today = datetime.utcnow().date()

    # week_offset=-1 means "30 days before today's window", -2 means "60 days before", etc.
    offset_days = abs(week_offset) * 30  # week_offset is always 0 or negative from frontend
    ref_date   = today - timedelta(days=offset_days)
    start_date = ref_date - timedelta(days=29)

    start_dt = datetime(start_date.year, start_date.month, start_date.day, 0, 0, 0)
    end_dt   = datetime(ref_date.year,  ref_date.month,  ref_date.day,  23, 59, 59)

    # Bulk-fetch activity grouped by date
    doc_rows = db.query(
        func.date(models.Document.upload_date).label('date'),
        func.count().label('count')
    ).filter(
        models.Document.user_id == user.id,
        models.Document.upload_date >= start_dt,
        models.Document.upload_date <= end_dt
    ).group_by(func.date(models.Document.upload_date)).all()

    sum_rows = db.query(
        func.date(models.Summary.generated_at).label('date'),
        func.count().label('count')
    ).filter(
        models.Summary.user_id == user.id,
        models.Summary.generated_at >= start_dt,
        models.Summary.generated_at <= end_dt
    ).group_by(func.date(models.Summary.generated_at)).all()

    fc_rows = db.query(
        func.date(models.Flashcard.created_at).label('date'),
        func.count().label('count')
    ).filter(
        models.Flashcard.user_id == user.id,
        models.Flashcard.created_at >= start_dt,
        models.Flashcard.created_at <= end_dt
    ).group_by(func.date(models.Flashcard.created_at)).all()

    quiz_rows = db.query(
        func.date(models.Quiz.created_at).label('date'),
        func.count().label('count')
    ).filter(
        models.Quiz.user_id == user.id,
        models.Quiz.created_at >= start_dt,
        models.Quiz.created_at <= end_dt
    ).group_by(func.date(models.Quiz.created_at)).all()

    vid_rows = db.query(
        func.date(models.Video.generated_at).label('date'),
        func.count().label('count')
    ).filter(
        models.Video.user_id == user.id,
        models.Video.generated_at >= start_dt,
        models.Video.generated_at <= end_dt
    ).group_by(func.date(models.Video.generated_at)).all()

    # Merge all into one map
    activity_map = {}
    for rows in [doc_rows, sum_rows, fc_rows, quiz_rows, vid_rows]:
        for r in rows:
            key = str(r.date)
            activity_map[key] = activity_map.get(key, 0) + r.count

    # Build 30-day array
    daily_activity = []
    for i in range(30):
        day = start_date + timedelta(days=i)
        daily_activity.append({
            "day":     day.strftime("%a"),
            "date":    day.isoformat(),
            "actions": activity_map.get(day.isoformat(), 0)
        })

    # Stats for the last 7 days of the window
    last7       = daily_activity[-7:]
    week_total  = sum(d["actions"] for d in last7)
    active_days = sum(1 for d in last7 if d["actions"] > 0)

    # Stats for the full 30-day window
    month_total        = sum(d["actions"] for d in daily_activity)
    month_active_days  = sum(1 for d in daily_activity if d["actions"] > 0)

    is_current = (week_offset == 0)

    recommendations = []
    if is_current:
        if month_total == 0:
            recommendations.append({"icon": "📚", "title": "Start your learning journey!", "body": "Upload a document to get started."})
        elif active_days >= 5:
            recommendations.append({"icon": "🔥", "title": "You're on fire!", "body": f"Active {active_days}/7 days this week. Keep it up!"})
        elif month_active_days < 5:
            recommendations.append({"icon": "💪", "title": "Stay consistent!", "body": "Try to study more regularly this month."})

    return {
        "week_summary": {
            "total_actions": week_total,
            "active_days":   active_days,
        },
        "month_summary": {
            "total_actions": month_total,
            "active_days":   month_active_days,
        },
        "daily_activity":  daily_activity,
        "recommendations": recommendations,
        "date_range": {
            "start": start_date.isoformat(),
            "end":   ref_date.isoformat(),
        },
        "is_current": is_current,
    }

def decay_streak_if_inactive(user_id: int, db: Session):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return
    today = _today_npt()
    if not user.last_activity_date:
        # Never did any activity — streak should be 0
        if user.streak != 0:
            user.streak = 0
            db.commit()
    elif user.last_activity_date < today - timedelta(days=1):
        user.streak = 0
        db.commit()

@app.get("/api/debug/streak/{email}")
def debug_streak(email: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "email": user.email,
        "streak": user.streak,
        "last_activity_date": str(user.last_activity_date),
        "today_npt": str(_today_npt()),
        "is_active_today": user.last_activity_date == _today_npt(),
    }
@app.delete("/api/notebook/{notebook_id}")
def delete_notebook(notebook_id: int, email: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    notebook = db.query(models.Notebook).filter(
        models.Notebook.id == notebook_id,
        models.Notebook.user_id == user.id  # ensure ownership
    ).first()
    if not notebook:
        raise HTTPException(status_code=404, detail="Notebook not found")

    # Clean up favorites for this notebook
    db.query(models.Favorite).filter(
        models.Favorite.notebook_id == notebook_id
    ).delete()

    db.delete(notebook)
    db.commit()
    return {"success": True, "message": "Notebook deleted."}

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import timedelta

SMTP_HOST     = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT     = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER     = os.getenv("GMAIL_USER", "")
SMTP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD", "")
FRONTEND_URL  = os.getenv("FRONTEND_URL", "http://localhost:5173")

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

@app.post("/api/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    email = req.email.strip().lower()
    user  = db.query(models.User).filter(models.User.email == email).first()

    # Always return success — never reveal whether the email exists
    if not user:
        return {"success": True, "message": "If that email exists, a reset link has been sent."}

    # Create a reset token (valid 30 min)
    token      = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(minutes=30)

    # Invalidate any previous tokens for this user
    db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.user_id == user.id,
        models.PasswordResetToken.used    == 0
    ).delete()

    db.add(models.PasswordResetToken(
        user_id=user.id, token=token, expires_at=expires_at
    ))
    db.commit()

    reset_link = f"{FRONTEND_URL}/reset-password?token={token}"

    # Send email if SMTP is configured, otherwise just print the link
    print(f"[ForgotPassword] Reset link for {email}: {reset_link}")

    if SMTP_USER and SMTP_PASSWORD:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = "PadaiSathi — Reset Your Password"
            msg["From"]    = SMTP_USER
            msg["To"]      = email

            html = f"""
            <h2>Reset Your Password</h2>
            <p>Click the link below to reset your password. It expires in 30 minutes.</p>
            <a href="{reset_link}" style="background:#6d28d9;color:white;padding:12px 24px;
            border-radius:8px;text-decoration:none;display:inline-block;">
            Reset Password
            </a>
            <p>If you didn't request this, ignore this email.</p>
            """
            msg.attach(MIMEText(html, "html"))

            with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
                server.starttls()
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.sendmail(SMTP_USER, email, msg.as_string())
            print(f"[ForgotPassword] Email sent to {email} ✅")
        except Exception as e:
            print(f"[ForgotPassword] Email send failed: {e}")
    else:
        print(f"[ForgotPassword] No SMTP configured — link printed above only")

    return {"success": True, "message": "If that email exists, a reset link has been sent."}


@app.post("/api/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    record = db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.token == req.token,
        models.PasswordResetToken.used  == 0
    ).first()

    if not record:
        raise HTTPException(status_code=400, detail="Invalid or already used reset link.")
    if record.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Reset link has expired. Please request a new one.")

    # Validate new password (reuse your existing rules)
    if len(req.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    if not re.search(r'[A-Z]', req.new_password):
        raise HTTPException(status_code=400, detail="Password must contain at least one uppercase letter")
    if not re.search(r'\d', req.new_password):
        raise HTTPException(status_code=400, detail="Password must contain at least one number")
    if not re.search(r'[^a-zA-Z0-9]', req.new_password):
        raise HTTPException(status_code=400, detail="Password must contain at least one special character")

    user = db.query(models.User).filter(models.User.id == record.user_id).first()
    user.password_hash = simple_hash_password(req.new_password)
    record.used = 1   # mark token as consumed
    db.commit()

    return {"success": True, "message": "Password reset successfully! You can now log in."}


# ── Run ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    print("=" * 60)
    print("🎓 PadaiSathi API v2.0")
    print("  POST /api/upload          → upload + extract PDF text")
    print("  POST /api/summarize       → BART AI summarization + GenZ style")
    print("  POST /api/generate-video  → video generation (async)")
    print("  GET  /api/video-status/N  → poll for video completion")
    print("=" * 60)
    uvicorn.run(app, host="127.0.0.1", port=8000)