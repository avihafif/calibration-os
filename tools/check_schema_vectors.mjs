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

function assertUnicodeScalarString(value) {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      assert(next >= 0xdc00 && next <= 0xdfff, "unpaired high surrogate");
      index += 1;
    } else {
      assert(!(code >= 0xdc00 && code <= 0xdfff), "unpaired low surrogate");
    }
  }
}

function canonical(value) {
  if (typeof value === "string") {
    assertUnicodeScalarString(value);
    return JSON.stringify(value);
  }
  if (value === null || typeof value === "boolean") {
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
    .map((key) => {
      assertUnicodeScalarString(key);
      return `${JSON.stringify(key)}:${canonical(value[key])}`;
    })
    .join(",")}}`;
}

for (const vector of vectors.digests) {
  const actual = `sha256:${createHash("sha256").update(canonical(vector.content), "utf8").digest("hex")}`;
  assert.equal(actual, vector.digest, vector.id);
}
for (const value of vectors.invalid_unicode) {
  assert.throws(() => canonical(value), /unpaired .* surrogate/);
  assert.throws(() => canonical({ [value]: true }), /unpaired .* surrogate/);
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
for (const vector of vectors.safe_patterns) {
  const pattern = new RegExp(vector.pattern);
  for (const value of vector.accepted) {
    assert(
      pattern.test(value),
      `safe pattern should accept ${JSON.stringify(value)}`,
    );
  }
  for (const value of vector.rejected) {
    assert(
      !pattern.test(value),
      `safe pattern should reject ${JSON.stringify(value)}`,
    );
  }
}

console.log(
  `R-4 cross-language vectors passed: ${vectors.digests.length} digests, ${vectors.patterns.length} manifest groups, ${vectors.safe_patterns.length} safe grammar groups.`,
);
