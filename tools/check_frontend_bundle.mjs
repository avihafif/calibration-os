import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const assetDir = resolve("apps/web/dist/assets");
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
  `Web bundle CSP/no-storage/no-network/design exclusion passed: ${scripts.length} script(s).\n`,
);
