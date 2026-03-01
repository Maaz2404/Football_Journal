from datetime import date
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from services.api_football_data import fetch_competition_teams
from models.team import Team
from models.player import Player
from models.team_squad import TeamSquad
from models.competition import Competition


async def ingest_competition_teams_and_squads(
    session: AsyncSession,
    competition: Competition,
    snapshot_date: date,
    season: int | None = None,
):
    data = await fetch_competition_teams(competition.code, season)
    teams = data.get("teams", [])

    for t in teams:
        team_id = t["id"]

        # --- TEAM ---
        team = await session.get(Team, team_id)
        if not team:
            team = Team(
                id=team_id,
                name=t["name"],
                short_name=t.get("shortName"),
                crest_url=t.get("crest"),
            )
            session.add(team)

        # --- EXISTING ACTIVE SQUAD ---
        result = await session.execute(
            select(TeamSquad).where(
                TeamSquad.team_id == team_id,
                TeamSquad.valid_to.is_(None),
            )
        )
        active_entries = result.scalars().all()
        active_player_ids = {e.player_id for e in active_entries}

        new_player_ids = set()

        # --- SQUAD ---
        for p in t.get("squad", []):
            player_id = p["id"]
            new_player_ids.add(player_id)

            if not await session.get(Player, player_id):
                session.add(
                    Player(
                        id=player_id,
                        name=p["name"],
                        position=p.get("position"),
                        nationality=p.get("nationality"),
                        date_of_birth=(
                            date.fromisoformat(p["dateOfBirth"])
                            if p.get("dateOfBirth")
                            else None
                        ),
                    )
                )

            if player_id not in active_player_ids:
                session.add(
                    TeamSquad(
                        team_id=team_id,
                        player_id=player_id,
                        valid_from=snapshot_date,
                    )
                )

        # --- CLOSE DEPARTED PLAYERS ---
        for entry in active_entries:
            if entry.player_id not in new_player_ids:
                entry.valid_to = snapshot_date

    await session.commit()
