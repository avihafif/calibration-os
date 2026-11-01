"""Phase 0A deployment and RLS probe tables. @req FR-ENV-01 @req NFR-21

Revision ID: 0001_phase0a
Revises:
"""

from alembic import op
import os
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from uuid import UUID

revision = "0001_phase0a"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "phase0a_deployment",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("deployment_id", postgresql.UUID(as_uuid=True), nullable=False, unique=True),
        sa.Column("environment_kind", sa.String(32), nullable=False),
        sa.Column("non_operational", sa.Boolean(), nullable=False),
        sa.CheckConstraint("id = 1", name="one_deployment"),
        sa.CheckConstraint("non_operational = true", name="phase0a_non_operational"),
        sa.CheckConstraint(
            "environment_kind IN ('test', 'production_rehearsal')", name="phase0a_kind"
        ),
    )
    deployment_id = UUID(os.environ["CALOS_DEPLOYMENT_ID"])
    environment_kind = os.environ["CALOS_ENVIRONMENT_KIND"]
    if environment_kind not in {"test", "production_rehearsal"}:
        raise RuntimeError("DEPLOYMENT_IDENTITY_REQUIRED")
    op.get_bind().execute(
        sa.text(
            "INSERT INTO phase0a_deployment "
            "(id, deployment_id, environment_kind, non_operational) "
            "VALUES (1, :deployment_id, :environment_kind, true)"
        ),
        {"deployment_id": deployment_id, "environment_kind": environment_kind},
    )
    op.create_table(
        "phase0a_metadata_probe",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("kind", sa.String(80), nullable=False),
        sa.Column("content", postgresql.JSONB(), nullable=False),
        sa.Column("content_digest", sa.String(71), nullable=False),
    )
    op.execute("ALTER TABLE phase0a_metadata_probe ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE phase0a_metadata_probe FORCE ROW LEVEL SECURITY")
    op.execute(
        "CREATE POLICY tenant_only ON phase0a_metadata_probe "
        "USING (tenant_id = nullif(current_setting('calos.tenant_id', true), '')::uuid) "
        "WITH CHECK (tenant_id = nullif(current_setting('calos.tenant_id', true), '')::uuid)"
    )
    op.execute(
        "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'calos_phase0a_probe') "
        "THEN CREATE ROLE calos_phase0a_probe NOLOGIN; END IF; END $$"
    )
    op.execute("GRANT SELECT, INSERT ON phase0a_metadata_probe TO calos_phase0a_probe")


def downgrade() -> None:
    op.drop_table("phase0a_metadata_probe")
    op.drop_table("phase0a_deployment")
