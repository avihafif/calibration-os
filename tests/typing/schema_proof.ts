// Generated structural types must retain the discriminant and optional field.
// @req FR-META-01
import type { SchemaProof } from "../../packages/ts/domain-types/src/schema_proof";

const valid: SchemaProof = {
  name: "Synthetic preview",
  mode: "preview",
  entries: [
    { tag: "text", value: "sample" },
    { tag: "count", value: 20 },
  ],
  label: { $t: "schema.proof.name" },
};

const invalid: SchemaProof = {
  name: "Synthetic preview",
  // @ts-expect-error generated const must remain literal
  mode: "active",
  entries: [{ tag: "text", value: "sample" }],
};

const invalidTag: SchemaProof = {
  name: "Synthetic preview",
  mode: "preview",
  // @ts-expect-error generated oneOf discriminant must remain closed
  entries: [{ tag: "other", value: "sample" }],
};

void valid;
void invalid;
void invalidTag;
