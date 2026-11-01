"""Alembic environment for the non-operational Phase 0A database probe."""

import os
from pathlib import Path

from alembic import context
from sqlalchemy import create_engine, pool
from sqlalchemy.engine import URL


def _url() -> URL:
    secret_path = os.environ.get("CALOS_DB_PASSWORD_FILE")
    if not secret_path:
        raise RuntimeError("DATABASE_SECRET_FILE_REQUIRED")
    password = Path(secret_path).read_text(encoding="utf-8").strip()
    return URL.create(
        drivername="postgresql+psycopg",
        username=os.environ["CALOS_DB_USER"],
        password=password,
        host=os.environ["CALOS_DB_HOST"],
        database=os.environ["CALOS_DB_NAME"],
    )


def run_migrations_online() -> None:
    engine = create_engine(_url(), poolclass=pool.NullPool)
    with engine.connect() as connection:
        context.configure(connection=connection, target_metadata=None)
        with context.begin_transaction():
            context.run_migrations()
    engine.dispose()


run_migrations_online()
