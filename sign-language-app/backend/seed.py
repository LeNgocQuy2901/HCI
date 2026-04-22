#!/usr/bin/env python3
"""
Seed database with sample data for development.

Usage:
    python seed.py                  # Load all sample data
    python seed.py lessons          # Load only lessons
    python seed.py vocabularies     # Load only vocabularies
    python seed.py quizzes          # Load only quizzes
    python seed.py --clear          # Clear all data
"""

import asyncio
import sys
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
import uuid
from datetime import datetime
from app.config import settings
from app.models.learning_model import (
    Lesson, Vocabulary, Quiz, QuizQuestion, Base
)

# Create async engine
engine = create_async_engine(
    settings.database_url,
    echo=False,
    future=True,
)

AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

# Sample Data
SAMPLE_LESSONS = [
    {
        "title": "Basic Greetings",
        "description": "Learn common greeting signs in sign language",
        "video_url": "https://example.com/greetings.mp4",
        "thumbnail_url": "https://example.com/greetings.jpg",
        "content": "In this lesson, you'll learn basic greeting signs.",
        "level": "beginner",
        "order": 1,
        "is_active": True,
    },
    {
        "title": "Numbers 1-10",
        "description": "Learn to sign numbers from 1 to 10",
        "video_url": "https://example.com/numbers.mp4",
        "thumbnail_url": "https://example.com/numbers.jpg",
        "content": "Master the basic numbers in sign language.",
        "level": "beginner",
        "order": 2,
        "is_active": True,
    },
    {
        "title": "Everyday Phrases",
        "description": "Common phrases used in daily conversation",
        "video_url": "https://example.com/phrases.mp4",
        "thumbnail_url": "https://example.com/phrases.jpg",
        "content": "Learn useful everyday phrases.",
        "level": "intermediate",
        "order": 3,
        "is_active": True,
    },
]

SAMPLE_VOCABULARIES = {
    0: [  # For "Basic Greetings" lesson
        {
            "word": "Hello",
            "description": "Greeting someone",
            "pronunciation": "hə-ˈlō",
            "example_sentence": "Hello, how are you?",
            "image_url": "https://example.com/hello.jpg",
            "video_url": "https://example.com/hello.mp4",
            "order": 1,
        },
        {
            "word": "Goodbye",
            "description": "Saying farewell",
            "pronunciation": "ˌgud-ˈbī",
            "example_sentence": "Goodbye, see you later!",
            "image_url": "https://example.com/goodbye.jpg",
            "video_url": "https://example.com/goodbye.mp4",
            "order": 2,
        },
        {
            "word": "Please",
            "description": "Polite request word",
            "pronunciation": "ˈplēz",
            "example_sentence": "Please help me.",
            "order": 3,
        },
        {
            "word": "Thank you",
            "description": "Expressing gratitude",
            "pronunciation": "ˈθaŋk ˌyü",
            "example_sentence": "Thank you very much!",
            "order": 4,
        },
    ],
    1: [  # For "Numbers 1-10" lesson
        {
            "word": "One",
            "description": "The number 1",
            "pronunciation": "ˈwən",
            "order": 1,
        },
        {
            "word": "Two",
            "description": "The number 2",
            "pronunciation": "ˈtü",
            "order": 2,
        },
        {
            "word": "Three",
            "description": "The number 3",
            "pronunciation": "ˈthrē",
            "order": 3,
        },
        {
            "word": "Five",
            "description": "The number 5",
            "pronunciation": "ˈfīv",
            "order": 4,
        },
    ],
}

SAMPLE_QUIZZES = {
    0: {  # For "Basic Greetings" lesson
        "title": "Greetings Quiz",
        "description": "Test your knowledge of basic greetings",
        "passing_score": 70,
        "time_limit": 300,
        "is_active": True,
        "questions": [
            {
                "question_text": "What sign is used to greet someone?",
                "question_type": "multiple_choice",
                "option_a": "Hello sign",
                "option_b": "Goodbye sign",
                "option_c": "Thank you sign",
                "option_d": "Please sign",
                "correct_answer": "A",
                "explanation": "The hello sign is the proper greeting.",
                "order": 1,
            },
            {
                "question_text": "True or False: 'Please' is a greeting sign",
                "question_type": "true_false",
                "option_a": "True",
                "option_b": "False",
                "correct_answer": "B",
                "explanation": "'Please' is a courtesy sign, not a greeting.",
                "order": 2,
            },
        ],
    },
    1: {  # For "Numbers 1-10" lesson
        "title": "Numbers Quiz",
        "description": "Test your number signing skills",
        "passing_score": 75,
        "time_limit": 600,
        "is_active": True,
        "questions": [
            {
                "question_text": "What number comes after 4?",
                "question_type": "multiple_choice",
                "option_a": "Three",
                "option_b": "Five",
                "option_c": "Six",
                "option_d": "Seven",
                "correct_answer": "B",
                "explanation": "5 comes after 4.",
                "order": 1,
            },
        ],
    },
}

async def seed_lessons(session: AsyncSession):
    """Seed sample lessons"""
    print("📖 Seeding lessons...")
    for lesson_data in SAMPLE_LESSONS:
        lesson = Lesson(
            id=uuid.uuid4(),
            **lesson_data
        )
        session.add(lesson)
    await session.commit()
    print(f"✓ Added {len(SAMPLE_LESSONS)} lessons")
    return True

async def seed_vocabularies(session: AsyncSession):
    """Seed sample vocabularies"""
    print("📚 Seeding vocabularies...")
    from sqlalchemy import select
    
    lessons = (await session.execute(select(Lesson))).scalars().all()
    total = 0
    
    for lesson_idx, lesson in enumerate(lessons):
        if lesson_idx in SAMPLE_VOCABULARIES:
            for vocab_data in SAMPLE_VOCABULARIES[lesson_idx]:
                vocab = Vocabulary(
                    id=uuid.uuid4(),
                    lesson_id=lesson.id,
                    **vocab_data
                )
                session.add(vocab)
                total += 1
    
    await session.commit()
    print(f"✓ Added {total} vocabulary items")
    return True

async def seed_quizzes(session: AsyncSession):
    """Seed sample quizzes and questions"""
    print("✅ Seeding quizzes...")
    from sqlalchemy import select
    
    lessons = (await session.execute(select(Lesson))).scalars().all()
    total_quizzes = 0
    total_questions = 0
    
    for lesson_idx, lesson in enumerate(lessons):
        if lesson_idx in SAMPLE_QUIZZES:
            quiz_data = SAMPLE_QUIZZES[lesson_idx].copy()
            questions_data = quiz_data.pop("questions", [])
            
            quiz = Quiz(
                id=uuid.uuid4(),
                lesson_id=lesson.id,
                **quiz_data
            )
            session.add(quiz)
            total_quizzes += 1
            
            # Flush to get quiz ID
            await session.flush()
            
            # Add questions
            for question_data in questions_data:
                question = QuizQuestion(
                    id=uuid.uuid4(),
                    quiz_id=quiz.id,
                    **question_data
                )
                session.add(question)
                total_questions += 1
    
    await session.commit()
    print(f"✓ Added {total_quizzes} quizzes with {total_questions} questions")
    return True

async def clear_all(session: AsyncSession):
    """Clear all data"""
    print("🗑️  Clearing all data...")
    from sqlalchemy import delete
    
    await session.execute(delete(QuizQuestion))
    await session.execute(delete(UserQuizResult))
    await session.execute(delete(UserProgress))
    await session.execute(delete(Quiz))
    await session.execute(delete(Vocabulary))
    await session.execute(delete(Lesson))
    
    await session.commit()
    print("✓ All data cleared")

async def main():
    """Main seed function"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with AsyncSessionLocal() as session:
        try:
            if "--clear" in sys.argv:
                await clear_all(session)
                return
            
            if not sys.argv[1:]:
                # Seed all
                await seed_lessons(session)
                await seed_vocabularies(session)
                await seed_quizzes(session)
                print("\n✅ Database seeded successfully!")
            else:
                # Seed specific
                command = sys.argv[1].lower()
                if command == "lessons":
                    await seed_lessons(session)
                elif command == "vocabularies":
                    await seed_vocabularies(session)
                elif command == "quizzes":
                    await seed_quizzes(session)
                else:
                    print(f"Unknown command: {command}")
                    print(__doc__)
                    return
                
                print(f"\n✅ Seeded {command}")
        
        except Exception as e:
            print(f"❌ Error: {e}")
            await session.rollback()
            sys.exit(1)
    
    await engine.dispose()

if __name__ == "__main__":
    print("🌱 SmartSign Database Seeder")
    print("=" * 40)
    asyncio.run(main())
