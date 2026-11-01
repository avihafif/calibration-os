"""Non-operational central API and gated verification-only route. @req FR-ENV-02"""

import os
from dataclasses import asdict
from typing import Literal, cast

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from calos_domain import DeploymentIdentity
from calos_metadata.package import MAX_PACKAGE_BYTES
from calos_security import PackageVerifier, VerificationError


class Health(BaseModel):
    status: Literal["ok"]
    deployment_id: str
    environment_kind: Literal["test", "production_rehearsal"]
    non_operational: Literal[True]
    simulation_only: Literal[True]


def create_app(identity: DeploymentIdentity, verifier: PackageVerifier | None = None) -> FastAPI:
    app = FastAPI(title="CalOS verification-only API", version="0.2.0")

    @app.get("/healthz", response_model=Health)
    def healthz() -> Health:
        return Health(
            status="ok",
            deployment_id=identity.deployment_id,
            environment_kind=identity.environment_kind,
            non_operational=True,
            simulation_only=True,
        )

    @app.post("/api/v1/config/packages/verify")
    async def verify_package(request: Request) -> JSONResponse:
        # No operational issuer or trust material is provisioned in Phase 0B.
        if verifier is None:
            return JSONResponse({"code": "VERIFIER_UNAVAILABLE"}, status_code=503)
        raw = bytearray()
        async for chunk in request.stream():
            raw.extend(chunk)
            if len(raw) > MAX_PACKAGE_BYTES:
                return JSONResponse({"code": "PACKAGE_TOO_LARGE"}, status_code=413)
        try:
            receipt = verifier.verify(bytes(raw), request.headers.get("authorization"))
        except VerificationError as exc:
            status = 401 if exc.code == "UNAUTHENTICATED" else 403
            if exc.code not in {
                "UNAUTHENTICATED",
                "FORBIDDEN",
                "DEPLOYMENT_MISMATCH",
                "PRODUCTION_CHANGE_CONTROL",
            }:
                status = 422
            return JSONResponse({"code": exc.code}, status_code=status)
        return JSONResponse(asdict(receipt), status_code=200)

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
