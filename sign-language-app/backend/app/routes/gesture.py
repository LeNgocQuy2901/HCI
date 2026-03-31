from fastapi import APIRouter

router = APIRouter()

@router.get("/recognize")
async def recognize_gesture():
    """Recognize gesture from image/video"""
    return {"message": "Gesture recognition endpoint"}

@router.post("/train")
async def train_gesture():
    """Train gesture model with new data"""
    return {"message": "Train gesture endpoint"}

@router.get("/list")
async def list_gestures():
    """List all available gestures"""
    return {"message": "List gestures endpoint"}
