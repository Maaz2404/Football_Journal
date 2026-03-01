from datetime import date
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from services.api_football_data import _get
from models.team import Team
from models.player import Player
from models.team_squad import TeamSquad


async def ingest_team_squad(
    session: AsyncSession,
    team: Team,
    snapshot_date: date,
):
    data = await _get(f"/teams/{team.id}")
    squad = data.get("squad", [])

    # Get currently active squad entries
    result = await session.execute(
        select(TeamSquad).where(
            TeamSquad.team_id == team.id,
            TeamSquad.valid_to.is_(None),
        )
    )
    active_entries = result.scalars().all()
    active_player_ids = {e.player_id for e in active_entries}

    new_player_ids = set()

    for p in squad:
        player_id = p["id"]
        new_player_ids.add(player_id)

        player = Player(
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

        if not await session.get(Player, player.id):
            session.add(player)

        if player_id not in active_player_ids:
            session.add(
                TeamSquad(
                    team_id=team.id,
                    player_id=player_id,
                    valid_from=snapshot_date,
                )
            )

    # Close players who left the squad
    for entry in active_entries:
        if entry.player_id not in new_player_ids:
            entry.valid_to = snapshot_date

    await session.commit()
