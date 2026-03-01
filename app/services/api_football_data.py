import httpx
from core.config import get_settings

settings = get_settings()

BASE_URL = settings.FOOTBALL_DATA_BASE_URL


headers = {"X-Auth-Token": settings.FOOTBALL_DATA_API_KEY}

async def _get(endpoint: str, params: dict = None):
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(f"{BASE_URL}{endpoint}", headers=headers, params=params)
        resp.raise_for_status()
        return resp.json()

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


