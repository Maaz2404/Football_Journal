from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from sqlalchemy import create_engine
from sqlmodel import SQLModel
from alembic import context
import sys
import os

# add project directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from core.config import get_settings
from models.user import User
from models.competition import Competition
from models.team import Team
from models.player import Player
from models.team_squad import TeamSquad
from models.match import Match
from models.review import Review
from models.review_player_tag import ReviewPlayerTag
from models.review_like import ReviewLike

settings = get_settings()

config = context.config

# Interpret the config file for Python logging.
fileConfig(config.config_file_name)

target_metadata = SQLModel.metadata

# Set SQLAlchemy URL from settings
config.set_main_option("sqlalchemy.url", settings.ALEMBIC_DATABASE_URL)


def run_migrations_offline():
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    connectable = create_engine(config.get_main_option("sqlalchemy.url"))

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
