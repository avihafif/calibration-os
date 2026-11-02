import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const physical =
  /(?:^|[;{])\s*(?:left|right|top|bottom|width|height|margin-(?:left|right|top|bottom)|padding-(?:left|right|top|bottom)|border-(?:left|right|top|bottom)(?:-width|-color|-style)?)\s*:/gmu;

function checkCss(source, label) {
  physical.lastIndex = 0;
  const matches = [
    ...source.matchAll(physical),
    ...source.matchAll(/text-align\s*:\s*(?:left|right)\b/gmu),
  ];
  if (matches.length > 0)
    throw new Error(`PHYSICAL_CSS_PROPERTY: ${label}: ${matches[0][0].trim()}`);
}

function visit(path) {
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const child = join(path, entry.name);
    if (entry.isDirectory()) visit(child);
    else if (entry.isFile() && child.endsWith(".css")) {
      checkCss(readFileSync(child, "utf8"), child);
    }
  }
}
visit("apps/web/src");
for (const entry of readdirSync("packages/ts", { withFileTypes: true })) {
  if (entry.isDirectory()) {
    const source = join("packages/ts", entry.name, "src");
    try {
      visit(source);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
}
try {
  checkCss(".bad { margin-left: 1rem; }", "negative probe");
  throw new Error("LOGICAL_CSS_NEGATIVE_PROBE_FAILED");
} catch (error) {
  if (!String(error.message).startsWith("PHYSICAL_CSS_PROPERTY")) throw error;
}
process.stdout.write("Logical CSS lint and negative probe passed.\n");
