"""Loopback station stub. No transport, broker, driver, or run execution exists."""

import os
from typing import Literal, cast

from fastapi import FastAPI
from pydantic import BaseModel


class StationStatus(BaseModel):
    station_mode: Literal["simulator_stub"]
    simulated: Literal[True]
    non_operational: Literal[True]
    deployment_id: str
    environment_kind: Literal["test", "production_rehearsal"]


def create_app(deployment_id: str, environment_kind: str) -> FastAPI:
    if not deployment_id or environment_kind not in {"test", "production_rehearsal"}:
        raise RuntimeError("STATION_DEPLOYMENT_IDENTITY_REQUIRED")
    app = FastAPI(title="CalOS Phase 0A Station Stub", version="0.1.0")

    @app.get("/local/v1/status", response_model=StationStatus)
    def status() -> StationStatus:
        return StationStatus(
            station_mode="simulator_stub",
            simulated=True,
            non_operational=True,
            deployment_id=deployment_id,
            environment_kind=cast(Literal["test", "production_rehearsal"], environment_kind),
        )

    return app


app = create_app(
    os.environ.get("CALOS_DEPLOYMENT_ID", ""),
    os.environ.get("CALOS_ENVIRONMENT_KIND", ""),
)
