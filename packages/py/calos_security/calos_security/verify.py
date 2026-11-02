"""Fail-closed, verification-only Class A package boundary. @req NFR-18 @req AC-SEC-13"""

from __future__ import annotations

import base64
import binascii
import re
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Callable, Literal

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat

from calos_domain import DeploymentIdentity
from calos_metadata import PackageError, PackageParser

from .auth import AuthError, JwtAuthenticator


class VerificationError(ValueError):
    def __init__(self, code: str) -> None:
        self.code = code
        super().__init__(code)


@dataclass(frozen=True)
class TrustedMetadataKey:
    key_id: str
    issuer_id: str
    publisher_id: str
    tenant_id: str
    deployment: DeploymentIdentity
    public_key: Ed25519PublicKey
    valid_from: datetime
    valid_until: datetime

    def __post_init__(self) -> None:
        if (
            not self.key_id
            or not self.issuer_id
            or not self.publisher_id
            or not self.tenant_id
            or not isinstance(self.public_key, Ed25519PublicKey)
            or self.valid_from.tzinfo is None
            or self.valid_until.tzinfo is None
            or self.valid_from >= self.valid_until
        ):
            raise VerificationError("PACKAGE_TRUST_INVALID")


@dataclass(frozen=True)
class PackageTrustSnapshot:
    deployment: DeploymentIdentity
    keys: tuple[TrustedMetadataKey, ...]
    expires_at: datetime
    revoked_key_ids: frozenset[str] = frozenset()
    revoked_package_ids: frozenset[str] = frozenset()

    def __post_init__(self) -> None:
        keys = tuple(self.keys)
        ids = [key.key_id for key in keys]
        if (
            self.expires_at.tzinfo is None
            or not keys
            or len(ids) != len(set(ids))
            or any(key.deployment != self.deployment for key in keys)
        ):
            raise VerificationError("PACKAGE_TRUST_INVALID")
        object.__setattr__(self, "keys", keys)
        object.__setattr__(self, "revoked_key_ids", frozenset(self.revoked_key_ids))
        object.__setattr__(self, "revoked_package_ids", frozenset(self.revoked_package_ids))


@dataclass(frozen=True)
class VerificationReceipt:
    package_id: str
    kind: str
    key: str
    item_version: str
    schema_version: int
    content_digest: str
    tenant_id: str
    publisher_id: str
    issuer_id: str
    deployment_id: str
    environment_kind: str
    simulated: Literal[True] = field(default=True, init=False)
    non_operational: Literal[True] = field(default=True, init=False)
    replay_checked: Literal[False] = field(default=False, init=False)
    operational_trust: Literal[False] = field(default=False, init=False)
    import_eligible: Literal[False] = field(default=False, init=False)


def _timestamp(value: str) -> datetime:
    if (
        re.fullmatch(
            r"[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\.[0-9]{1,6})?Z",
            value,
        )
        is None
    ):
        raise VerificationError("PACKAGE_TIME_INVALID")
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise VerificationError("PACKAGE_TIME_INVALID") from exc
    if parsed.tzinfo is None:
        raise VerificationError("PACKAGE_TIME_INVALID")
    return parsed


def _version(value: str) -> tuple[int, int, int]:
    if re.fullmatch(r"[0-9]+\.[0-9]+\.[0-9]+", value) is None:
        raise VerificationError("PACKAGE_COMPATIBILITY_INVALID")
    parts = tuple(int(part) for part in value.split("."))
    return parts[0], parts[1], parts[2]


def _signature(value: str) -> bytes:
    if re.fullmatch(r"[A-Za-z0-9_-]{86}", value) is None:
        raise VerificationError("PACKAGE_SIGNATURE_INVALID")
    try:
        decoded = base64.urlsafe_b64decode(value + "==")
    except (ValueError, binascii.Error) as exc:
        raise VerificationError("PACKAGE_SIGNATURE_INVALID") from exc
    if len(decoded) != 64 or base64.urlsafe_b64encode(decoded).decode().rstrip("=") != value:
        raise VerificationError("PACKAGE_SIGNATURE_INVALID")
    return decoded


class PackageVerifier:
    def __init__(
        self,
        deployment: DeploymentIdentity,
        parser: PackageParser,
        authenticator: JwtAuthenticator,
        trust: PackageTrustSnapshot,
        runtime_version: str,
        clock: Callable[[], datetime] = lambda: datetime.now(timezone.utc),
    ) -> None:
        if trust.deployment != deployment:
            raise VerificationError("DEPLOYMENT_MISMATCH")
        auth_key_bytes = authenticator.trusted_public_key_bytes()
        if any(
            key.public_key.public_bytes(Encoding.Raw, PublicFormat.Raw) in auth_key_bytes
            for key in trust.keys
        ):
            raise VerificationError("TRUST_ROLE_CONFLICT")
        self._deployment = deployment
        self._parser = parser
        self._authenticator = authenticator
        self._trust = trust
        self._runtime = _version(runtime_version)
        self._clock = clock

    @property
    def deployment(self) -> DeploymentIdentity:
        return self._deployment

    def verify(self, raw: bytes, authorization: str | None) -> VerificationReceipt:
        try:
            principal = self._authenticator.authenticate(authorization)
        except AuthError as exc:
            raise VerificationError(exc.code) from exc
        if principal.deployment != self._deployment:
            raise VerificationError("DEPLOYMENT_MISMATCH")
        if self._deployment.environment_kind != "test":
            raise VerificationError("PRODUCTION_CHANGE_CONTROL")
        if "package.import" not in principal.permissions:
            raise VerificationError("FORBIDDEN")
        try:
            package = self._parser.parse(raw)
        except PackageError as exc:
            raise VerificationError(exc.code) from exc
        manifest = package.manifest
        now = self._clock()
        if now.tzinfo is None or self._trust.expires_at <= now:
            raise VerificationError("PACKAGE_TRUST_STALE")
        if (
            manifest["deployment_id"] != self._deployment.deployment_id
            or manifest["environment_kind"] != self._deployment.environment_kind
        ):
            raise VerificationError("DEPLOYMENT_MISMATCH")
        if manifest["tenant_id"] != principal.tenant_id:
            raise VerificationError("FORBIDDEN")
        if manifest["provenance_status"] != "synthetic_demo":
            raise VerificationError("PACKAGE_PROVENANCE_UNSUPPORTED")
        issued = _timestamp(manifest["issued_at"])
        expires = _timestamp(manifest["expires_at"])
        if issued > now or expires <= now or expires <= issued:
            raise VerificationError("PACKAGE_EXPIRED")
        if not (
            _version(manifest["runtime_min"]) <= self._runtime <= _version(manifest["runtime_max"])
        ):
            raise VerificationError("PACKAGE_INCOMPATIBLE")
        if manifest["package_id"] in self._trust.revoked_package_ids:
            raise VerificationError("PACKAGE_REVOKED")
        if manifest["key_id"] in self._trust.revoked_key_ids:
            raise VerificationError("PACKAGE_KEY_REVOKED")
        candidates = [key for key in self._trust.keys if key.key_id == manifest["key_id"]]
        if len(candidates) != 1:
            raise VerificationError("RELEASE_ISSUER_UNTRUSTED")
        key = candidates[0]
        if (
            key.issuer_id != manifest["issuer_id"]
            or key.publisher_id != manifest["publisher_id"]
            or key.tenant_id != manifest["tenant_id"]
            or key.deployment != self._deployment
            or not (key.valid_from <= issued < key.valid_until)
            or now >= key.valid_until
        ):
            raise VerificationError("RELEASE_ISSUER_UNTRUSTED")
        try:
            key.public_key.verify(_signature(package.signature), package.signed_bytes)
        except InvalidSignature as exc:
            raise VerificationError("PACKAGE_SIGNATURE_INVALID") from exc
        return VerificationReceipt(
            package_id=manifest["package_id"],
            kind=manifest["kind"],
            key=manifest["key"],
            item_version=manifest["item_version"],
            schema_version=manifest["schema_version"],
            content_digest=manifest["content_digest"],
            tenant_id=manifest["tenant_id"],
            publisher_id=manifest["publisher_id"],
            issuer_id=manifest["issuer_id"],
            deployment_id=manifest["deployment_id"],
            environment_kind=manifest["environment_kind"],
        )
