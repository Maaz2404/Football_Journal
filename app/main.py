from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from core.config import get_settings
from core.database import init_db
import uvicorn

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- startup ---
    if settings.ENV == "development":
        await init_db()
    yield
    # --- shutdown ---
    # (close db connections later if needed)


app = FastAPI(
    title=settings.APP_NAME,
    lifespan=lifespan
)

origins = [
    "http://localhost:3000",          # Next.js local dev
    "https://futbook.vercel.app", 
    "https://www.footbook.app",
    "https://footbook.app",           # Production frontend
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from api import auth, matches, reviews, stats


app.include_router(auth.router)
app.include_router(matches.router)
app.include_router(reviews.router)
app.include_router(stats.router)


import os

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 8000)),
    )
