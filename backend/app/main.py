"""
PadaiSathi API - ULTRA SIMPLE WORKING VERSION WITH REAL DATABASE
"""
from fastapi import FastAPI, HTTPException, Form, UploadFile, File, Depends
from pydantic import BaseModel
import json
import os
import shutil
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from . import models
from .database import engine, get_db, Base

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="PadaiSathi API",
    version="1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# SIMPLE PASSWORD HASHING (FIX FOR BCRYPT ISSUE)
def simple_hash_password(password: str) -> str:
    # Temporary simple hashing - we'll fix bcrypt later
    import hashlib
    return hashlib.sha256(password.encode()).hexdigest()

def simple_verify_password(plain_password: str, hashed_password: str) -> bool:
    import hashlib
    return hashlib.sha256(plain_password.encode()).hexdigest() == hashed_password

# OR use passlib with a different scheme (MD5 for now)
pwd_context = CryptContext(schemes=["md5_crypt"], deprecated="auto")

# Folder for uploaded PDFs
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Pydantic models
class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

# ========== ROUTES ==========

@app.get("/")
def root():
    return {
        "app": "PadaiSathi",
        "status": "active",
        "message": "🚀 API is running with REAL DATABASE!",
        "database": "SQLite (padaisathi.db)",
        "time": datetime.now().isoformat()
    }

@app.get("/api/health")
def health(db: Session = Depends(get_db)):
    user_count = db.query(models.User).count()
    return {
        "status": "healthy",
        "database": "connected",
        "users": user_count,
        "timestamp": datetime.now().isoformat()
    }

@app.post("/api/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(models.User).filter(
        (models.User.email == user.email) | (models.User.username == user.username)
    ).first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Email or username already registered")
    
    # Create new user with simple hashing
    hashed_password = simple_hash_password(user.password)
    new_user = models.User(
        username=user.username,
        email=user.email,
        password_hash=hashed_password,
        role="student",
        points=100,
        streak=1,
        created_at=datetime.utcnow()
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {
        "success": True,
        "message": f"Welcome {user.username}!",
        "user": new_user.to_dict()
    }

@app.post("/api/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    # DEMO USER LOGIN (hardcoded for now)
    if user.email == "demo@padai.com" and user.password == "demo123":
        # Check if demo user exists, if not create it
        demo_user = db.query(models.User).filter(models.User.email == "demo@padai.com").first()
        if not demo_user:
            demo_user = models.User(
                username="DemoStudent",
                email="demo@padai.com",
                password_hash=simple_hash_password("demo123"),
                role="student",
                points=150,
                streak=7,
                created_at=datetime.utcnow()
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)
        
        return {
            "success": True,
            "message": f"Welcome back, DemoStudent!",
            "user": demo_user.to_dict()
        }
    
    # REAL DATABASE LOGIN
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    
    if not db_user or not simple_verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return {
        "success": True,
        "message": f"Welcome back, {db_user.username}!",
        "user": db_user.to_dict()
    }

@app.post("/api/upload")
async def upload_pdf(
    email: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Find user in database
    user = db.query(models.User).filter(models.User.email == email).first()
    
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    # Validate PDF
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    # Save file to uploads folder
    file_path = os.path.join("uploads", file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Award points in database
    user.points += 10
    db.commit()
    
    return {
        "success": True,
        "message": f"PDF '{file.filename}' uploaded successfully!",
        "file_path": file_path,
        "status": "processing",
        "points_earned": 10,
        "total_points": user.points
    }

@app.get("/api/users")
def get_users(db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    
    return {
        "users": [user.to_dict() for user in users],
        "total": len(users)
    }

# Run server
if __name__ == "__main__":
    import uvicorn
    
    print("=" * 60)
    print("🎓 PADAIŠATHI API - SIMPLE VERSION (No bcrypt issues)")
    print("=" * 60)
    print("🌐 Open: http://localhost:8000")
    print("📚 Docs: http://localhost:8000/docs")
    print("💾 Database: padaisathi.db (SQLite)")
    print("")
    print("🔐 DEMO CREDENTIALS:")
    print("   Email: demo@padai.com")
    print("   Password: demo123")
    print("=" * 60)
    
    uvicorn.run(app, host="127.0.0.1", port=8000)