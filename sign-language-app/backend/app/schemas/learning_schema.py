from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID

# ==================== VOCABULARY SCHEMAS ====================

class VocabularyBase(BaseModel):
    word: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    example_sentence: Optional[str] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    pronunciation: Optional[str] = None
    order: int = 0


class VocabularyCreate(VocabularyBase):
    lesson_id: UUID


class VocabularyUpdate(BaseModel):
    word: Optional[str] = None
    description: Optional[str] = None
    example_sentence: Optional[str] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    pronunciation: Optional[str] = None
    order: Optional[int] = None


class VocabularyResponse(VocabularyBase):
    id: UUID
    lesson_id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ==================== QUIZ QUESTION SCHEMAS ====================

class QuizQuestionBase(BaseModel):
    question_text: str
    question_type: str = "multiple_choice"  # multiple_choice, true_false, short_answer
    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    correct_answer: str
    explanation: Optional[str] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    order: int = 0


class QuizQuestionCreate(QuizQuestionBase):
    quiz_id: UUID


class QuizQuestionUpdate(BaseModel):
    question_text: Optional[str] = None
    question_type: Optional[str] = None
    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    correct_answer: Optional[str] = None
    explanation: Optional[str] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    order: Optional[int] = None


class QuizQuestionResponse(QuizQuestionBase):
    id: UUID
    quiz_id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ==================== QUIZ SCHEMAS ====================

class QuizBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    passing_score: int = 70
    time_limit: int = 300
    is_active: bool = True


class QuizCreate(QuizBase):
    lesson_id: UUID


class QuizUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    passing_score: Optional[int] = None
    time_limit: Optional[int] = None
    is_active: Optional[bool] = None


class QuizResponse(QuizBase):
    id: UUID
    lesson_id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class QuizDetailResponse(QuizResponse):
    questions: List[QuizQuestionResponse] = []


# ==================== LESSON SCHEMAS ====================

class LessonBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    content: Optional[str] = None
    level: str = "beginner"
    order: int = 0
    is_active: bool = True


class LessonCreate(LessonBase):
    pass


class LessonUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    content: Optional[str] = None
    level: Optional[str] = None
    order: Optional[int] = None
    is_active: Optional[bool] = None


class LessonResponse(LessonBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class LessonDetailResponse(LessonResponse):
    vocabularies: List[VocabularyResponse] = []
    quiz: List[QuizResponse] = []


# ==================== USER PROGRESS SCHEMAS ====================

class UserProgressBase(BaseModel):
    is_completed: bool = False
    time_spent: int = 0


class UserProgressCreate(UserProgressBase):
    user_id: UUID
    lesson_id: UUID


class UserProgressUpdate(BaseModel):
    is_completed: Optional[bool] = None
    time_spent: Optional[int] = None


class UserProgressResponse(UserProgressBase):
    id: UUID
    user_id: UUID
    lesson_id: UUID
    completed_at: Optional[datetime] = None
    last_accessed: datetime
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ==================== QUIZ RESULT SCHEMAS ====================

class UserQuizResultBase(BaseModel):
    score: int
    total_questions: int
    correct_answers: int
    time_taken: int
    is_passed: bool = False
    answers: Optional[str] = None


class UserQuizResultCreate(BaseModel):
    quiz_id: UUID
    user_id: UUID
    score: int
    total_questions: int
    correct_answers: int
    time_taken: int
    answers: Optional[str] = None  # JSON string


class UserQuizResultResponse(UserQuizResultBase):
    id: UUID
    user_id: UUID
    quiz_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True


class QuizSubmitRequest(BaseModel):
    """Request body để submit quiz"""
    quiz_id: UUID
    answers: dict  # {question_id: answer, ...}
    time_taken: int  # Thời gian làm bài (giây)


# ==================== LEARNING PROGRESS SUMMARY ====================

class LearningProgressSummary(BaseModel):
    """Tóm tắt tiến độ học của người dùng"""
    total_lessons: int
    completed_lessons: int
    total_quiz_attempts: int
    average_quiz_score: float
    total_time_spent: int  # Tính bằng giây
    current_level: str  # beginner, intermediate, advanced
    
    class Config:
        from_attributes = True
