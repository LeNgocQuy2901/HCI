from fastapi import APIRouter

router = APIRouter()

@router.get("/me")
async def get_profile():
    """Get user profile"""
    return {"message": "Get profile endpoint"}

@router.put("/update")
async def update_profile():
    """Update user profile"""
    return {"message": "Update profile endpoint"}

@router.get("/saved-words")
async def get_saved_words():
    """Get saved words"""
    return {"message": "Get saved words endpoint"}

@router.post("/save-word")
async def save_word():
    """Save word to vocabulary"""
    return {"message": "Save word endpoint"}

@router.get("/statistics")
async def get_statistics():
    """Get user statistics"""
    return {"message": "Get statistics endpoint"}
