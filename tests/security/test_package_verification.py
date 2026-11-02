"""In-memory cryptographic acceptance vectors. @req AC-SEC-03 @req AC-SEC-13"""

import base64
import asyncio
import json
import os
import unittest
from dataclasses import replace
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch

import jwt
import httpx
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

from calos_domain import DeploymentIdentity
from calos_metadata import PackageParser, canonical_bytes, content_digest
from calos_security import (
    AuthError,
    AuthTrustSnapshot,
    JwtAuthenticator,
    PackageTrustSnapshot,
    PackageVerifier,
    TrustedMetadataKey,
    VerificationError,
)

ROOT = Path(__file__).resolve().parents[2]
TEST_ID = DeploymentIdentity("00000000-0000-4000-8000-0000000000a1", "test")
OTHER_ID = "00000000-0000-4000-8000-0000000000a2"


class VerificationTests(unittest.TestCase):
    def setUp(self) -> None:
        # Private keys exist only in this test process and are never persisted.
        self.now = datetime.now(timezone.utc).replace(microsecond=0)
        self.package_private = Ed25519PrivateKey.generate()
        self.auth_private = Ed25519PrivateKey.generate()
        self.package_key = TrustedMetadataKey(
            "package-key",
            "fixture-issuer",
            "fixture-publisher",
            "synthetic-tenant",
            TEST_ID,
            self.package_private.public_key(),
            self.now - timedelta(days=1),
            self.now + timedelta(days=1),
        )
        self.package_trust = PackageTrustSnapshot(
            TEST_ID, (self.package_key,), self.now + timedelta(hours=1)
        )
        self.auth_trust = AuthTrustSnapshot(
            TEST_ID,
            "fixture-auth-issuer",
            "calos-phase0b-test",
            {"auth-key": self.auth_private.public_key()},
            self.now + timedelta(hours=1),
        )
        self.fixture = json.loads(
            (ROOT / "fixtures" / "manufacturer" / "valid.json").read_text(encoding="utf-8")
        )
        self.parser = PackageParser(ROOT)

    def verifier(self, trust: PackageTrustSnapshot | None = None) -> PackageVerifier:
        return PackageVerifier(
            TEST_ID,
            self.parser,
            JwtAuthenticator(TEST_ID, self.auth_trust),
            trust or self.package_trust,
            "0.1.0",
            lambda: self.now,
        )

    def token(self, **changes: object) -> str:
        claims: dict[str, object] = {
            "iss": "fixture-auth-issuer",
            "aud": "calos-phase0b-test",
            "sub": "fixture-user",
            "iat": int(self.now.timestamp()),
            "nbf": int((self.now - timedelta(seconds=1)).timestamp()),
            "exp": int((self.now + timedelta(minutes=30)).timestamp()),
            "tenant_id": "synthetic-tenant",
            "deployment_id": TEST_ID.deployment_id,
            "environment_kind": "test",
            "permissions": ["package.import"],
            "principal_type": "user",
        }
        claims.update(changes)
        return "Bearer " + jwt.encode(
            claims, self.auth_private, algorithm="EdDSA", headers={"kid": "auth-key", "typ": "JWT"}
        )

    def envelope(self, **changes: object) -> dict:
        content = self.fixture["content"]
        manifest: dict[str, object] = {
            "format_version": 1,
            "package_id": "synthetic-package",
            "kind": self.fixture["kind"],
            "key": self.fixture["key"],
            "item_version": "0.1.0",
            "schema_version": self.fixture["schema_version"],
            "content_digest": content_digest(content),
            "tenant_id": "synthetic-tenant",
            "deployment_id": TEST_ID.deployment_id,
            "environment_kind": "test",
            "publisher_id": "fixture-publisher",
            "issuer_id": "fixture-issuer",
            "key_id": "package-key",
            "issued_at": (self.now - timedelta(minutes=1)).isoformat().replace("+00:00", "Z"),
            "expires_at": (self.now + timedelta(hours=1)).isoformat().replace("+00:00", "Z"),
            "runtime_min": "0.1.0",
            "runtime_max": "0.2.0",
            "provenance_status": "synthetic_demo",
        }
        manifest.update(changes)
        signature = self.package_private.sign(canonical_bytes(manifest))
        return {
            "manifest": manifest,
            "content": json.loads(json.dumps(content)),
            "signature": base64.urlsafe_b64encode(signature).decode().rstrip("="),
        }

    def verify(self, envelope: dict, token: str | None = None) -> object:
        return self.verifier().verify(
            json.dumps(envelope, ensure_ascii=False).encode(), token or self.token()
        )

    def assert_rejected(self, code: str, envelope: dict, token: str | None = None) -> None:
        with self.assertRaises(VerificationError) as caught:
            self.verify(envelope, token)
        self.assertEqual(caught.exception.code, code)

    def test_signed_authorized_synthetic_metadata_verified(self) -> None:
        receipt = self.verify(self.envelope())
        self.assertTrue(receipt.simulated)
        self.assertTrue(receipt.non_operational)
        self.assertEqual(receipt.tenant_id, "synthetic-tenant")

    def test_tamper_unsigned_and_wrong_signature_rejected(self) -> None:
        envelope = self.envelope()
        envelope["content"]["aliases"].append("tampered")
        self.assert_rejected("PACKAGE_DIGEST_MISMATCH", envelope)
        envelope = self.envelope()
        envelope["manifest"]["publisher_id"] = "attacker"
        self.assert_rejected("RELEASE_ISSUER_UNTRUSTED", envelope)
        envelope = self.envelope()
        envelope["manifest"]["package_id"] = "changed-after-signing"
        self.assert_rejected("PACKAGE_SIGNATURE_INVALID", envelope)
        envelope = self.envelope()
        envelope["signature"] = ""
        self.assert_rejected("PACKAGE_SIGNATURE_INVALID", envelope)

    def test_deployment_environment_tenant_and_token_scope_rejected(self) -> None:
        self.assert_rejected("DEPLOYMENT_MISMATCH", self.envelope(deployment_id=OTHER_ID))
        self.assert_rejected(
            "DEPLOYMENT_MISMATCH", self.envelope(environment_kind="production_rehearsal")
        )
        self.assert_rejected("FORBIDDEN", self.envelope(tenant_id="other-tenant"))
        self.assert_rejected("FORBIDDEN", self.envelope(), self.token(permissions=[]))
        self.assert_rejected(
            "DEPLOYMENT_MISMATCH", self.envelope(), self.token(deployment_id=OTHER_ID)
        )
        self.assert_rejected("UNAUTHENTICATED", self.envelope(), "Bearer forged")
        self.assert_rejected(
            "UNAUTHENTICATED",
            self.envelope(),
            self.token(exp=int((self.now - timedelta(minutes=1)).timestamp())),
        )
        self.assert_rejected(
            "UNAUTHENTICATED", self.envelope(), self.token(principal_type="station")
        )
        self.assert_rejected(
            "UNAUTHENTICATED",
            self.envelope(),
            self.token(exp=str(int((self.now + timedelta(minutes=30)).timestamp()))),
        )

    def test_trust_material_cannot_be_reused_across_deployments(self) -> None:
        other = DeploymentIdentity(OTHER_ID, "production_rehearsal")
        with self.assertRaises(VerificationError) as caught:
            PackageVerifier(
                other,
                self.parser,
                JwtAuthenticator(TEST_ID, self.auth_trust),
                self.package_trust,
                "0.1.0",
            )
        self.assertEqual(caught.exception.code, "DEPLOYMENT_MISMATCH")
        with self.assertRaises(AuthError) as caught:
            JwtAuthenticator(other, self.auth_trust)
        self.assertEqual(caught.exception.code, "DEPLOYMENT_MISMATCH")
        other_auth = JwtAuthenticator(other, replace(self.auth_trust, deployment=other))
        miswired = PackageVerifier(
            TEST_ID, self.parser, other_auth, self.package_trust, "0.1.0", lambda: self.now
        )
        with self.assertRaises(VerificationError) as caught:
            miswired.verify(
                json.dumps(self.envelope()).encode(),
                self.token(deployment_id=OTHER_ID, environment_kind="production_rehearsal"),
            )
        self.assertEqual(caught.exception.code, "DEPLOYMENT_MISMATCH")
        with self.assertRaises(VerificationError) as caught:
            replace(self.package_trust, keys=(self.package_key, self.package_key))
        self.assertEqual(caught.exception.code, "PACKAGE_TRUST_INVALID")
        with self.assertRaises(AuthError) as caught:
            replace(self.auth_trust, expires_at=self.now.replace(tzinfo=None))
        self.assertEqual(caught.exception.code, "AUTH_TRUST_INVALID")

    def test_production_rehearsal_rejects_direct_metadata_verification(self) -> None:
        rehearsal = DeploymentIdentity(OTHER_ID, "production_rehearsal")
        rehearsal_auth = JwtAuthenticator(rehearsal, replace(self.auth_trust, deployment=rehearsal))
        rehearsal_key = replace(self.package_key, deployment=rehearsal)
        rehearsal_trust = PackageTrustSnapshot(
            rehearsal, (rehearsal_key,), self.now + timedelta(hours=1)
        )
        verifier = PackageVerifier(
            rehearsal,
            self.parser,
            rehearsal_auth,
            rehearsal_trust,
            "0.1.0",
            lambda: self.now,
        )
        with self.assertRaises(VerificationError) as caught:
            verifier.verify(
                json.dumps(self.envelope()).encode(),
                self.token(deployment_id=OTHER_ID, environment_kind="production_rehearsal"),
            )
        self.assertEqual(caught.exception.code, "PRODUCTION_CHANGE_CONTROL")

    def test_trust_snapshots_are_immutable_and_key_roles_separate(self) -> None:
        package_keys = [self.package_key]
        revoked = {"previous-package"}
        snapshot = PackageTrustSnapshot(
            TEST_ID,
            package_keys,
            self.now + timedelta(hours=1),
            revoked_package_ids=revoked,
        )
        package_keys.clear()
        revoked.add("synthetic-package")
        self.assertEqual(len(snapshot.keys), 1)
        self.assertNotIn("synthetic-package", snapshot.revoked_package_ids)
        auth_keys = {"auth-key": self.auth_private.public_key()}
        auth_snapshot = AuthTrustSnapshot(
            TEST_ID,
            "fixture-auth-issuer",
            "calos-phase0b-test",
            auth_keys,
            self.now + timedelta(hours=1),
        )
        auth_keys.clear()
        self.assertEqual(len(auth_snapshot.public_keys), 1)
        reused = replace(self.package_key, public_key=self.auth_private.public_key())
        with self.assertRaises(VerificationError) as caught:
            self.verifier(replace(self.package_trust, keys=(reused,)))
        self.assertEqual(caught.exception.code, "TRUST_ROLE_CONFLICT")

    def test_unknown_revoked_and_stale_trust_rejected(self) -> None:
        self.assert_rejected("RELEASE_ISSUER_UNTRUSTED", self.envelope(key_id="unknown"))
        envelope = self.envelope()
        envelope["signature"] = (
            base64.urlsafe_b64encode(
                Ed25519PrivateKey.generate().sign(canonical_bytes(envelope["manifest"]))
            )
            .decode()
            .rstrip("=")
        )
        self.assert_rejected("PACKAGE_SIGNATURE_INVALID", envelope)
        for trust, code in (
            (
                replace(self.package_trust, revoked_key_ids=frozenset({"package-key"})),
                "PACKAGE_KEY_REVOKED",
            ),
            (
                replace(self.package_trust, revoked_package_ids=frozenset({"synthetic-package"})),
                "PACKAGE_REVOKED",
            ),
            (replace(self.package_trust, expires_at=self.now), "PACKAGE_TRUST_STALE"),
        ):
            with self.subTest(code=code), self.assertRaises(VerificationError) as caught:
                self.verifier(trust).verify(json.dumps(self.envelope()).encode(), self.token())
            self.assertEqual(caught.exception.code, code)

    def test_expiry_schema_compatibility_and_provenance_rejected(self) -> None:
        self.assert_rejected(
            "PACKAGE_EXPIRED",
            self.envelope(
                expires_at=(self.now - timedelta(seconds=1)).isoformat().replace("+00:00", "Z")
            ),
        )
        self.assert_rejected("SCHEMA_UNKNOWN", self.envelope(schema_version=999))
        self.assert_rejected("PACKAGE_INCOMPATIBLE", self.envelope(runtime_min="0.2.0"))
        self.assert_rejected(
            "PACKAGE_PROVENANCE_UNSUPPORTED", self.envelope(provenance_status="authored")
        )
        self.assert_rejected(
            "SCHEMA_PATTERN:/issued_at", self.envelope(issued_at="2026-11-01 00:00:00Z")
        )

    def test_api_requires_injected_trust_and_authenticated_permission(self) -> None:
        with patch.dict(
            os.environ,
            {
                "CALOS_DEPLOYMENT_ID": TEST_ID.deployment_id,
                "CALOS_ENVIRONMENT_KIND": "test",
            },
        ):
            from calos_api.main import create_app

        payload = self.envelope()

        async def post(app: object, body: dict, token: str | None = None) -> httpx.Response:
            transport = httpx.ASGITransport(app=app)
            async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
                return await client.post(
                    "/api/v1/config/packages/verify",
                    json=body,
                    headers={"Authorization": token} if token else {},
                )

        self.assertEqual(
            asyncio.run(post(create_app(TEST_ID), payload)).json()["code"],
            "VERIFIER_UNAVAILABLE",
        )
        app = create_app(TEST_ID, self.verifier())
        with self.assertRaisesRegex(ValueError, "DEPLOYMENT_MISMATCH"):
            create_app(OTHER_ID, self.verifier())
        self.assertEqual(asyncio.run(post(app, payload)).status_code, 401)
        denied_token = self.token(permissions=[])
        with self.assertLogs("calos.api.package_verification", level="WARNING") as captured:
            denied = asyncio.run(post(app, payload, denied_token))
        self.assertEqual((denied.status_code, denied.json()["code"]), (403, "FORBIDDEN"))
        self.assertEqual(denied.headers["content-type"], "application/problem+json")
        self.assertEqual(denied.headers["x-request-id"], denied.json()["correlation_id"])
        self.assertEqual(captured.records[0].code, "FORBIDDEN")
        self.assertEqual(captured.records[0].correlation_id, denied.json()["correlation_id"])
        self.assertNotIn(denied_token, "\n".join(captured.output))
        accepted = asyncio.run(post(app, payload, self.token()))
        self.assertEqual(accepted.status_code, 200)
        self.assertTrue(accepted.json()["simulated"])

        tampered = self.envelope()
        tampered["content"]["aliases"].append("changed")
        rejected = asyncio.run(post(app, tampered, self.token()))
        self.assertEqual(
            (rejected.status_code, rejected.json()["code"]), (422, "PACKAGE_DIGEST_MISMATCH")
        )

        async def oversized() -> httpx.Response:
            transport = httpx.ASGITransport(app=app)
            async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
                return await client.post(
                    "/api/v1/config/packages/verify",
                    content=b"x" * 1_048_577,
                    headers={"Authorization": self.token()},
                )

        too_large = asyncio.run(oversized())
        self.assertEqual(
            (too_large.status_code, too_large.json()["code"]), (413, "PACKAGE_TOO_LARGE")
        )


if __name__ == "__main__":
    unittest.main()
