// Generated from schemas/package-manifest/v1.schema.json; do not edit.

export interface PackageManifest {
  format_version: number;
  package_id: string;
  kind: string;
  key: string;
  item_version: string;
  schema_version: number;
  content_digest: string;
  tenant_id: string;
  deployment_id: string;
  environment_kind: string;
  publisher_id: string;
  issuer_id: string;
  key_id: string;
  issued_at: string;
  expires_at: string;
  runtime_min: string;
  runtime_max: string;
  provenance_status: string;
}
