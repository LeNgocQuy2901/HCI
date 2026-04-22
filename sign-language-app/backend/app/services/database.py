from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings
import logging
import os

logger = logging.getLogger(__name__)

Base = declarative_base()

# Use async SQLite for development
database_url = settings.database_url

# Build engine arguments based on database type
engine_args = {
    "echo": settings.sqlalchemy_echo,
    "pool_pre_ping": True,
}

# Only add pool settings for PostgreSQL
if "postgresql" in database_url:
    database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    engine_args.update({
        "pool_size": 20,
        "max_overflow": 40
    })

# Create async engine
async_engine = create_async_engine(database_url, **engine_args)

AsyncSessionLocal = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

async def get_db():
    """Async dependency for database session"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db():
    """Initialize async database tables"""
    try:
        async with async_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        raise
