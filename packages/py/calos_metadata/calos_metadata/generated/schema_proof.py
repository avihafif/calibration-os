# Generated from schemas/schema-proof/v1.schema.json; do not edit.
from typing import Literal, NotRequired, TypeAlias, TypedDict


SchemaProofDefLabel: TypeAlias = str


SchemaProofDefLocalizedKey = TypedDict(
    "SchemaProofDefLocalizedKey",
    {
        "$t": str,
    },
)


class SchemaProofDefTextEntry(TypedDict):
    tag: Literal["text"]
    value: SchemaProofDefLabel


class SchemaProofDefCountEntry(TypedDict):
    tag: Literal["count"]
    value: int


SchemaProofEntriesItem: TypeAlias = SchemaProofDefTextEntry | SchemaProofDefCountEntry


class SchemaProof(TypedDict):
    name: SchemaProofDefLabel
    entries: list[SchemaProofEntriesItem]
    mode: Literal["preview"]
    note: NotRequired[str]
    label: NotRequired[SchemaProofDefLocalizedKey]
