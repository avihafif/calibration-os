import { readFileSync, readdirSync } from "node:fs";
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
const hardeningProbes = [
  [
    "apps/web/src/boundary-probe.ts",
    "navigator.onLine;",
    "calos/no-unsafe-web-api",
  ],
  [
    "apps/web/src/boundary-probe.ts",
    "history.pushState(null, '', '/');",
    "calos/no-unsafe-web-api",
  ],
  ["apps/web/src/boundary-probe.ts", "Date.now();", "calos/no-unsafe-web-api"],
  ["apps/web/src/boundary-probe.ts", "new Date();", "calos/no-unsafe-web-api"],
  [
    "packages/ts/ui-kit/src/boundary-probe.ts",
    "navigator.onLine;",
    "calos/no-unsafe-web-api",
  ],
  [
    "packages/ts/ui-kit/src/boundary-probe.ts",
    "history.pushState(null, '', '/');",
    "calos/no-unsafe-web-api",
  ],
  [
    "packages/ts/ui-kit/src/boundary-probe.ts",
    "Date.now();",
    "calos/no-unsafe-web-api",
  ],
  [
    "packages/ts/ui-kit/src/boundary-probe.ts",
    "new Date();",
    "calos/no-unsafe-web-api",
  ],
  [
    "packages/ts/ui-kit/src/boundary-probe.ts",
    "window.location;",
    "calos/no-unsafe-web-api",
  ],
  [
    "packages/ts/ui-kit/src/boundary-probe.ts",
    "window.history;",
    "calos/no-unsafe-web-api",
  ],
  [
    "apps/web/src/boundary-probe.ts",
    'import "../../../fixtures/manufacturer/valid.json";',
    "calos/import-boundary",
  ],
  [
    "apps/web/src/boundary-probe.ts",
    'import "../../../schemas/manufacturer/v1.schema.json";',
    "calos/import-boundary",
  ],
  [
    "packages/ts/i18n/src/boundary-probe.ts",
    'import "node:fs";',
    "calos/import-boundary",
  ],
  [
    "packages/ts/i18n/src/boundary-probe.ts",
    'import "react-router";',
    "calos/import-boundary",
  ],
  [
    "apps/web/src/boundary-probe.ts",
    "window.localStorage;",
    "calos/no-unsafe-web-api",
  ],
  [
    "apps/web/src/boundary-probe.ts",
    'globalThis["local" + "Storage"];',
    "calos/no-unsafe-web-api",
  ],
  [
    "apps/web/src/boundary-probe.ts",
    'element.innerHTML = "x";',
    "calos/no-unsafe-web-api",
  ],
  [
    "apps/web/src/boundary-probe.ts",
    'element.insertAdjacentHTML("beforeend", "x");',
    "calos/no-unsafe-web-api",
  ],
  [
    "apps/web/src/boundary-probe.ts",
    'import.meta.glob("../../../design/**");',
    "calos/no-unsafe-web-api",
  ],
  [
    "apps/web/src/boundary-probe.ts",
    'new URL("../../../design/x", import.meta.url);',
    "calos/no-unsafe-web-api",
  ],
  [
    "apps/web/src/boundary-probe.tsx",
    'export const sample = <Foo label="Visible" />;',
    "calos/no-hardcoded-ui-text",
  ],
  [
    "apps/web/src/boundary-probe.tsx",
    'export const sample = <Foo aria-label={flag ? "Visible" : t("app.title")} />;',
    "calos/no-hardcoded-ui-text",
  ],
  [
    "apps/web/src/boundary-probe.tsx",
    "export const sample = <span>{`Visible ${value}`}</span>;",
    "calos/no-hardcoded-ui-text",
  ],
  [
    "apps/web/src/boundary-probe.tsx",
    'export const sample = <span>{flag ? "Visible" : t("app.title")}</span>;',
    "calos/no-hardcoded-ui-text",
  ],
  [
    "apps/web/src/boundary-probe.tsx",
    'export const sample = <span>{"Visible" + value}</span>;',
    "calos/no-hardcoded-ui-text",
  ],
  [
    "apps/web/src/boundary-probe.tsx",
    "export const sample = <span>Пример</span>;",
    "calos/no-hardcoded-ui-text",
  ],
  [
    "apps/web/src/boundary-probe.tsx",
    'const heading = "Visible"; export const sample = <h1>{heading}</h1>;',
    "calos/no-hardcoded-ui-text",
  ],
];
for (const [file, source, rule] of hardeningProbes) {
  await probe(file, source, rule);
  tested += 1;
}
function assertNoDisplayNumberCoercion(source) {
  if (/\b(?:Number|parseFloat|parseInt)\s*\(/u.test(source)) {
    throw new Error("UI_KIT_NUMERIC_COERCION_FORBIDDEN");
  }
}
for (const name of readdirSync("packages/ts/ui-kit/src")) {
  if (!/\.tsx?$/u.test(name) || /\.(?:test|spec)\.tsx?$/u.test(name)) continue;
  assertNoDisplayNumberCoercion(
    readFileSync(`packages/ts/ui-kit/src/${name}`, "utf8"),
  );
}
for (const probeSource of [
  "Number(value)",
  "parseFloat(value)",
  "parseInt(value)",
]) {
  try {
    assertNoDisplayNumberCoercion(probeSource);
    throw new Error("NUMERIC_COERCION_NEGATIVE_PROBE_FAILED");
  } catch (error) {
    if (
      !(error instanceof Error) ||
      error.message !== "UI_KIT_NUMERIC_COERCION_FORBIDDEN"
    )
      throw error;
  }
  tested += 1;
}
process.stdout.write(
  `TypeScript boundary and UI-string negative probes passed: ${tested}.\n`,
);
