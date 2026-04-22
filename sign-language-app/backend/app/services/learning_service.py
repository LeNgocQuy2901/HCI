from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc
from sqlalchemy.orm import joinedload
from uuid import UUID
from typing import List, Optional
from datetime import datetime, timedelta
import json
from app.models import (
    Lesson, Vocabulary, Quiz, QuizQuestion, UserProgress, UserQuizResult, User
)
from app.schemas.learning_schema import (
    LessonCreate, LessonUpdate, VocabularyCreate, VocabularyUpdate,
    QuizCreate, QuizUpdate, QuizQuestionCreate, QuizQuestionUpdate,
    UserProgressCreate, UserProgressUpdate, UserQuizResultCreate,
    QuizSubmitRequest, LearningProgressSummary
)


class LessonService:
    """Service để quản lý Lessons"""
    
    @staticmethod
    async def get_all_lessons(session: AsyncSession, level: Optional[str] = None) -> List[Lesson]:
        """Lấy tất cả bài học"""
        query = select(Lesson).where(Lesson.is_active == True).order_by(Lesson.order)
        
        if level:
            query = query.where(Lesson.level == level)
        
        result = await session.execute(query)
        return result.scalars().all()
    
    @staticmethod
    async def get_lesson_by_id(session: AsyncSession, lesson_id: UUID) -> Optional[Lesson]:
        """Lấy bài học theo ID"""
        query = select(Lesson).where(Lesson.id == lesson_id).options(
            joinedload(Lesson.vocabularies),
            joinedload(Lesson.quiz).joinedload(Quiz.questions)
        )
        result = await session.execute(query)
        return result.unique().scalar_one_or_none()
    
    @staticmethod
    async def create_lesson(session: AsyncSession, lesson_data: LessonCreate) -> Lesson:
        """Tạo bài học mới"""
        lesson = Lesson(**lesson_data.model_dump())
        session.add(lesson)
        await session.commit()
        await session.refresh(lesson)
        return lesson
    
    @staticmethod
    async def update_lesson(session: AsyncSession, lesson_id: UUID, lesson_data: LessonUpdate) -> Optional[Lesson]:
        """Cập nhật bài học"""
        lesson = await LessonService.get_lesson_by_id(session, lesson_id)
        if not lesson:
            return None
        
        update_data = lesson_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(lesson, key, value)
        
        await session.commit()
        await session.refresh(lesson)
        return lesson
    
    @staticmethod
    async def delete_lesson(session: AsyncSession, lesson_id: UUID) -> bool:
        """Xóa bài học"""
        lesson = await LessonService.get_lesson_by_id(session, lesson_id)
        if not lesson:
            return False
        
        await session.delete(lesson)
        await session.commit()
        return True


class VocabularyService:
    """Service để quản lý Vocabulary"""
    
    @staticmethod
    async def get_vocabularies_by_lesson(session: AsyncSession, lesson_id: UUID) -> List[Vocabulary]:
        """Lấy từ vựng theo bài học"""
        query = select(Vocabulary).where(
            Vocabulary.lesson_id == lesson_id
        ).order_by(Vocabulary.order)
        result = await session.execute(query)
        return result.scalars().all()
    
    @staticmethod
    async def get_vocabulary_by_id(session: AsyncSession, vocab_id: UUID) -> Optional[Vocabulary]:
        """Lấy từ vựng theo ID"""
        query = select(Vocabulary).where(Vocabulary.id == vocab_id)
        result = await session.execute(query)
        return result.scalar_one_or_none()
    
    @staticmethod
    async def create_vocabulary(session: AsyncSession, vocab_data: VocabularyCreate) -> Vocabulary:
        """Tạo từ vựng mới"""
        vocabulary = Vocabulary(**vocab_data.model_dump())
        session.add(vocabulary)
        await session.commit()
        await session.refresh(vocabulary)
        return vocabulary
    
    @staticmethod
    async def update_vocabulary(session: AsyncSession, vocab_id: UUID, vocab_data: VocabularyUpdate) -> Optional[Vocabulary]:
        """Cập nhật từ vựng"""
        vocabulary = await VocabularyService.get_vocabulary_by_id(session, vocab_id)
        if not vocabulary:
            return None
        
        update_data = vocab_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(vocabulary, key, value)
        
        await session.commit()
        await session.refresh(vocabulary)
        return vocabulary
    
    @staticmethod
    async def delete_vocabulary(session: AsyncSession, vocab_id: UUID) -> bool:
        """Xóa từ vựng"""
        vocabulary = await VocabularyService.get_vocabulary_by_id(session, vocab_id)
        if not vocabulary:
            return False
        
        await session.delete(vocabulary)
        await session.commit()
        return True


class QuizService:
    """Service để quản lý Quiz"""
    
    @staticmethod
    async def get_quiz_by_id(session: AsyncSession, quiz_id: UUID) -> Optional[Quiz]:
        """Lấy quiz theo ID"""
        query = select(Quiz).where(Quiz.id == quiz_id).options(
            joinedload(Quiz.questions)
        )
        result = await session.execute(query)
        return result.unique().scalar_one_or_none()
    
    @staticmethod
    async def get_quiz_by_lesson(session: AsyncSession, lesson_id: UUID) -> Optional[Quiz]:
        """Lấy quiz theo bài học"""
        query = select(Quiz).where(Quiz.lesson_id == lesson_id).options(
            joinedload(Quiz.questions)
        )
        result = await session.execute(query)
        return result.unique().scalar_one_or_none()
    
    @staticmethod
    async def create_quiz(session: AsyncSession, quiz_data: QuizCreate) -> Quiz:
        """Tạo quiz mới"""
        quiz = Quiz(**quiz_data.model_dump())
        session.add(quiz)
        await session.commit()
        await session.refresh(quiz)
        return quiz
    
    @staticmethod
    async def update_quiz(session: AsyncSession, quiz_id: UUID, quiz_data: QuizUpdate) -> Optional[Quiz]:
        """Cập nhật quiz"""
        quiz = await QuizService.get_quiz_by_id(session, quiz_id)
        if not quiz:
            return None
        
        update_data = quiz_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(quiz, key, value)
        
        await session.commit()
        await session.refresh(quiz)
        return quiz
    
    @staticmethod
    async def delete_quiz(session: AsyncSession, quiz_id: UUID) -> bool:
        """Xóa quiz"""
        quiz = await QuizService.get_quiz_by_id(session, quiz_id)
        if not quiz:
            return False
        
        await session.delete(quiz)
        await session.commit()
        return True


class QuizQuestionService:
    """Service để quản lý Quiz Questions"""
    
    @staticmethod
    async def get_questions_by_quiz(session: AsyncSession, quiz_id: UUID) -> List[QuizQuestion]:
        """Lấy tất cả câu hỏi theo quiz"""
        query = select(QuizQuestion).where(
            QuizQuestion.quiz_id == quiz_id
        ).order_by(QuizQuestion.order)
        result = await session.execute(query)
        return result.scalars().all()
    
    @staticmethod
    async def get_question_by_id(session: AsyncSession, question_id: UUID) -> Optional[QuizQuestion]:
        """Lấy câu hỏi theo ID"""
        query = select(QuizQuestion).where(QuizQuestion.id == question_id)
        result = await session.execute(query)
        return result.scalar_one_or_none()
    
    @staticmethod
    async def create_question(session: AsyncSession, question_data: QuizQuestionCreate) -> QuizQuestion:
        """Tạo câu hỏi mới"""
        question = QuizQuestion(**question_data.model_dump())
        session.add(question)
        await session.commit()
        await session.refresh(question)
        return question
    
    @staticmethod
    async def update_question(session: AsyncSession, question_id: UUID, question_data: QuizQuestionUpdate) -> Optional[QuizQuestion]:
        """Cập nhật câu hỏi"""
        question = await QuizQuestionService.get_question_by_id(session, question_id)
        if not question:
            return None
        
        update_data = question_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(question, key, value)
        
        await session.commit()
        await session.refresh(question)
        return question


class ProgressService:
    """Service để quản lý User Progress"""
    
    @staticmethod
    async def get_user_lesson_progress(session: AsyncSession, user_id: UUID, lesson_id: UUID) -> Optional[UserProgress]:
        """Lấy tiến độ của người dùng cho một bài học"""
        query = select(UserProgress).where(
            and_(UserProgress.user_id == user_id, UserProgress.lesson_id == lesson_id)
        )
        result = await session.execute(query)
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_all_user_progress(session: AsyncSession, user_id: UUID) -> List[UserProgress]:
        """Lấy tất cả tiến độ của người dùng"""
        query = select(UserProgress).where(UserProgress.user_id == user_id).options(
            joinedload(UserProgress.lesson)
        )
        result = await session.execute(query)
        return result.scalars().all()
    
    @staticmethod
    async def create_progress(session: AsyncSession, progress_data: UserProgressCreate) -> UserProgress:
        """Tạo tiến độ mới"""
        # Kiểm tra xem đã tồn tại chưa
        existing = await ProgressService.get_user_lesson_progress(
            session, progress_data.user_id, progress_data.lesson_id
        )
        if existing:
            return existing
        
        progress = UserProgress(**progress_data.model_dump())
        session.add(progress)
        await session.commit()
        await session.refresh(progress)
        return progress
    
    @staticmethod
    async def update_progress(session: AsyncSession, user_id: UUID, lesson_id: UUID, progress_data: UserProgressUpdate) -> Optional[UserProgress]:
        """Cập nhật tiến độ"""
        progress = await ProgressService.get_user_lesson_progress(session, user_id, lesson_id)
        if not progress:
            return None
        
        update_data = progress_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            if key == "is_completed" and value and not progress.is_completed:
                progress.completed_at = datetime.utcnow()
            setattr(progress, key, value)
        
        progress.last_accessed = datetime.utcnow()
        await session.commit()
        await session.refresh(progress)
        return progress
    
    @staticmethod
    async def get_learning_summary(session: AsyncSession, user_id: UUID) -> LearningProgressSummary:
        """Lấy tóm tắt tiến độ học"""
        # Tổng bài học
        total_lessons = await session.execute(select(func.count(Lesson.id)))
        total_lessons = total_lessons.scalar() or 0
        
        # Bài học đã hoàn thành
        completed_query = select(func.count(UserProgress.id)).where(
            and_(UserProgress.user_id == user_id, UserProgress.is_completed == True)
        )
        completed_lessons = await session.execute(completed_query)
        completed_lessons = completed_lessons.scalar() or 0
        
        # Tổng lần làm quiz
        quiz_attempts = await session.execute(
            select(func.count(UserQuizResult.id)).where(UserQuizResult.user_id == user_id)
        )
        quiz_attempts = quiz_attempts.scalar() or 0
        
        # Điểm trung bình quiz
        avg_score = await session.execute(
            select(func.avg(UserQuizResult.score)).where(UserQuizResult.user_id == user_id)
        )
        avg_score = avg_score.scalar() or 0
        
        # Tổng thời gian học
        time_query = select(func.sum(UserProgress.time_spent)).where(UserProgress.user_id == user_id)
        total_time = await session.execute(time_query)
        total_time = total_time.scalar() or 0
        
        # Xác định level hiện tại
        current_level = "beginner"
        if completed_lessons >= total_lessons * 0.5:
            current_level = "intermediate"
        if completed_lessons >= total_lessons * 0.8:
            current_level = "advanced"
        
        return LearningProgressSummary(
            total_lessons=total_lessons,
            completed_lessons=completed_lessons,
            total_quiz_attempts=quiz_attempts,
            average_quiz_score=float(avg_score),
            total_time_spent=int(total_time),
            current_level=current_level
        )


class QuizResultService:
    """Service để quản lý Quiz Results"""
    
    @staticmethod
    async def submit_quiz(session: AsyncSession, user_id: UUID, submit_data: QuizSubmitRequest, quiz: Quiz) -> UserQuizResult:
        """Submit quiz và tính điểm"""
        questions = await QuizQuestionService.get_questions_by_quiz(session, submit_data.quiz_id)
        
        correct_count = 0
        for question in questions:
            user_answer = submit_data.answers.get(str(question.id))
            if user_answer and user_answer == question.correct_answer:
                correct_count += 1
        
        # Tính điểm (percentage)
        total_questions = len(questions)
        score = (correct_count / total_questions * 100) if total_questions > 0 else 0
        is_passed = score >= quiz.passing_score
        
        result = UserQuizResult(
            user_id=user_id,
            quiz_id=submit_data.quiz_id,
            score=int(score),
            total_questions=total_questions,
            correct_answers=correct_count,
            time_taken=submit_data.time_taken,
            is_passed=is_passed,
            answers=json.dumps(submit_data.answers)
        )
        
        session.add(result)
        await session.commit()
        await session.refresh(result)
        
        return result
    
    @staticmethod
    async def get_user_quiz_results(session: AsyncSession, user_id: UUID, quiz_id: UUID) -> List[UserQuizResult]:
        """Lấy tất cả kết quả quiz của người dùng cho một quiz"""
        query = select(UserQuizResult).where(
            and_(UserQuizResult.user_id == user_id, UserQuizResult.quiz_id == quiz_id)
        ).order_by(desc(UserQuizResult.created_at))
        result = await session.execute(query)
        return result.scalars().all()
    
    @staticmethod
    async def get_latest_quiz_result(session: AsyncSession, user_id: UUID, quiz_id: UUID) -> Optional[UserQuizResult]:
        """Lấy kết quả quiz mới nhất"""
        query = select(UserQuizResult).where(
            and_(UserQuizResult.user_id == user_id, UserQuizResult.quiz_id == quiz_id)
        ).order_by(desc(UserQuizResult.created_at)).limit(1)
        result = await session.execute(query)
        return result.scalar_one_or_none()
