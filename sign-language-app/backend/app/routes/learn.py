from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List
from app.services.database import get_db
from app.services.learning_service import (
    LessonService, VocabularyService, QuizService, 
    QuizQuestionService, ProgressService, QuizResultService
)
from app.schemas.learning_schema import (
    LessonResponse, LessonDetailResponse, LessonCreate, LessonUpdate,
    VocabularyResponse, VocabularyCreate, VocabularyUpdate,
    QuizResponse, QuizDetailResponse, QuizCreate, QuizUpdate,
    QuizQuestionResponse, QuizQuestionCreate, QuizQuestionUpdate,
    UserProgressResponse, UserProgressCreate, UserProgressUpdate,
    UserQuizResultResponse, QuizSubmitRequest,
    LearningProgressSummary
)

router = APIRouter()


# ==================== LESSON ENDPOINTS ====================

@router.get("/lessons", response_model=List[LessonResponse])
async def get_all_lessons(
    level: str = Query(None),
    session: AsyncSession = Depends(get_db)
):
    """Lấy tất cả bài học"""
    return await LessonService.get_all_lessons(session, level)


@router.get("/lessons/{lesson_id}", response_model=LessonDetailResponse)
async def get_lesson(
    lesson_id: UUID,
    session: AsyncSession = Depends(get_db)
):
    """Lấy bài học cụ thể với chi tiết"""
    lesson = await LessonService.get_lesson_by_id(session, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson


@router.post("/lessons", response_model=LessonResponse)
async def create_lesson(
    lesson_data: LessonCreate,
    session: AsyncSession = Depends(get_db)
):
    """Tạo bài học mới (Admin only)"""
    return await LessonService.create_lesson(session, lesson_data)


@router.put("/lessons/{lesson_id}", response_model=LessonResponse)
async def update_lesson(
    lesson_id: UUID,
    lesson_data: LessonUpdate,
    session: AsyncSession = Depends(get_db)
):
    """Cập nhật bài học (Admin only)"""
    lesson = await LessonService.update_lesson(session, lesson_id, lesson_data)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson


@router.delete("/lessons/{lesson_id}")
async def delete_lesson(
    lesson_id: UUID,
    session: AsyncSession = Depends(get_db)
):
    """Xóa bài học (Admin only)"""
    success = await LessonService.delete_lesson(session, lesson_id)
    if not success:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return {"message": "Lesson deleted successfully"}


# ==================== VOCABULARY ENDPOINTS ====================

@router.get("/lessons/{lesson_id}/vocabularies", response_model=List[VocabularyResponse])
async def get_lesson_vocabularies(
    lesson_id: UUID,
    session: AsyncSession = Depends(get_db)
):
    """Lấy từ vựng theo bài học"""
    return await VocabularyService.get_vocabularies_by_lesson(session, lesson_id)


@router.post("/vocabularies", response_model=VocabularyResponse)
async def create_vocabulary(
    vocab_data: VocabularyCreate,
    session: AsyncSession = Depends(get_db)
):
    """Tạo từ vựng mới (Admin only)"""
    return await VocabularyService.create_vocabulary(session, vocab_data)


@router.put("/vocabularies/{vocab_id}", response_model=VocabularyResponse)
async def update_vocabulary(
    vocab_id: UUID,
    vocab_data: VocabularyUpdate,
    session: AsyncSession = Depends(get_db)
):
    """Cập nhật từ vựng (Admin only)"""
    vocabulary = await VocabularyService.update_vocabulary(session, vocab_id, vocab_data)
    if not vocabulary:
        raise HTTPException(status_code=404, detail="Vocabulary not found")
    return vocabulary


@router.delete("/vocabularies/{vocab_id}")
async def delete_vocabulary(
    vocab_id: UUID,
    session: AsyncSession = Depends(get_db)
):
    """Xóa từ vựng (Admin only)"""
    success = await VocabularyService.delete_vocabulary(session, vocab_id)
    if not success:
        raise HTTPException(status_code=404, detail="Vocabulary not found")
    return {"message": "Vocabulary deleted successfully"}


# ==================== QUIZ ENDPOINTS ====================

@router.get("/lessons/{lesson_id}/quiz", response_model=QuizDetailResponse)
async def get_lesson_quiz(
    lesson_id: UUID,
    session: AsyncSession = Depends(get_db)
):
    """Lấy quiz của bài học"""
    quiz = await QuizService.get_quiz_by_lesson(session, lesson_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return quiz


@router.get("/quizzes/{quiz_id}", response_model=QuizDetailResponse)
async def get_quiz(
    quiz_id: UUID,
    session: AsyncSession = Depends(get_db)
):
    """Lấy quiz theo ID"""
    quiz = await QuizService.get_quiz_by_id(session, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return quiz


@router.post("/quizzes", response_model=QuizResponse)
async def create_quiz(
    quiz_data: QuizCreate,
    session: AsyncSession = Depends(get_db)
):
    """Tạo quiz mới (Admin only)"""
    return await QuizService.create_quiz(session, quiz_data)


@router.put("/quizzes/{quiz_id}", response_model=QuizResponse)
async def update_quiz(
    quiz_id: UUID,
    quiz_data: QuizUpdate,
    session: AsyncSession = Depends(get_db)
):
    """Cập nhật quiz (Admin only)"""
    quiz = await QuizService.update_quiz(session, quiz_id, quiz_data)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return quiz


@router.delete("/quizzes/{quiz_id}")
async def delete_quiz(
    quiz_id: UUID,
    session: AsyncSession = Depends(get_db)
):
    """Xóa quiz (Admin only)"""
    success = await QuizService.delete_quiz(session, quiz_id)
    if not success:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return {"message": "Quiz deleted successfully"}


# ==================== QUIZ QUESTION ENDPOINTS ====================

@router.get("/quizzes/{quiz_id}/questions", response_model=List[QuizQuestionResponse])
async def get_quiz_questions(
    quiz_id: UUID,
    session: AsyncSession = Depends(get_db)
):
    """Lấy tất cả câu hỏi của quiz"""
    return await QuizQuestionService.get_questions_by_quiz(session, quiz_id)


@router.post("/questions", response_model=QuizQuestionResponse)
async def create_question(
    question_data: QuizQuestionCreate,
    session: AsyncSession = Depends(get_db)
):
    """Tạo câu hỏi mới (Admin only)"""
    return await QuizQuestionService.create_question(session, question_data)


@router.put("/questions/{question_id}", response_model=QuizQuestionResponse)
async def update_question(
    question_id: UUID,
    question_data: QuizQuestionUpdate,
    session: AsyncSession = Depends(get_db)
):
    """Cập nhật câu hỏi (Admin only)"""
    question = await QuizQuestionService.update_question(session, question_id, question_data)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    return question


# ==================== USER PROGRESS ENDPOINTS ====================

@router.get("/users/{user_id}/progress", response_model=List[UserProgressResponse])
async def get_user_progress(
    user_id: UUID,
    session: AsyncSession = Depends(get_db)
):
    """Lấy tiến độ học của người dùng"""
    return await ProgressService.get_all_user_progress(session, user_id)


@router.get("/users/{user_id}/progress/summary", response_model=LearningProgressSummary)
async def get_learning_summary(
    user_id: UUID,
    session: AsyncSession = Depends(get_db)
):
    """Lấy tóm tắt tiến độ học"""
    return await ProgressService.get_learning_summary(session, user_id)


@router.post("/progress", response_model=UserProgressResponse)
async def create_progress(
    progress_data: UserProgressCreate,
    session: AsyncSession = Depends(get_db)
):
    """Tạo/cập nhật tiến độ học"""
    return await ProgressService.create_progress(session, progress_data)


@router.put("/users/{user_id}/lessons/{lesson_id}/progress", response_model=UserProgressResponse)
async def update_progress(
    user_id: UUID,
    lesson_id: UUID,
    progress_data: UserProgressUpdate,
    session: AsyncSession = Depends(get_db)
):
    """Cập nhật tiến độ học"""
    progress = await ProgressService.update_progress(session, user_id, lesson_id, progress_data)
    if not progress:
        raise HTTPException(status_code=404, detail="Progress not found")
    return progress


# ==================== QUIZ SUBMISSION ENDPOINTS ====================

@router.post("/quiz/submit", response_model=UserQuizResultResponse)
async def submit_quiz(
    submit_data: QuizSubmitRequest,
    user_id: UUID = Query(...),
    session: AsyncSession = Depends(get_db)
):
    """Submit quiz và tính điểm"""
    quiz = await QuizService.get_quiz_by_id(session, submit_data.quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    result = await QuizResultService.submit_quiz(session, user_id, submit_data, quiz)
    return result


@router.get("/users/{user_id}/quiz/{quiz_id}/results", response_model=List[UserQuizResultResponse])
async def get_quiz_results(
    user_id: UUID,
    quiz_id: UUID,
    session: AsyncSession = Depends(get_db)
):
    """Lấy tất cả kết quả quiz của người dùng"""
    return await QuizResultService.get_user_quiz_results(session, user_id, quiz_id)


@router.get("/users/{user_id}/quiz/{quiz_id}/latest-result", response_model=UserQuizResultResponse)
async def get_latest_quiz_result(
    user_id: UUID,
    quiz_id: UUID,
    session: AsyncSession = Depends(get_db)
):
    """Lấy kết quả quiz mới nhất"""
    result = await QuizResultService.get_latest_quiz_result(session, user_id, quiz_id)
    if not result:
        raise HTTPException(status_code=404, detail="Quiz result not found")
    return result
