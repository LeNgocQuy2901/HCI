from fastapi import APIRouter

router = APIRouter()

@router.get("/lessons")
async def get_lessons():
    """Get all lessons"""
    return {"message": "Get lessons endpoint"}

@router.get("/lesson/{lesson_id}")
async def get_lesson(lesson_id: str):
    """Get specific lesson"""
    return {"message": "Get lesson endpoint"}

@router.post("/quiz")
async def submit_quiz():
    """Submit quiz answers"""
    return {"message": "Submit quiz endpoint"}

@router.get("/score/{user_id}")
async def get_score(user_id: str):
    """Get user score"""
    return {"message": "Get score endpoint"}

@router.get("/vocabulary")
async def get_vocabulary():
    """Get vocabulary list"""
    return {"message": "Get vocabulary endpoint"}
