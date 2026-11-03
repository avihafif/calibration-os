import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const assetDir = resolve("apps/web/dist/assets");
if (
  /^COPY\s+fixtures\//mu.test(readFileSync("deploy/Dockerfile.web", "utf8"))
) {
  throw new Error("PRODUCTION_REHEARSAL_FIXTURE_COPY_FORBIDDEN");
}
const scripts = readdirSync(assetDir).filter((name) => name.endsWith(".js"));
if (scripts.length === 0) throw new Error("WEB_BUNDLE_MISSING");
const forbidden = [
  /\beval\s*\(/u,
  /\bnew\s+Function\s*\(/u,
  /\blocalStorage\b/u,
  /\bsessionStorage\b/u,
  /\bindexedDB\b/u,
  /\bXMLHttpRequest\b/u,
  /\bWebSocket\b/u,
  /\bfetch\s*\(/u,
  /design\/phase1/u,
  /design\/procedure/u,
  /synthetic_demo|fixtures\/manufacturer/u,
  /@axe-core\/playwright|axe-core|playwright-core|vitest/u,
];
for (const script of scripts) {
  const source = readFileSync(resolve(assetDir, script), "utf8");
  for (const pattern of forbidden) {
    if (pattern.test(source))
      throw new Error(`FORBIDDEN_WEB_BUNDLE_CODE: ${script}: ${pattern}`);
  }
}
process.stdout.write(
  `Web bundle forbidden-code and fixture exclusion passed: ${scripts.length} script(s).\n`,
);
