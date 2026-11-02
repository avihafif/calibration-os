"""Expected mypy errors prove generated R-4 discriminants. @req FR-META-01"""

from calos_metadata.generated.schema_proof import SchemaProof


def check_schema_types() -> None:
    valid: SchemaProof = {
        "name": "Synthetic preview",
        "mode": "preview",
        "entries": [{"tag": "text", "value": "sample"}],
        "label": {"$t": "schema.proof.name"},
    }
    invalid: SchemaProof = {
        "name": "Synthetic preview",
        "mode": "active",  # type: ignore[typeddict-item]
        "entries": [{"tag": "text", "value": "sample"}],
    }
    _ = (valid, invalid)
