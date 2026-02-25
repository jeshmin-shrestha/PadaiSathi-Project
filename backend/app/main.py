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

# ── AI modules ────────────────────────────────────────────────────────────────
from .ai.pdf_extractor   import extract_text_from_pdf
from .ai.summarizer      import summarize
from .ai.video_generator import generate_video

# ── DB ────────────────────────────────────────────────────────────────────────
Base.metadata.create_all(bind=engine)

app = FastAPI(title="PadaiSathi API", version="2.0")

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

@app.get("/api/leaderboard")
def get_leaderboard(email: str, db: Session = Depends(get_db)):
    # Get ALL users sorted by points
    all_users = db.query(models.User).order_by(
        models.User.points.desc()
    ).all()

    # Find current user's rank
    current_user = db.query(models.User).filter(
        models.User.email == email
    ).first()

    leaderboard = []
    user_rank = None

    for i, u in enumerate(all_users):
        entry = {
            "rank": i + 1,
            "username": u.username,
            "points": u.points,
            "is_you": u.email == email
        }
        leaderboard.append(entry)
        if u.email == email:
            user_rank = i + 1

    return {
        "leaderboard": leaderboard,
        "your_rank": user_rank,
        "total_users": len(all_users)
    }
from .minio_storage import upload_video_to_minio

def _run_video_pipeline(summary_id: int, genz_text: str, theme: str, user_id: int):
    from .database import SessionLocal
    db = SessionLocal()
    try:
        _video_jobs[summary_id]["status"] = "processing"

        filename = f"video_{summary_id}_{int(datetime.utcnow().timestamp())}.mp4"
        
        # Generate video locally first
        video_path = generate_video(
            summary_text=genz_text,
            output_filename=filename,
            theme=theme,
        )

        # ── Upload to MinIO ──────────────────────
        video_url = upload_video_to_minio(video_path, filename)
        print(f"[MinIO] ✅ Uploaded: {video_url}")

        # Save to Supabase database
        video_record = models.Video(
            summary_id=summary_id,
            user_id=user_id,
            s3_path=video_url,  # stores MinIO URL in Supabase
            background_theme=theme,
            generated_at=datetime.utcnow(),
        )
        db.add(video_record)
        db.commit()

        _video_jobs[summary_id]["status"] = "done"
        _video_jobs[summary_id]["video_url"] = video_url
        print(f"[VideoGen] ✅ Done: {filename}")

    except Exception as e:
        _video_jobs[summary_id]["status"] = "error"
        _video_jobs[summary_id]["error"] = str(e)
        print(f"[VideoGen] ❌ Failed: {e}")
    finally:
        db.close()
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