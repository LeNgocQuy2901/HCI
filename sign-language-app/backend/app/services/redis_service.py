from redis import asyncio as aioredis
from app.config import settings
import logging

logger = logging.getLogger(__name__)

redis_client = None

async def init_redis():
    """Initialize Redis connection"""
    global redis_client
    try:
        redis_client = await aioredis.from_url(
            settings.redis_url,
            encoding="utf8",
            decode_responses=True
        )
        logger.info("Connected to Redis successfully")
    except Exception as e:
        logger.error(f"Error connecting to Redis: {e}")
        raise

async def close_redis():
    """Close Redis connection"""
    global redis_client
    try:
        await redis_client.close()
        logger.info("Redis connection closed")
    except Exception as e:
        logger.error(f"Error closing Redis connection: {e}")
        raise

def get_redis():
    """Get Redis client instance"""
    return redis_client
