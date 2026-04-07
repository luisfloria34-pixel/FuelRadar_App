from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Convert DATABASE_URL to async version if needed
def get_async_database_url():
    url = settings.database_url
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql://") and "asyncpg" not in url:
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url

# Sync engine for migrations
def get_sync_database_url():
    url = settings.database_url
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    return url

# Create async engine
async_database_url = get_async_database_url()
try:
    async_engine = create_async_engine(
        async_database_url,
        echo=settings.debug,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
    )
except Exception as e:
    logger.warning(f"Failed to create async engine: {e}")
    async_engine = None

# Create sync engine
sync_database_url = get_sync_database_url()
try:
    sync_engine = create_engine(
        sync_database_url,
        echo=settings.debug,
        pool_pre_ping=True,
    )
except Exception as e:
    logger.warning(f"Failed to create sync engine: {e}")
    sync_engine = None

# Async session factory
if async_engine:
    async_session_factory = sessionmaker(
        async_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
else:
    async_session_factory = None

async def get_async_session():
    if async_session_factory is None:
        raise RuntimeError("Database not configured")
    async with async_session_factory() as session:
        yield session

def get_sync_session():
    if sync_engine is None:
        raise RuntimeError("Database not configured")
    with Session(sync_engine) as session:
        yield session

async def init_db():
    """Create all tables"""
    if async_engine is None:
        logger.warning("Skipping database initialization - no engine available")
        return
    
    from app.models import device, favorite, alert
    
    async with async_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    logger.info("Database tables created")
