"""
PadaiSathi API - ULTRA SIMPLE WORKING VERSION
No CORS middleware issues
"""
from fastapi import FastAPI, HTTPException, Form, UploadFile, File
from pydantic import BaseModel
import json
import os
import shutil
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path

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

# Database file
DB_FILE = "padaisathi_db.json"

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

# Helper functions
def load_db():
    if os.path.exists(DB_FILE):
        try:
            with open(DB_FILE, 'r') as f:
                return json.load(f)
        except:
            return {"users": {}}
    return {"users": {}}

def save_db(data):
    with open(DB_FILE, 'w') as f:
        json.dump(data, f, indent=2)

# Initialize database
def init_demo_data():
    db = load_db()
    if not db.get("users"):
        db["users"] = {
            "demo@padai.com": {
                "username": "DemoStudent",
                "email": "demo@padai.com",
                "password": "demo123",
                "points": 150,
                "streak": 7,
                "joined": "2025-12-01",
                "role": "student"
            }
        }
        save_db(db)

init_demo_data()

# ========== ROUTES ==========

@app.get("/")
def root():
    return {
        "app": "PadaiSathi",
        "status": "active",
        "message": "🚀 API is running!",
        "time": datetime.now().isoformat()
    }

@app.get("/api/health")
def health():
    db = load_db()
    return {
        "status": "healthy",
        "users": len(db.get("users", {})),
        "timestamp": datetime.now().isoformat()
    }

@app.post("/api/register")
def register(user: UserCreate):
    db = load_db()
    users = db.get("users", {})
    
    if user.email in users:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    users[user.email] = {
        "username": user.username,
        "email": user.email,
        "password": user.password,
        "points": 100,
        "streak": 1,
        "joined": datetime.now().strftime("%Y-%m-%d"),
        "role": "student"
    }
    
    db["users"] = users
    save_db(db)
    
    return {
        "success": True,
        "message": f"Welcome {user.username}!",
        "user": {
            "username": user.username,
            "email": user.email,
            "points": 100,
            "streak": 1,
            "role": "student"
        }
    }

@app.post("/api/login")
def login(user: UserLogin):
    db = load_db()
    users = db.get("users", {})
    
    if user.email not in users:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    db_user = users[user.email]
    
    if user.password != db_user.get("password", ""):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return {
        "success": True,
        "message": f"Welcome back, {db_user['username']}!",
        "user": {
            "username": db_user["username"],
            "email": user.email,
            "points": db_user.get("points", 0),
            "streak": db_user.get("streak", 0),
            "role": db_user.get("role", "student")
        }
    }

@app.post("/api/upload")
async def upload_pdf(
    email: str = Form(...),
    file: UploadFile = File(...)  # Now accepts real file
):
    db = load_db()
    users = db.get("users", {})
    
    if email not in users:
        raise HTTPException(status_code=401, detail="User not found")
    
    # Validate PDF
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    # Save file to uploads folder
    file_path = os.path.join("uploads", file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Award points
    users[email]["points"] = users[email].get("points", 0) + 10
    db["users"] = users
    save_db(db)
    
    return {
        "success": True,
        "message": f"PDF '{file.filename}' uploaded successfully!",
        "file_path": file_path,
        "status": "processing",
        "points_earned": 10,
        "total_points": users[email]["points"]
    }

@app.get("/api/users")
def get_users():
    db = load_db()
    users = db.get("users", {})
    
    user_list = []
    for email, data in users.items():
        user_list.append({
            "username": data.get("username"),
            "email": email,
            "points": data.get("points", 0)
        })
    
    return {
        "users": user_list,
        "total": len(user_list)
    }

# Run server
if __name__ == "__main__":
    import uvicorn
    
    print("=" * 60)
    print("🎓 PADAIŠATHI API - RUNNING")
    print("=" * 60)
    print("🌐 Open: http://localhost:8000")
    print("📚 Docs: http://localhost:8000/docs")
    print("")
    print("🔐 DEMO CREDENTIALS:")
    print("   Email: demo@padai.com")
    print("   Password: demo123")
    print("=" * 60)
    
    uvicorn.run(app, host="127.0.0.1", port=8000)