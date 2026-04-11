import asyncio
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
import uvicorn

from services.ingestion.ingestion import (
    scheduler_main,
    ingest_matches_job,
)

scheduler_task = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage startup and shutdown events."""
    global scheduler_task

    # --- Startup ---
    if scheduler_task is None:
        scheduler_task = asyncio.create_task(scheduler_main())
        print("Scheduler started...")

    yield

    # --- Shutdown ---
    if scheduler_task:
        scheduler_task.cancel()
        try:
            await scheduler_task
        except asyncio.CancelledError:
            print("Scheduler stopped.")


app = FastAPI(lifespan=lifespan)


# Health check endpoint (for UptimeRobot and Render)
@app.api_route("/", methods=["GET", "HEAD"])
async def health_check():
    return {"status": "Scheduler is running"}


# Trigger endpoint to manually run ingestion
@app.api_route("/trigger", methods=["GET", "HEAD"])
async def trigger():
    await ingest_matches_job()
    return {"status": "ingestion run completed"}


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run(app, host="0.0.0.0", port=port)