import { readdirSync } from "node:fs";
import { ESLint } from "eslint";
import {
  allowedImports,
  packageNames,
  sourceKinds,
} from "./ts_boundary_policy.mjs";

const declared = new Set(packageNames);
for (const entry of readdirSync("packages/ts", { withFileTypes: true })) {
  if (entry.isDirectory() && !declared.has(entry.name)) {
    throw new Error(`UNDECLARED_TS_PACKAGE: ${entry.name}`);
  }
}

const eslint = new ESLint();
async function probe(file, source, expectedRule) {
  const [result] = await eslint.lintText(source, { filePath: file });
  if (!result.messages.some((message) => message.ruleId === expectedRule)) {
    throw new Error(
      `NEGATIVE_BOUNDARY_PROBE_FAILED: ${file}: ${JSON.stringify(result.messages)}`,
    );
  }
}

function filename(kind) {
  return kind === "web"
    ? "apps/web/src/boundary-probe.ts"
    : `packages/ts/${kind}/src/boundary-probe.ts`;
}

let tested = 0;
for (const from of sourceKinds) {
  for (const to of packageNames) {
    if (allowedImports[from].includes(to)) continue;
    await probe(
      filename(from),
      `import "@calos/${to}";`,
      "calos/import-boundary",
    );
    tested += 1;
  }
  const designPath =
    from === "web"
      ? "../../../design/prototype.js"
      : "../../../../design/prototype.js";
  await probe(
    filename(from),
    `import "${designPath}";`,
    "calos/import-boundary",
  );
  tested += 1;
}
await probe(
  "packages/ts/i18n/src/boundary-probe.ts",
  'import "../../../../../outside.ts";',
  "calos/import-boundary",
);
tested += 1;
await probe(
  "packages/ts/designers/src/procedure/boundary-probe.ts",
  'import "../driver/driver.js";',
  "calos/import-boundary",
);
tested += 1;
await probe(
  "packages/ts/i18n/src/boundary-probe.ts",
  'import "../../domain-types/src/index.ts";',
  "boundaries/dependencies",
);
tested += 1;
await probe(
  "apps/web/src/boundary-probe.tsx",
  "export const sample = <span>Visible text</span>;",
  "calos/no-hardcoded-ui-text",
);
tested += 1;
await probe(
  "apps/web/src/boundary-probe.tsx",
  'export const sample = <button aria-label="Hard-coded label" />;',
  "calos/no-hardcoded-ui-text",
);
tested += 1;
await probe(
  "packages/ts/i18n/src/boundary-probe.ts",
  'import "C:/outside.ts";',
  "calos/import-boundary",
);
tested += 1;
await probe(
  "packages/ts/i18n/src/boundary-probe.ts",
  'void import("../../../../design/" + "prototype.js");',
  "calos/import-boundary",
);
tested += 1;
await probe(
  "packages/ts/i18n/src/boundary-probe.ts",
  'require("../../../../design/prototype.js");',
  "calos/import-boundary",
);
tested += 1;
process.stdout.write(
  `TypeScript boundary and UI-string negative probes passed: ${tested}.\n`,
);
