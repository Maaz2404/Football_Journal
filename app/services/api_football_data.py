import asyncio
import logging
import httpx
from core.config import get_settings

settings = get_settings()

BASE_URL = settings.FOOTBALL_DATA_BASE_URL
# Keep a reasonably generous overall timeout but a slightly longer connect timeout
TIMEOUT = httpx.Timeout(30.0, connect=10.0)

logger = logging.getLogger(__name__)

# Use a shared AsyncClient to benefit from connection pooling across requests
CLIENT = httpx.AsyncClient(
    timeout=TIMEOUT,
    limits=httpx.Limits(max_connections=10, max_keepalive_connections=5),
)

headers = {"X-Auth-Token": settings.FOOTBALL_DATA_API_KEY}


async def _get(endpoint: str, params: dict | None = None, max_retries: int = 3):
    url = f"{BASE_URL}{endpoint}"
    backoff = 1.0
    for attempt in range(1, max_retries + 1):
        try:
            resp = await CLIENT.get(url, headers=headers, params=params)
            resp.raise_for_status()
            return resp.json()
        except (httpx.ConnectTimeout, httpx.ReadTimeout) as e:
            logger.warning("Timeout fetching %s (attempt %d/%d): %s", url, attempt, max_retries, e)
        except httpx.HTTPStatusError as e:
            # Server responded with 4xx/5xx — no point in retrying immediately for 4xx
            status = e.response.status_code
            logger.error("HTTP error fetching %s: %s", url, e)
            if 500 <= status < 600 and attempt < max_retries:
                # server error — retry
                await asyncio.sleep(backoff)
                backoff *= 2
                continue
            raise
        except Exception as e:
            logger.exception("Error fetching %s (attempt %d/%d)", url, attempt, max_retries)

        if attempt < max_retries:
            await asyncio.sleep(backoff)
            backoff *= 2

    # If we get here, all retries failed — raise a ConnectTimeout to match current behavior
    raise httpx.ConnectTimeout(f"Failed to connect to {url} after {max_retries} attempts")

async def fetch_competitions(code= None ,areas=None):
    params = {}
    if areas:
        params["areas"] = areas
    if code:
           return await _get(f"/competitions/{code}",params)
    return await _get("/competitions",params)

async def fetch_competition_teams(comp_code, season=None):
    params = {}
    if season:
        params["season"] = season
    return await _get(f"/competitions/{comp_code}/teams", params)

async def fetch_competition_matches(comp_code, matchday=None,season=None, dateTo=None, dateFrom=None, status=None):
    params = {}
    if matchday:
        params["matchday"] = matchday
    if season:
        params["season"]=  season
    if dateTo:
        params["dateTo"] = dateTo
    if dateFrom:
      params["dateFrom"] = dateFrom
    if status:
      params["status"] = status         
    return await _get(f"/competitions/{comp_code}/matches", params)

async def fetch_match_details(match_id):
    return await _get(f"/matches/{match_id}")


