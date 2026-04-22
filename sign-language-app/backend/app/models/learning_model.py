from sqlalchemy import Column, String, DateTime, Boolean, Integer, ForeignKey, Text, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.services.database import Base

class Lesson(Base):
    """Lesson model - Bài học"""
    __tablename__ = "lessons"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    video_url = Column(String(500), nullable=True)  # URL video ký hiệu
    thumbnail_url = Column(String(500), nullable=True)
    content = Column(Text, nullable=True)  # Nội dung văn bản
    level = Column(String(20), default="beginner", index=True)  # beginner, intermediate, advanced
    order = Column(Integer, default=0)  # Thứ tự bài học
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    vocabularies = relationship("Vocabulary", back_populates="lesson", cascade="all, delete-orphan")
    quiz = relationship("Quiz", back_populates="lesson", cascade="all, delete-orphan")
    user_progress = relationship("UserProgress", back_populates="lesson", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Lesson(id={self.id}, title={self.title}, level={self.level})>"


class Vocabulary(Base):
    """Vocabulary model - Từ vựng"""
    __tablename__ = "vocabularies"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lesson_id = Column(UUID(as_uuid=True), ForeignKey("lessons.id"), nullable=False, index=True)
    word = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)
    example_sentence = Column(String(500), nullable=True)
    image_url = Column(String(500), nullable=True)
    video_url = Column(String(500), nullable=True)
    pronunciation = Column(String(255), nullable=True)
    order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    lesson = relationship("Lesson", back_populates="vocabularies")
    
    def __repr__(self):
        return f"<Vocabulary(id={self.id}, word={self.word})>"


class Quiz(Base):
    """Quiz model - Bài kiểm tra"""
    __tablename__ = "quizzes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lesson_id = Column(UUID(as_uuid=True), ForeignKey("lessons.id"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    passing_score = Column(Integer, default=70)  # Điểm tối thiểu để pass
    time_limit = Column(Integer, default=300)  # Thời gian giới hạn (giây)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    lesson = relationship("Lesson", back_populates="quiz")
    questions = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete-orphan")
    results = relationship("UserQuizResult", back_populates="quiz", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Quiz(id={self.id}, title={self.title})>"


class QuizQuestion(Base):
    """Quiz Question model - Câu hỏi trắc nghiệm"""
    __tablename__ = "quiz_questions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    quiz_id = Column(UUID(as_uuid=True), ForeignKey("quizzes.id"), nullable=False, index=True)
    question_text = Column(Text, nullable=False)
    question_type = Column(String(20), default="multiple_choice")  # multiple_choice, true_false, short_answer
    option_a = Column(String(500), nullable=True)
    option_b = Column(String(500), nullable=True)
    option_c = Column(String(500), nullable=True)
    option_d = Column(String(500), nullable=True)
    correct_answer = Column(String(50), nullable=False)  # A, B, C, D hoặc text
    explanation = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=True)
    video_url = Column(String(500), nullable=True)
    order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    quiz = relationship("Quiz", back_populates="questions")
    
    def __repr__(self):
        return f"<QuizQuestion(id={self.id}, quiz_id={self.quiz_id})>"


class UserProgress(Base):
    """User Progress model - Tiến độ học của người dùng"""
    __tablename__ = "user_progress"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    lesson_id = Column(UUID(as_uuid=True), ForeignKey("lessons.id"), nullable=False, index=True)
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)
    time_spent = Column(Integer, default=0)  # Thời gian học (giây)
    last_accessed = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    lesson = relationship("Lesson", back_populates="user_progress")
    
    def __repr__(self):
        return f"<UserProgress(user_id={self.user_id}, lesson_id={self.lesson_id})>"


class UserQuizResult(Base):
    """User Quiz Result model - Kết quả quiz của người dùng"""
    __tablename__ = "user_quiz_results"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    quiz_id = Column(UUID(as_uuid=True), ForeignKey("quizzes.id"), nullable=False, index=True)
    score = Column(Integer, nullable=False)  # Điểm số
    total_questions = Column(Integer, nullable=False)
    correct_answers = Column(Integer, nullable=False)
    time_taken = Column(Integer, nullable=False)  # Thời gian làm bài (giây)
    is_passed = Column(Boolean, default=False)
    answers = Column(Text, nullable=True)  # JSON string lưu câu trả lời
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    quiz = relationship("Quiz", back_populates="results")
    
    def __repr__(self):
        return f"<UserQuizResult(user_id={self.user_id}, quiz_id={self.quiz_id}, score={self.score})>"
