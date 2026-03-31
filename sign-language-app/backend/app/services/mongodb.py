from motor.motor_asyncio import AsyncClient, AsyncDatabase
from app.config import settings
import logging

logger = logging.getLogger(__name__)

# MongoDB client
mongo_client: AsyncClient = None
db: AsyncDatabase = None

async def connect_to_mongo():
    """Connect to MongoDB"""
    global mongo_client, db
    try:
        mongo_client = AsyncClient(settings.mongo_url)
        db = mongo_client[settings.mongo_database]
        logger.info("Connected to MongoDB successfully")
    except Exception as e:
        logger.error(f"Error connecting to MongoDB: {e}")
        raise

async def close_mongo_connection():
    """Close MongoDB connection"""
    global mongo_client
    try:
        mongo_client.close()
        logger.info("MongoDB connection closed")
    except Exception as e:
        logger.error(f"Error closing MongoDB connection: {e}")
        raise

def get_mongo_db() -> AsyncDatabase:
    """Get MongoDB database instance"""
    return db
