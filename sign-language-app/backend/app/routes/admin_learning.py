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
    LessonResponse, LessonCreate, LessonUpdate,
    VocabularyResponse, VocabularyCreate, VocabularyUpdate,
    QuizResponse, QuizCreate, QuizUpdate,
    QuizQuestionResponse, QuizQuestionCreate, QuizQuestionUpdate,
    UserQuizResultResponse
)

router = APIRouter()

# ==================== ADMIN DASHBOARD ====================

@router.get("/admin/dashboard/stats")
async def get_dashboard_stats(session: AsyncSession = Depends(get_db)):
    """Get dashboard statistics for admin"""
    from sqlalchemy import select, func
    
    # Total lessons
    total_lessons = await session.execute(select(func.count(LessonService.__class__.__bases__[0].id)))
    
    # Stats data
    stats = {
        "total_lessons": 0,
        "total_quiz": 0,
        "total_questions": 0,
        "total_vocabularies": 0,
        "total_users_learning": 0,
        "average_quiz_score": 0.0,
        "recent_activities": []
    }
    
    return stats


# ==================== LESSON ADMIN ====================

@router.get("/admin/lessons", response_model=List[LessonResponse])
async def admin_get_all_lessons(
    level: str = Query(None),
    is_active: bool = Query(None),
    session: AsyncSession = Depends(get_db)
):
    """Admin: Get all lessons with filters"""
    from sqlalchemy import select, and_
    from app.models import Lesson
    
    query = select(Lesson)
    
    filters = []
    if level:
        filters.append(Lesson.level == level)
    if is_active is not None:
        filters.append(Lesson.is_active == is_active)
    
    if filters:
        query = query.where(and_(*filters))
    
    query = query.order_by(Lesson.order)
    result = await session.execute(query)
    return result.scalars().all()


@router.post("/admin/lessons", response_model=LessonResponse)
async def admin_create_lesson(
    lesson_data: LessonCreate,
    session: AsyncSession = Depends(get_db)
):
    """Admin: Create new lesson"""
    return await LessonService.create_lesson(session, lesson_data)


@router.put("/admin/lessons/{lesson_id}", response_model=LessonResponse)
async def admin_update_lesson(
    lesson_id: UUID,
    lesson_data: LessonUpdate,
    session: AsyncSession = Depends(get_db)
):
    """Admin: Update lesson"""
    lesson = await LessonService.update_lesson(session, lesson_id, lesson_data)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson


@router.delete("/admin/lessons/{lesson_id}")
async def admin_delete_lesson(
    lesson_id: UUID,
    session: AsyncSession = Depends(get_db)
):
    """Admin: Delete lesson"""
    success = await LessonService.delete_lesson(session, lesson_id)
    if not success:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return {"message": "Lesson deleted successfully", "lesson_id": str(lesson_id)}


@router.post("/admin/lessons/{lesson_id}/publish")
async def admin_publish_lesson(
    lesson_id: UUID,
    session: AsyncSession = Depends(get_db)
):
    """Admin: Publish/activate lesson"""
    lesson = await LessonService.get_lesson_by_id(session, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    lesson.is_active = True
    await session.commit()
    return {"message": "Lesson published", "lesson_id": str(lesson_id)}


@router.post("/admin/lessons/{lesson_id}/unpublish")
async def admin_unpublish_lesson(
    lesson_id: UUID,
    session: AsyncSession = Depends(get_db)
):
    """Admin: Unpublish/deactivate lesson"""
    lesson = await LessonService.get_lesson_by_id(session, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    lesson.is_active = False
    await session.commit()
    return {"message": "Lesson unpublished", "lesson_id": str(lesson_id)}


# ==================== VOCABULARY ADMIN ====================

@router.get("/admin/lessons/{lesson_id}/vocabularies", response_model=List[VocabularyResponse])
async def admin_get_vocabularies(
    lesson_id: UUID,
    session: AsyncSession = Depends(get_db)
):
    """Admin: Get all vocabularies for a lesson"""
    return await VocabularyService.get_vocabularies_by_lesson(session, lesson_id)


@router.post("/admin/vocabularies", response_model=VocabularyResponse)
async def admin_create_vocabulary(
    vocab_data: VocabularyCreate,
    session: AsyncSession = Depends(get_db)
):
    """Admin: Create vocabulary"""
    return await VocabularyService.create_vocabulary(session, vocab_data)


@router.put("/admin/vocabularies/{vocab_id}", response_model=VocabularyResponse)
async def admin_update_vocabulary(
    vocab_id: UUID,
    vocab_data: VocabularyUpdate,
    session: AsyncSession = Depends(get_db)
):
    """Admin: Update vocabulary"""
    vocabulary = await VocabularyService.update_vocabulary(session, vocab_id, vocab_data)
    if not vocabulary:
        raise HTTPException(status_code=404, detail="Vocabulary not found")
    return vocabulary


@router.delete("/admin/vocabularies/{vocab_id}")
async def admin_delete_vocabulary(
    vocab_id: UUID,
    session: AsyncSession = Depends(get_db)
):
    """Admin: Delete vocabulary"""
    success = await VocabularyService.delete_vocabulary(session, vocab_id)
    if not success:
        raise HTTPException(status_code=404, detail="Vocabulary not found")
    return {"message": "Vocabulary deleted successfully", "vocab_id": str(vocab_id)}


# ==================== QUIZ ADMIN ====================

@router.get("/admin/quizzes", response_model=List[QuizResponse])
async def admin_get_all_quizzes(
    is_active: bool = Query(None),
    session: AsyncSession = Depends(get_db)
):
    """Admin: Get all quizzes"""
    from sqlalchemy import select
    from app.models import Quiz
    
    query = select(Quiz)
    
    if is_active is not None:
        query = query.where(Quiz.is_active == is_active)
    
    result = await session.execute(query)
    return result.scalars().all()


@router.post("/admin/quizzes", response_model=QuizResponse)
async def admin_create_quiz(
    quiz_data: QuizCreate,
    session: AsyncSession = Depends(get_db)
):
    """Admin: Create quiz"""
    return await QuizService.create_quiz(session, quiz_data)


@router.put("/admin/quizzes/{quiz_id}", response_model=QuizResponse)
async def admin_update_quiz(
    quiz_id: UUID,
    quiz_data: QuizUpdate,
    session: AsyncSession = Depends(get_db)
):
    """Admin: Update quiz"""
    quiz = await QuizService.update_quiz(session, quiz_id, quiz_data)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return quiz


@router.delete("/admin/quizzes/{quiz_id}")
async def admin_delete_quiz(
    quiz_id: UUID,
    session: AsyncSession = Depends(get_db)
):
    """Admin: Delete quiz"""
    success = await QuizService.delete_quiz(session, quiz_id)
    if not success:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return {"message": "Quiz deleted successfully", "quiz_id": str(quiz_id)}


# ==================== QUIZ QUESTION ADMIN ====================

@router.get("/admin/quizzes/{quiz_id}/questions", response_model=List[QuizQuestionResponse])
async def admin_get_quiz_questions(
    quiz_id: UUID,
    session: AsyncSession = Depends(get_db)
):
    """Admin: Get all questions for a quiz"""
    return await QuizQuestionService.get_questions_by_quiz(session, quiz_id)


@router.post("/admin/questions", response_model=QuizQuestionResponse)
async def admin_create_question(
    question_data: QuizQuestionCreate,
    session: AsyncSession = Depends(get_db)
):
    """Admin: Create quiz question"""
    return await QuizQuestionService.create_question(session, question_data)


@router.put("/admin/questions/{question_id}", response_model=QuizQuestionResponse)
async def admin_update_question(
    question_id: UUID,
    question_data: QuizQuestionUpdate,
    session: AsyncSession = Depends(get_db)
):
    """Admin: Update quiz question"""
    question = await QuizQuestionService.update_question(session, question_id, question_data)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    return question


@router.delete("/admin/questions/{question_id}")
async def admin_delete_question(
    question_id: UUID,
    session: AsyncSession = Depends(get_db)
):
    """Admin: Delete quiz question"""
    from app.models import QuizQuestion
    
    question = await QuizQuestionService.get_question_by_id(session, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    await session.delete(question)
    await session.commit()
    return {"message": "Question deleted successfully", "question_id": str(question_id)}


# ==================== ANALYTICS ====================

@router.get("/admin/analytics/lesson/{lesson_id}")
async def admin_get_lesson_analytics(
    lesson_id: UUID,
    session: AsyncSession = Depends(get_db)
):
    """Admin: Get analytics for a lesson"""
    from sqlalchemy import select, func
    from app.models import UserProgress, UserQuizResult, Quiz
    
    # Users who accessed this lesson
    users_accessed = await session.execute(
        select(func.count(UserProgress.id)).where(UserProgress.lesson_id == lesson_id)
    )
    users_accessed = users_accessed.scalar() or 0
    
    # Users who completed this lesson
    users_completed = await session.execute(
        select(func.count(UserProgress.id)).where(
            (UserProgress.lesson_id == lesson_id) & (UserProgress.is_completed == True)
        )
    )
    users_completed = users_completed.scalar() or 0
    
    # Get quiz for this lesson
    quiz = await QuizService.get_quiz_by_lesson(session, lesson_id)
    
    avg_quiz_score = 0.0
    if quiz:
        score_result = await session.execute(
            select(func.avg(UserQuizResult.score)).where(UserQuizResult.quiz_id == quiz.id)
        )
        avg_quiz_score = float(score_result.scalar() or 0)
    
    return {
        "lesson_id": str(lesson_id),
        "users_accessed": users_accessed,
        "users_completed": users_completed,
        "completion_rate": (users_completed / users_accessed * 100) if users_accessed > 0 else 0,
        "average_quiz_score": round(avg_quiz_score, 2)
    }


@router.get("/admin/analytics/quiz/{quiz_id}")
async def admin_get_quiz_analytics(
    quiz_id: UUID,
    session: AsyncSession = Depends(get_db)
):
    """Admin: Get analytics for a quiz"""
    from sqlalchemy import select, func
    from app.models import UserQuizResult
    
    total_attempts = await session.execute(
        select(func.count(UserQuizResult.id)).where(UserQuizResult.quiz_id == quiz_id)
    )
    total_attempts = total_attempts.scalar() or 0
    
    passed_attempts = await session.execute(
        select(func.count(UserQuizResult.id)).where(
            (UserQuizResult.quiz_id == quiz_id) & (UserQuizResult.is_passed == True)
        )
    )
    passed_attempts = passed_attempts.scalar() or 0
    
    avg_score = await session.execute(
        select(func.avg(UserQuizResult.score)).where(UserQuizResult.quiz_id == quiz_id)
    )
    avg_score = float(avg_score.scalar() or 0)
    
    avg_time = await session.execute(
        select(func.avg(UserQuizResult.time_taken)).where(UserQuizResult.quiz_id == quiz_id)
    )
    avg_time = int(avg_time.scalar() or 0)
    
    return {
        "quiz_id": str(quiz_id),
        "total_attempts": total_attempts,
        "passed_attempts": passed_attempts,
        "pass_rate": (passed_attempts / total_attempts * 100) if total_attempts > 0 else 0,
        "average_score": round(avg_score, 2),
        "average_time": avg_time
    }


# ==================== BULK OPERATIONS ====================

@router.post("/admin/lessons/bulk-publish")
async def admin_bulk_publish_lessons(
    lesson_ids: List[UUID],
    session: AsyncSession = Depends(get_db)
):
    """Admin: Publish multiple lessons"""
    from sqlalchemy import select, update
    from app.models import Lesson
    
    await session.execute(
        update(Lesson).where(Lesson.id.in_(lesson_ids)).values(is_active=True)
    )
    await session.commit()
    
    return {"message": f"Published {len(lesson_ids)} lessons"}


@router.post("/admin/lessons/bulk-delete")
async def admin_bulk_delete_lessons(
    lesson_ids: List[UUID],
    session: AsyncSession = Depends(get_db)
):
    """Admin: Delete multiple lessons"""
    from sqlalchemy import select, delete
    from app.models import Lesson
    
    await session.execute(
        delete(Lesson).where(Lesson.id.in_(lesson_ids))
    )
    await session.commit()
    
    return {"message": f"Deleted {len(lesson_ids)} lessons"}


@router.post("/admin/export/lessons")
async def admin_export_lessons(
    session: AsyncSession = Depends(get_db)
):
    """Admin: Export all lessons data"""
    from sqlalchemy import select
    from app.models import Lesson
    import json
    
    lessons = await session.execute(select(Lesson))
    lessons_data = []
    
    for lesson in lessons.scalars().all():
        lessons_data.append({
            "id": str(lesson.id),
            "title": lesson.title,
            "description": lesson.description,
            "level": lesson.level,
            "is_active": lesson.is_active
        })
    
    return {
        "total": len(lessons_data),
        "data": lessons_data,
        "exported_at": str(__import__('datetime').datetime.utcnow())
    }
