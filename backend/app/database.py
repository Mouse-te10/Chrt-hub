from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import os

# Ссылку на базу данных Docker Compose прокинет сам через переменные окружения
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://chrt_admin:chrt_secure_pass@db:5432/chrt_hub_db")

engine = create_async_engine(DATABASE_URL, echo=True)

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Функция-зависимость (Dependency injection) для роутеров FastAPI
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
