"""Non-operational central API and gated verification-only route. @req FR-ENV-02"""

import logging
import os
import uuid
from dataclasses import asdict
from typing import Callable, Literal, cast

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from calos_domain import DeploymentIdentity
from calos_metadata.package import MAX_PACKAGE_BYTES
from calos_security import PackageVerifier, VerificationError

LOGGER = logging.getLogger("calos.api.package_verification")


def _new_request_id() -> str:
    return uuid.uuid4().hex


def _problem(code: str, status: int, request_id: str) -> JSONResponse:
    headers = {"X-Request-Id": request_id}
    if status == 401:
        headers["WWW-Authenticate"] = "Bearer"
    return JSONResponse(
        {"type": "about:blank", "status": status, "code": code, "correlation_id": request_id},
        status_code=status,
        media_type="application/problem+json",
        headers=headers,
    )


class Health(BaseModel):
    status: Literal["ok"]
    deployment_id: str
    environment_kind: Literal["test", "production_rehearsal"]
    non_operational: Literal[True]
    simulation_only: Literal[True]


def create_app(
    identity: DeploymentIdentity,
    verifier: PackageVerifier | None = None,
    request_id_factory: Callable[[], str] = _new_request_id,
) -> FastAPI:
    if verifier is not None and verifier.deployment != identity:
        raise ValueError("DEPLOYMENT_MISMATCH")
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
        request_id = request_id_factory()
        # No operational issuer or trust material is provisioned in Phase 0B.
        if verifier is None:
            LOGGER.warning(
                "package_verifier_unavailable code=VERIFIER_UNAVAILABLE correlation_id=%s",
                request_id,
                extra={"code": "VERIFIER_UNAVAILABLE", "correlation_id": request_id},
            )
            return _problem("VERIFIER_UNAVAILABLE", 503, request_id)
        raw = bytearray()
        async for chunk in request.stream():
            if len(chunk) > MAX_PACKAGE_BYTES - len(raw):
                LOGGER.warning(
                    "package_verify_rejected code=PACKAGE_TOO_LARGE correlation_id=%s",
                    request_id,
                    extra={"code": "PACKAGE_TOO_LARGE", "correlation_id": request_id},
                )
                return _problem("PACKAGE_TOO_LARGE", 413, request_id)
            raw.extend(chunk)
        try:
            receipt = verifier.verify(bytes(raw), request.headers.get("authorization"))
        except VerificationError as exc:
            status = 401 if exc.code == "UNAUTHENTICATED" else 403
            if exc.code in {"PACKAGE_TRUST_STALE", "AUTH_TRUST_INVALID", "PACKAGE_TRUST_INVALID"}:
                status = 503
            elif exc.code not in {
                "UNAUTHENTICATED",
                "FORBIDDEN",
                "DEPLOYMENT_MISMATCH",
                "PRODUCTION_CHANGE_CONTROL",
            }:
                status = 422
            LOGGER.warning(
                "package_verify_rejected code=%s correlation_id=%s",
                exc.code,
                request_id,
                extra={"code": exc.code, "correlation_id": request_id},
            )
            return _problem(exc.code, status, request_id)
        LOGGER.info(
            "package_verified correlation_id=%s",
            request_id,
            extra={"correlation_id": request_id},
        )
        return JSONResponse(asdict(receipt), status_code=200, headers={"X-Request-Id": request_id})

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
