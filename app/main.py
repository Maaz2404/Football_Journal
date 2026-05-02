from fastapi import FastAPI
from fastapi import Request
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from core.config import get_settings
from core.database import init_db
from time import perf_counter
import logging
import os
import uvicorn
from services.api_football_data import CLIENT as API_CLIENT

settings = get_settings()
logger = logging.getLogger("uvicorn.error")
SLOW_REQUEST_MS = int(os.environ.get("SLOW_REQUEST_MS", "800"))


@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- startup ---
    if settings.ENV == "development":
        await init_db()
    yield
    # --- shutdown ---
    # Close shared HTTPX client from api_football_data if available
    try:
        await API_CLIENT.aclose()
    except Exception:
        logger.exception("Error closing API HTTP client")


app = FastAPI(
    title=settings.APP_NAME,
    lifespan=lifespan
)


@app.middleware("http")
async def request_timing_middleware(request: Request, call_next):
    start = perf_counter()
    try:
        response = await call_next(request)
    except Exception:
        duration_ms = (perf_counter() - start) * 1000
        logger.exception(
            "request_failed method=%s path=%s duration_ms=%.2f",
            request.method,
            request.url.path,
            duration_ms,
        )
        raise

    duration_ms = (perf_counter() - start) * 1000
    response.headers["X-Process-Time-Ms"] = f"{duration_ms:.2f}"

    log_msg = (
        "request_complete method=%s path=%s status=%s duration_ms=%.2f origin=%s"
    )
    log_args = (
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
        request.headers.get("origin", "-"),
    )

    if duration_ms >= SLOW_REQUEST_MS:
        logger.warning(log_msg, *log_args)
    else:
        logger.info(log_msg, *log_args)

    return response

origins = [
    "http://localhost:3000",          # Next.js local dev
    "https://futbook.vercel.app", 
    "https://www.footbook.app",
    "https://footbook.app",
    "https://dashboard.uptimerobot.com/"
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

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 8000)),
    )
