# Generated from schemas/package-manifest/v1.schema.json; do not edit.
from typing import Literal, TypedDict


class PackageManifest(TypedDict):
    format_version: Literal[1]
    package_id: str
    kind: str
    key: str
    item_version: str
    schema_version: int
    content_digest: str
    tenant_id: str
    deployment_id: str
    environment_kind: Literal["test", "production_rehearsal"]
    publisher_id: str
    issuer_id: str
    key_id: str
    issued_at: str
    expires_at: str
    runtime_min: str
    runtime_max: str
    provenance_status: Literal["synthetic_demo", "authored"]
