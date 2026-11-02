// Generated from schemas/schema-proof/v1.schema.json; do not edit.

export type SchemaProofDefLabel = string;

export interface SchemaProofDefLocalizedKey {
  $t: string;
}

export interface SchemaProofDefTextEntry {
  tag: "text";
  value: SchemaProofDefLabel;
}

export interface SchemaProofDefCountEntry {
  tag: "count";
  value: number;
}

export type SchemaProofEntriesItem =
  SchemaProofDefTextEntry | SchemaProofDefCountEntry;

export interface SchemaProof {
  name: SchemaProofDefLabel;
  entries: SchemaProofEntriesItem[];
  mode: "preview";
  note?: string;
  label?: SchemaProofDefLocalizedKey;
}
