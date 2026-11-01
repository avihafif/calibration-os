"""Non-operational central API shell. @req FR-ENV-02"""

import os
from typing import Literal, cast

from fastapi import FastAPI
from pydantic import BaseModel

from calos_domain import DeploymentIdentity


class Health(BaseModel):
    status: Literal["ok"]
    deployment_id: str
    environment_kind: Literal["test", "production_rehearsal"]
    non_operational: Literal[True]
    simulation_only: Literal[True]


def create_app(identity: DeploymentIdentity) -> FastAPI:
    app = FastAPI(title="CalOS Phase 0A API", version="0.1.0")

    @app.get("/healthz", response_model=Health)
    def healthz() -> Health:
        return Health(
            status="ok",
            deployment_id=identity.deployment_id,
            environment_kind=identity.environment_kind,
            non_operational=True,
            simulation_only=True,
        )

    return app


def _identity_from_environment() -> DeploymentIdentity:
    deployment_id = os.environ.get("CALOS_DEPLOYMENT_ID")
    environment_kind = os.environ.get("CALOS_ENVIRONMENT_KIND")
    if not deployment_id or environment_kind not in {"test", "production_rehearsal"}:
        raise RuntimeError("DEPLOYMENT_IDENTITY_REQUIRED")
    return DeploymentIdentity(
        deployment_id, cast(Literal["test", "production_rehearsal"], environment_kind)
    )


app = create_app(_identity_from_environment())
