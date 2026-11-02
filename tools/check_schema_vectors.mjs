/** Cross-language canonical digest and approved pattern vectors. @req FR-META-02 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const vectors = JSON.parse(
  readFileSync(
    new URL(
      "../fixtures/schema-engine/cross-language-vectors.json",
      import.meta.url,
    ),
    "utf8",
  ),
);
const manifest = JSON.parse(
  readFileSync(
    new URL("../schemas/package-manifest/v1.schema.json", import.meta.url),
    "utf8",
  ),
);

function canonical(value) {
  if (
    value === null ||
    typeof value === "boolean" ||
    typeof value === "string"
  ) {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    assert(
      Number.isSafeInteger(value),
      "canonical JSON permits safe integers only",
    );
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonical).join(",")}]`;
  }
  assert.equal(typeof value, "object");
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`)
    .join(",")}}`;
}

for (const vector of vectors.digests) {
  const actual = `sha256:${createHash("sha256").update(canonical(vector.content), "utf8").digest("hex")}`;
  assert.equal(actual, vector.digest, vector.id);
}
assert.equal(
  vectors.digests[0].digest,
  vectors.digests[1].digest,
  "object order must not change digest",
);

for (const vector of vectors.patterns) {
  const pattern = new RegExp(manifest.properties[vector.property].pattern);
  for (const value of vector.accepted) {
    assert(
      pattern.test(value),
      `${vector.property} should accept ${JSON.stringify(value)}`,
    );
  }
  for (const value of vector.rejected) {
    assert(
      !pattern.test(value),
      `${vector.property} should reject ${JSON.stringify(value)}`,
    );
  }
}

console.log(
  `R-4 cross-language vectors passed: ${vectors.digests.length} digests, ${vectors.patterns.length} pattern groups.`,
);
