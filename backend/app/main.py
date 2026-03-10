"""
PadaiSathi API v2.0
Replaces backend/app/main.py
Keeps all your working auth + adds summarize + video generation.
"""
from fastapi import FastAPI, HTTPException, Form, UploadFile, File, Depends, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os, shutil, hashlib
from datetime import datetime
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

app = FastAPI(title="PadaiSathi API", version="2.0")
# Add SessionMiddleware 
from starlette.middleware.sessions import SessionMiddleware
import secrets
app.add_middleware(SessionMiddleware, secret_key=os.getenv("SECRET_KEY", secrets.token_urlsafe(32)))
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
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

# ── Password helpers (same as before) ─────────────────────────────────────────
def simple_hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def simple_verify_password(plain: str, hashed: str) -> bool:
    return simple_hash_password(plain) == hashed

# ── Video job tracker (in-memory) ─────────────────────────────────────────────
_video_jobs: dict = {}   # { summary_id: {status, video_url, error} }

# badges definiations
BADGE_DEFINITIONS = [
    { "id": "first_steps",           "name": "First Steps",           "icon": "🐣", "description": "Upload your first document" },
    { "id": "summary_rookie",        "name": "Summary Rookie",        "icon": "📝", "description": "Generate 3 summaries" },
    { "id": "summary_sensei",        "name": "Summary Sensei",        "icon": "🧠", "description": "Generate 10 summaries" },
    { "id": "flashcard_apprentice",  "name": "Flashcard Apprentice",  "icon": "📇", "description": "Generate 25 flashcards" },
    { "id": "flashcard_god",         "name": "Flashcard God",         "icon": "⚡", "description": "Generate 100 flashcards" },
    { "id": "quiz_rookie",           "name": "Quiz Rookie",           "icon": "❓", "description": "Complete 10 quiz questions" },
    { "id": "quiz_champion",         "name": "Quiz Champion",         "icon": "🏆", "description": "Complete 50 quiz questions" },
    { "id": "video_creator",         "name": "Video Creator",         "icon": "🎬", "description": "Generate 3 videos" },
    { "id": "notebook_collector",    "name": "Notebook Collector",    "icon": "📓", "description": "Create 5 notebooks" },
    { "id": "notebook_hoarder",      "name": "Notebook Hoarder",      "icon": "🗂️", "description": "Create 15 notebooks" },
    { "id": "point_grinder",         "name": "Point Grinder",         "icon": "💰", "description": "Reach 500 points" },
    { "id": "point_millionaire",     "name": "Point Millionaire",     "icon": "👑", "description": "Reach 2000 points" },
    { "id": "streak_starter",        "name": "Streak Starter",        "icon": "🔥", "description": "3-day streak" },
    { "id": "streak_warrior",        "name": "Streak Warrior",        "icon": "⚔️", "description": "30-day streak" },
    { "id": "streak_veteran",        "name": "Streak Veteran",        "icon": "🛡️", "description": "60-day streak" },
    { "id": "streak_legend",         "name": "Streak Legend",         "icon": "💎", "description": "90-day streak" },
    { "id": "overachiever",          "name": "Overachiever",          "icon": "🌟", "description": "Unlock every other badge" },
]
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

@app.post("/api/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(
        (models.User.email == user.email) | (models.User.username == user.username)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email or username already registered")

    new_user = models.User(
        username=user.username,
        email=user.email,
        password_hash=simple_hash_password(user.password),
        role="student", points=100, streak=1,
        created_at=datetime.utcnow()
    )
    db.add(new_user); db.commit(); db.refresh(new_user)
    return {"success": True, "message": f"Welcome {user.username}!", "user": new_user.to_dict()}

@app.post("/api/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
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
    return {"success": True, "message": f"Welcome back, {db_user.username}!", "user": db_user.to_dict()}

@app.get("/api/users")
def get_users(db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    return {"users": [u.to_dict() for u in users], "total": len(users)}


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

    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    file_path = str(UPLOAD_DIR / file.filename)
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
        file_type="pdf",
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
        title=file.filename.replace('.pdf', ''),
        created_at=datetime.utcnow()
    )
    db.add(notebook)
    user.points = (user.points or 0) + 10
    db.commit()
    db.refresh(notebook)
    _check_and_award_badges(user.id, db)


    return {
        "success": True,
        "message": f"PDF '{file.filename}' uploaded successfully!",
        "document_id": doc.id,
        "notebook_id": notebook.id,
        "file_path": file_path,
        "extracted_chars": len(extracted_text or ""),
        "status": "ready_to_summarize",
        "points_earned": 10,
        "total_points": user.points
    }
from .ai.quiz_generator import generate_flashcards_and_quiz

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

    text = summary.summary_text  
    result = generate_flashcards_and_quiz(text, n_flashcards=8, n_quiz=8)

    #  Save each flashcard to database
    saved_flashcards = []
    for card in result["flashcards"]:
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

    _check_and_award_badges(user.id, db)

    return {
        "success": True,
        "flashcards": saved_flashcards,
        "summary_id": req.summary_id
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

    text = summary.summary_text 
    result = generate_flashcards_and_quiz(text, n_flashcards=8, n_quiz=8)

    #  Save each quiz question to database
    saved_questions = []
    for q in result["quiz"]:
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

    _check_and_award_badges(user.id, db)

    return {
        "success": True,
        "questions": saved_questions,
        "summary_id": req.summary_id
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
    _check_and_award_badges(user.id, db)

    return {
        "success": True,
        "summary_id":     summary_record.id,
        "formal_summary": result["formal_summary"],
        "genz_summary":   result["genz_summary"],
        "word_count":     result["word_count"],
        "points_earned":  20,
        "total_points":   user.points,
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


from .minio_storage import upload_video_to_minio

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

        # Upload to MinIO
        video_url = upload_video_to_minio(video_path, filename)
        print(f"[MinIO] ✅ Uploaded: {video_url}")

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
            db.commit()
            _check_and_award_badges(user_id, db)
        finally:
            db.close()

        _video_jobs[summary_id]["status"] = "done"
        _video_jobs[summary_id]["video_url"] = video_url
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
        "videos":     [v.to_dict() for v in videos],
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

    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")

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
                streak=1,
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
                streak=1,
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
        "first_steps":          documents  >= 1,
        "summary_rookie":       summaries  >= 3,
        "summary_sensei":       summaries  >= 10,
        "flashcard_apprentice": flashcards >= 25,
        "flashcard_god":        flashcards >= 100,
        "quiz_rookie":          quizzes    >= 10,
        "quiz_champion":        quizzes    >= 50,
        "video_creator":        videos     >= 3,
        "notebook_collector":   notebooks  >= 5,
        "notebook_hoarder":     notebooks  >= 15,
        "point_grinder":        points     >= 500,
        "point_millionaire":    points     >= 2000,
        "streak_starter":       streak     >= 3,
        "streak_warrior":       streak     >= 30,
        "streak_veteran":       streak     >= 60,
        "streak_legend":        streak     >= 90,
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
        friends.append({
            "friendship_id": f.id,
            "id":       friend_user.id,
            "username": friend_user.username,
            "email":    friend_user.email,
            "points":   friend_user.points,
            "streak":   friend_user.streak,
            "avatar":   friend_user.avatar or "avatar1",
        })

    return {"friends": friends, "count": len(friends)}


# ── Pending requests (incoming) ───────────────────────────────────────────
@app.get("/api/friend-requests")
def pending_requests(email: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    incoming = db.query(models.Friendship).filter(
        models.Friendship.receiver_id == user.id,
        models.Friendship.status == "pending",
    ).all()

    return {
        "requests": [
            {
                "friendship_id": f.id,
                "from_username": f.sender.username,
                "from_email":    f.sender.email,
                "from_avatar":   f.sender.avatar or "avatar1",
                "sent_at":       f.created_at.isoformat(),
            }
            for f in incoming
        ],
        "count": len(incoming),
    }


# ── Search users by username / email ─────────────────────────────────────
@app.get("/api/search-users")
def search_users(q: str, email: str, db: Session = Depends(get_db)):
    """Search users to send friend requests to."""
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
        models.User.id != me.id,        # exclude self
    ).limit(10).all()

    # For each result, figure out relationship status
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
        return f.status   # pending | accepted | declined

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


# ── UPDATED leaderboard — supports ?friends_only=true ────────────────────
# REPLACE your existing /api/leaderboard route with this:

@app.get("/api/leaderboard")
def get_leaderboard(email: str, friends_only: bool = False, db: Session = Depends(get_db)):
    current_user = db.query(models.User).filter(models.User.email == email).first()
    if not current_user:
        raise HTTPException(status_code=401, detail="User not found")

    if friends_only:
        # Get IDs of accepted friends
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

        # Always include self
        friend_ids.add(current_user.id)

        all_users = db.query(models.User).filter(
            models.User.id.in_(friend_ids)
        ).order_by(models.User.points.desc()).all()
    else:
        all_users = db.query(models.User).order_by(models.User.points.desc()).all()

    leaderboard = []
    user_rank   = None

    for i, u in enumerate(all_users):
        entry = {
            "rank":     i + 1,
            "username": u.username,
            "email":    u.email,
            "points":   u.points,
            "avatar":   u.avatar or "avatar1",
            "streak":   u.streak or 0,
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