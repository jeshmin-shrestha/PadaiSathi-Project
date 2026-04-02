# models.py
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, JSON, Date

class User(Base):
    __tablename__ = "users"

    id            = Column(Integer, primary_key=True, index=True)
    username      = Column(String(50), unique=True, nullable=False)
    email         = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role          = Column(String(20), default="student")
    points        = Column(Integer, default=100)
    streak        = Column(Integer, default=1)
    avatar = Column(String(500), nullable=True, default="student")
    created_at    = Column(DateTime, default=datetime.utcnow)

    documents  = relationship("Document",  back_populates="user")
    summaries  = relationship("Summary",   back_populates="user")
    videos     = relationship("Video",     back_populates="user")
    notebooks  = relationship("Notebook",  back_populates="user")
    flashcards = relationship("Flashcard", back_populates="user")
    quizzes    = relationship("Quiz",      back_populates="user")
    last_activity_date = Column(Date, nullable=True) 
    def to_dict(self):
        return {
            "id":       self.id,
            "username": self.username,
            "email":    self.email,
            "role":     self.role,
            "points":   self.points,
            "streak":   self.streak,
            "avatar": self.avatar or "student",
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Document(Base):
    __tablename__ = "documents"

    id             = Column(Integer, primary_key=True, index=True)
    user_id        = Column(Integer, ForeignKey("users.id"), nullable=False)
    file_name      = Column(String(255), nullable=False)
    file_path      = Column(String(500), nullable=False)
    file_type      = Column(String(50), default="pdf")
    upload_date    = Column(DateTime, default=datetime.utcnow)
    extracted_text = Column(Text, nullable=True)

    user      = relationship("User",     back_populates="documents")
    summaries = relationship("Summary",  back_populates="document")
    notebooks = relationship("Notebook", back_populates="document")

    def to_dict(self):
        return {
            "id":          self.id,
            "user_id":     self.user_id,
            "file_name":   self.file_name,
            "file_type":   self.file_type,
            "upload_date": self.upload_date.isoformat(),
            "has_text":    bool(self.extracted_text),
        }


class Summary(Base):
    __tablename__ = "summaries"

    id                 = Column(Integer, primary_key=True, index=True)
    document_id        = Column(Integer, ForeignKey("documents.id"), nullable=False)
    user_id            = Column(Integer, ForeignKey("users.id"), nullable=False)
    summary_text       = Column(Text, nullable=False)
    slang_version_text = Column(Text, nullable=True)
    generated_at       = Column(DateTime, default=datetime.utcnow)

    document   = relationship("Document",  back_populates="summaries")
    user       = relationship("User",      back_populates="summaries")
    videos     = relationship("Video",     back_populates="summary")
    flashcards = relationship("Flashcard", back_populates="summary")
    quizzes    = relationship("Quiz",      back_populates="summary")

    def to_dict(self):
        return {
            "id":                 self.id,
            "document_id":        self.document_id,
            "summary_text":       self.summary_text,
            "slang_version_text": self.slang_version_text,
            "generated_at":       self.generated_at.isoformat(),
        }


class Video(Base):
    __tablename__ = "videos"

    id               = Column(Integer, primary_key=True, index=True)
    summary_id       = Column(Integer, ForeignKey("summaries.id"), nullable=False)
    user_id          = Column(Integer, ForeignKey("users.id"), nullable=False)
    s3_path          = Column(String(500), nullable=False)
    background_theme = Column(String(50), nullable=True)
    generated_at     = Column(DateTime, default=datetime.utcnow)

    summary = relationship("Summary", back_populates="videos")
    user    = relationship("User",    back_populates="videos")

    def to_dict(self):
        return {
            "id":               self.id,
            "summary_id":       self.summary_id,
            "s3_path":          self.s3_path,
            "background_theme": self.background_theme,
            "generated_at":     self.generated_at.isoformat(),
        }


class Notebook(Base):
    __tablename__ = "notebooks"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id"), nullable=False)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    title       = Column(String(255), nullable=False)
    created_at  = Column(DateTime, default=datetime.utcnow)

    user     = relationship("User",     back_populates="notebooks")
    document = relationship("Document", back_populates="notebooks")

    def to_dict(self):
        return {
            "id":          self.id,
            "user_id":     self.user_id,
            "document_id": self.document_id,
            "title":       self.title,
            "created_at":  self.created_at.isoformat(),
        }


class Flashcard(Base):
    __tablename__ = "flashcards"

    id         = Column(Integer, primary_key=True, index=True)
    summary_id = Column(Integer, ForeignKey("summaries.id"), nullable=False)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    question   = Column(Text, nullable=False)
    answer     = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    summary = relationship("Summary", back_populates="flashcards")
    user    = relationship("User",    back_populates="flashcards")

    def to_dict(self):
        return {
            "id":         self.id,
            "summary_id": self.summary_id,
            "question":   self.question,
            "answer":     self.answer,
            "created_at": self.created_at.isoformat(),
        }


class Quiz(Base):
    __tablename__ = "quizzes"

    id             = Column(Integer, primary_key=True, index=True)
    summary_id     = Column(Integer, ForeignKey("summaries.id"), nullable=False)
    user_id        = Column(Integer, ForeignKey("users.id"), nullable=False)
    question       = Column(Text, nullable=False)
    options        = Column(JSON, nullable=False)
    correct_answer = Column(Text, nullable=False)
    created_at     = Column(DateTime, default=datetime.utcnow)

    summary = relationship("Summary", back_populates="quizzes")
    user    = relationship("User",    back_populates="quizzes")

    def to_dict(self):
        return {
            "id":             self.id,
            "summary_id":     self.summary_id,
            "question":       self.question,
            "options":        self.options,
            "correct_answer": self.correct_answer,
            "created_at":     self.created_at.isoformat(),
        }
class Favorite(Base):
    __tablename__ = "favorites"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id"), nullable=False)
    notebook_id = Column(Integer, ForeignKey("notebooks.id"), nullable=False)
    created_at  = Column(DateTime, default=datetime.utcnow)

    user     = relationship("User",     backref="favorites")
    notebook = relationship("Notebook", backref="favorited_by")

    def to_dict(self):
        return {
            "id":          self.id,
            "user_id":     self.user_id,
            "notebook_id": self.notebook_id,
            "created_at":  self.created_at.isoformat(),
        }

# ── ADD THIS to the bottom of your models.py ──────────────────────────────

class Friendship(Base):
    __tablename__ = "friendships"

    id         = Column(Integer, primary_key=True, index=True)
    sender_id  = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id= Column(Integer, ForeignKey("users.id"), nullable=False)
    status     = Column(String(20), default="pending")   # pending | accepted | declined
    created_at = Column(DateTime, default=datetime.utcnow)

    sender   = relationship("User", foreign_keys=[sender_id],   backref="sent_requests")
    receiver = relationship("User", foreign_keys=[receiver_id], backref="received_requests")

    def to_dict(self):
        return {
            "id":          self.id,
            "sender_id":   self.sender_id,
            "receiver_id": self.receiver_id,
            "status":      self.status,
            "created_at":  self.created_at.isoformat(),
        }
       
class UserBadge(Base):
    __tablename__ = "user_badges"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    badge_id   = Column(String(50), nullable=False)  # e.g. "first_steps"
    earned_at  = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", backref="badges")

    def to_dict(self):
        return {
            "id":        self.id,
            "badge_id":  self.badge_id,
            "earned_at": self.earned_at.isoformat(),
        }
class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    token      = Column(String(100), unique=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used       = Column(Integer, default=0)   # 0 = unused, 1 = used

    user = relationship("User", backref="reset_tokens")