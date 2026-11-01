"""Verification-only bearer authentication foundation. @req FR-ENV-02 @req AC-SEC-13

No token issuer, account store, refresh flow or operational trust provisioning exists here.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from types import MappingProxyType
from typing import Callable, Mapping

import jwt
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

from calos_domain import DeploymentIdentity


class AuthError(ValueError):
    def __init__(self, code: str) -> None:
        self.code = code
        super().__init__(code)


@dataclass(frozen=True)
class AuthTrustSnapshot:
    deployment: DeploymentIdentity
    issuer: str
    audience: str
    public_keys: Mapping[str, Ed25519PublicKey]
    expires_at: datetime
    revoked_key_ids: frozenset[str] = frozenset()

    def __post_init__(self) -> None:
        object.__setattr__(self, "public_keys", MappingProxyType(dict(self.public_keys)))


@dataclass(frozen=True)
class Principal:
    subject: str
    tenant_id: str
    deployment: DeploymentIdentity
    permissions: frozenset[str]


class JwtAuthenticator:
    def __init__(
        self,
        deployment: DeploymentIdentity,
        trust: AuthTrustSnapshot,
        clock: Callable[[], datetime] = lambda: datetime.now(timezone.utc),
    ) -> None:
        if trust.deployment != deployment:
            raise AuthError("DEPLOYMENT_MISMATCH")
        self._deployment = deployment
        self._trust = trust
        self._clock = clock

    def authenticate(self, authorization: str | None) -> Principal:
        now = self._clock()
        if now.tzinfo is None or self._trust.expires_at <= now:
            raise AuthError("UNAUTHENTICATED")
        if not authorization or not authorization.startswith("Bearer "):
            raise AuthError("UNAUTHENTICATED")
        token = authorization.removeprefix("Bearer ")
        if not token or len(token) > 8192 or any(c.isspace() for c in token):
            raise AuthError("UNAUTHENTICATED")
        try:
            header = jwt.get_unverified_header(token)
            if (
                header.get("alg") != "EdDSA"
                or header.get("typ") != "JWT"
                or "crit" in header
                or not isinstance(header.get("kid"), str)
            ):
                raise AuthError("UNAUTHENTICATED")
            kid = header["kid"]
            if kid in self._trust.revoked_key_ids:
                raise AuthError("UNAUTHENTICATED")
            key = self._trust.public_keys.get(kid)
            if key is None:
                raise AuthError("UNAUTHENTICATED")
            claims = jwt.decode(
                token,
                key,
                algorithms=["EdDSA"],
                issuer=self._trust.issuer,
                audience=self._trust.audience,
                options={
                    "require": [
                        "iss",
                        "aud",
                        "sub",
                        "exp",
                        "iat",
                        "nbf",
                        "tenant_id",
                        "deployment_id",
                        "environment_kind",
                        "permissions",
                        "principal_type",
                    ],
                    "strict_aud": True,
                },
            )
        except AuthError:
            raise
        except (jwt.PyJWTError, ValueError, TypeError) as exc:
            raise AuthError("UNAUTHENTICATED") from exc
        if claims.get("principal_type") != "user":
            raise AuthError("UNAUTHENTICATED")
        subject = claims.get("sub")
        tenant_id = claims.get("tenant_id")
        permissions = claims.get("permissions")
        if (
            not isinstance(subject, str)
            or not subject
            or not isinstance(tenant_id, str)
            or not tenant_id
            or not isinstance(permissions, list)
            or any(not isinstance(permission, str) for permission in permissions)
        ):
            raise AuthError("UNAUTHENTICATED")
        if (
            claims.get("deployment_id") != self._deployment.deployment_id
            or claims.get("environment_kind") != self._deployment.environment_kind
        ):
            raise AuthError("DEPLOYMENT_MISMATCH")
        return Principal(subject, tenant_id, self._deployment, frozenset(permissions))
