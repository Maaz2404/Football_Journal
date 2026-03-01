from models.match import Match
from models.team_squad import TeamSquad
from sqlalchemy import or_
from sqlmodel import Session,select
from fastapi import HTTPException


def validate_motm_player(
    session: Session,
    player_id: int,
    match: Match
):
    # Convert squad date fields into datetime boundaries
    match_datetime = match.utc_date

    statement = select(TeamSquad).where(
        TeamSquad.player_id == player_id,
        TeamSquad.team_id.in_([match.home_team_id, match.away_team_id]),
        # valid_from at start of day
        TeamSquad.valid_from <= match_datetime,
        or_(
            TeamSquad.valid_to == None,
            TeamSquad.valid_to >= match_datetime
        )
    )

    squad_entry = session.exec(statement).first()

    if not squad_entry:
        raise HTTPException(
            status_code=400,
            detail="Selected MOTM player is not valid for this match"
        )
