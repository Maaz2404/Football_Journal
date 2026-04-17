import asyncio
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
import uvicorn

from services.ingestion.ingestion import scheduler_main, ingest_matches_job

scheduler_task = None
job_lock = asyncio.Lock()  # prevent overlapping runs


async def safe_scheduler():
    try:
        await scheduler_main()
    except Exception as e:
        print(f"❌ Scheduler crashed: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    global scheduler_task

    # --- Startup ---
    if scheduler_task is None:
        scheduler_task = asyncio.create_task(safe_scheduler())
        print("✅ Scheduler started...")

    yield

    # --- Shutdown ---
    if scheduler_task:
        scheduler_task.cancel()
        try:
            await scheduler_task
        except asyncio.CancelledError:
            print("🛑 Scheduler stopped.")


app = FastAPI(lifespan=lifespan)


# Health check (Render + UptimeRobot)
@app.api_route("/", methods=["GET", "HEAD"])
async def health_check():
    return {"status": "running"}


# Manual / automated trigger
@app.api_route("/trigger", methods=["GET", "HEAD"])
async def trigger():
    if job_lock.locked():
        return {"status": "skipped", "reason": "job already running"}

    async with job_lock:
        try:
            print("🚀 Running ingestion job...")
            await ingest_matches_job()
            print("✅ Ingestion completed")
            return {"status": "completed"}
        except Exception as e:
            print(f"❌ Ingestion failed: {e}")
            return {"status": "error", "detail": str(e)}


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run(app, host="0.0.0.0", port=port)