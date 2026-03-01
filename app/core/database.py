from sqlmodel import SQLModel
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    create_async_engine,
    async_sessionmaker,
)
from core.config import get_settings

settings = get_settings()

DATABASE_URL = settings.DATABASE_URL  

engine = create_async_engine(
    DATABASE_URL,
    echo=settings.DEBUG,
    future=True,
    connect_args={
        "statement_cache_size": 0
    }
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


async def init_db():
    """
    Called once at startup (dev only).
    Alembic will replace this in prod.
    """
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
