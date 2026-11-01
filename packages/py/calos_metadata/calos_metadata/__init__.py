"""Metadata schema and content digest proof for Phase 0A."""

from .canonical import canonical_bytes, content_digest
from .lifecycle import ConfigVersionRef, ReviewSnapshotRef
from .package import PackageError, PackageParser, ParsedPackage
from .schema import SchemaError, SchemaRegistry, validate_document

__all__ = [
    "SchemaError",
    "SchemaRegistry",
    "ConfigVersionRef",
    "ReviewSnapshotRef",
    "PackageError",
    "PackageParser",
    "ParsedPackage",
    "canonical_bytes",
    "content_digest",
    "validate_document",
]
