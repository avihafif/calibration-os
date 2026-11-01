"""Disposable Phase 0A migration and tenant RLS integration check.

Requires a migrated, non-operational Compose database. @req NFR-21
"""

import os
from pathlib import Path
from uuid import UUID, uuid4

import psycopg


def main() -> None:
    password = Path(os.environ["CALOS_DB_PASSWORD_FILE"]).read_text(encoding="utf-8").strip()
    with psycopg.connect(
        host=os.environ["CALOS_DB_HOST"],
        dbname=os.environ["CALOS_DB_NAME"],
        user=os.environ["CALOS_DB_USER"],
        password=password,
        autocommit=True,
    ) as connection:
        row = connection.execute(
            "SELECT deployment_id, environment_kind, non_operational "
            "FROM phase0a_deployment WHERE id = 1"
        ).fetchone()
        assert row is not None
        assert row == (
            UUID(os.environ["CALOS_DEPLOYMENT_ID"]),
            os.environ["CALOS_ENVIRONMENT_KIND"],
            True,
        )
        tenant_a, tenant_b = uuid4(), uuid4()
        row_a, row_b = uuid4(), uuid4()
        for row_id, tenant_id in ((row_a, tenant_a), (row_b, tenant_b)):
            connection.execute(
                "INSERT INTO phase0a_metadata_probe "
                "(id, tenant_id, kind, content, content_digest) "
                "VALUES (%s, %s, %s, %s, %s)",
                (row_id, tenant_id, "Manufacturer", "{}", "sha256:" + "0" * 64),
            )
        try:
            connection.execute("SET ROLE calos_phase0a_probe")
            connection.execute("SELECT set_config('calos.tenant_id', %s, false)", (str(tenant_a),))
            visible = connection.execute(
                "SELECT id FROM phase0a_metadata_probe WHERE id IN (%s, %s)",
                (row_a, row_b),
            ).fetchall()
            assert visible == [(row_a,)]
        finally:
            connection.execute("RESET ROLE")
            connection.execute(
                "DELETE FROM phase0a_metadata_probe WHERE id IN (%s, %s)",
                (row_a, row_b),
            )
    print("Migration identity and tenant RLS probe passed.")


if __name__ == "__main__":
    main()
