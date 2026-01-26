from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from .settings import settings

Base = declarative_base()
engine = create_async_engine(settings.database_url, echo=False)
SessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)

async def get_db():
    async with SessionLocal() as session:
        yield session
