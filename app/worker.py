import asyncio
import os
import traceback
from contextlib import asynccontextmanager
from fastapi import FastAPI
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import httpx 

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

# Health check (Render + UptimeRobot)
@app.api_route("/", methods=["GET", "HEAD"])
async def health_check():
    return {"status": "running"}


@app.api_route("/trigger", methods=["GET", "HEAD"])
async def trigger():
    if job_lock.locked():
        return {"status": "skipped", "reason": "job already running"}
    
    async with job_lock:
        # 1. Warm-up delay: Give Render's container network a moment 
        # to fully initialize if Uptime Robot just woke it up.
        print("⏳ Waiting for network stability...")
        await asyncio.sleep(5)

        max_retries = 2
        for attempt in range(max_retries):
            try:
                print(f"🚀 Running ingestion job (Attempt {attempt + 1})...")
                await ingest_matches_job()
                
                print("✅ Ingestion completed")
                return {"status": "completed"}

            except (httpx.ConnectTimeout, httpx.ConnectError) as net_err:
                # Specific handling for the Render "Cold Start" connection issue
                print(f"⚠️ Connection attempt {attempt + 1} failed: {net_err}")
                if attempt < max_retries - 1:
                    wait_time = 10
                    print(f"🔄 Retrying in {wait_time}s...")
                    await asyncio.sleep(wait_time)
                else:
                    return {
                        "status": "error",
                        "detail": "Network timeout after multiple attempts. Render might be struggling to connect.",
                        "error_type": type(net_err).__name__
                    }

            except Exception as e:
                # Catch-all for other logic errors
                detail = str(e) or repr(e)
                print(f"❌ Ingestion failed: {detail}")
                traceback.print_exc()
                return {
                    "status": "error",
                    "detail": detail,
                    "error_type": type(e).__name__,
                }



if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run(app, host="0.0.0.0", port=port)