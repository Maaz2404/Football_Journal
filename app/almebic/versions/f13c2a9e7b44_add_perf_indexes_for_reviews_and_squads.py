"""add perf indexes for reviews and squads

Revision ID: f13c2a9e7b44
Revises: d55b82c57672
Create Date: 2026-03-11 12:35:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'f13c2a9e7b44'
down_revision: Union[str, Sequence[str], None] = '08b766467980'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_index(
        'ix_review_match_created_at',
        'review',
        ['match_id', 'created_at'],
        unique=False,
    )
    op.create_index(
        'ix_tag_review_id_tag_type',
        'reviewplayertag',
        ['review_id', 'tag_type'],
        unique=False,
    )
    op.create_index(
        'ix_teamsquad_player_team_validity',
        'teamsquad',
        ['player_id', 'team_id', 'valid_from', 'valid_to'],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_teamsquad_player_team_validity', table_name='teamsquad')
    op.drop_index('ix_tag_review_id_tag_type', table_name='reviewplayertag')
    op.drop_index('ix_review_match_created_at', table_name='review')
