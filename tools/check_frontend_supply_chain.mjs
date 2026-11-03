import { existsSync, readFileSync, readdirSync } from "node:fs";

const path = process.argv[2];
if (!path) throw new Error("SBOM_PATH_REQUIRED");
const bom = JSON.parse(readFileSync(path, "utf8"));
if (bom.bomFormat !== "CycloneDX" || !Array.isArray(bom.components)) {
  throw new Error("INVALID_CYCLONEDX_SBOM");
}

const approvedDirect = Object.freeze({
  "react-intl": "12.1.5",
  "react-router": "8.5.0",
  vitest: "5.0.5",
  jsdom: "30.1.3",
  "@testing-library/react": "16.3.3",
  "@testing-library/dom": "10.4.2",
  "@testing-library/user-event": "14.6.8",
  "@playwright/test": "1.64.1",
  "axe-core": "4.14.0",
  "@axe-core/playwright": "4.14.0",
  eslint: "10.14.0",
  "eslint-import-resolver-typescript": "4.4.4",
  "eslint-plugin-boundaries": "7.4.0",
  prettier: "3.9.10",
  "typescript-eslint": "8.72.1",
  react: "19.3.0",
  "react-dom": "19.3.0",
  "@types/react": "19.3.0",
  "@types/react-dom": "19.3.0",
  typescript: "5.9.3",
  vite: "8.3.5",
});
const rootManifest = JSON.parse(readFileSync("package.json", "utf8"));
if (rootManifest.packageManager !== "pnpm@11.25.0") {
  throw new Error("UNAPPROVED_PACKAGE_MANAGER");
}
const manifestPaths = ["package.json", "apps/web/package.json"];
for (const entry of readdirSync("packages/ts", { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const manifestPath = `packages/ts/${entry.name}/package.json`;
  if (!existsSync(manifestPath))
    throw new Error(`PACKAGE_MANIFEST_MISSING: ${entry.name}`);
  manifestPaths.push(manifestPath);
}
for (const manifestPath of manifestPaths) {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  for (const [name, version] of Object.entries({
    ...manifest.dependencies,
    ...manifest.devDependencies,
  })) {
    if (typeof version !== "string")
      throw new Error(`INVALID_DEPENDENCY_VERSION: ${name}`);
    if (version.startsWith("workspace:")) {
      if (version !== "workspace:*" || !name.startsWith("@calos/")) {
        throw new Error(`UNAPPROVED_WORKSPACE_DEPENDENCY: ${name}@${version}`);
      }
      continue;
    }
    if (approvedDirect[name] !== version) {
      throw new Error(
        `UNAPPROVED_DIRECT_DEPENDENCY: ${manifestPath}: ${name}@${version}`,
      );
    }
  }
}
const allowedLicenses = new Set([
  "MIT",
  "MIT-0",
  "Apache-2.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "ISC",
  "CC0-1.0",
  "BlueOak-1.0.0",
  "MPL-2.0",
]);
const allowedMpl = new Set(["@axe-core/playwright", "axe-core"]);
const approvedTransitiveException = new Map([
  ["minimatch", "11.0.1"],
  ["@isaacs/nonrecursive-glob-match", "1.0.3"],
]);
const seenExceptions = new Set();
for (const component of bom.components) {
  const name = component.group
    ? `${component.group}/${component.name}`
    : component.name;
  if (approvedTransitiveException.has(name)) {
    if (
      component.version !== approvedTransitiveException.get(name) ||
      component.scope !== "excluded" ||
      seenExceptions.has(name)
    ) {
      throw new Error(
        `UNAPPROVED_TRANSITIVE_EXCEPTION: ${name}@${component.version}`,
      );
    }
    seenExceptions.add(name);
  }
  const ids = (component.licenses ?? []).map((entry) => entry.license?.id);
  if (ids.length === 0 || ids.some((id) => !allowedLicenses.has(id))) {
    throw new Error(
      `UNREVIEWED_LICENSE: ${name}@${component.version}: ${ids.join(",")}`,
    );
  }
  if (
    ids.includes("MPL-2.0") &&
    !allowedMpl.has(name) &&
    !name.startsWith("lightningcss")
  ) {
    throw new Error(`UNAPPROVED_MPL_COMPONENT: ${name}`);
  }
  if (ids.includes("MPL-2.0") && component.scope !== "excluded") {
    throw new Error(`MPL_COMPONENT_IN_RUNTIME: ${name}`);
  }
}
if (seenExceptions.size !== approvedTransitiveException.size) {
  throw new Error("APPROVED_TRANSITIVE_EXCEPTION_MISSING");
}

const queries = bom.components.map((component) => ({
  package: {
    name: component.group
      ? `${component.group}/${component.name}`
      : component.name,
    ecosystem: "npm",
  },
  version: component.version,
}));
process.stdout.write(
  `CycloneDX ${bom.specVersion}: ${queries.length} components, licence inventory approved.\n`,
);
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), 30000);
let response;
try {
  response = await fetch("https://api.osv.dev/v1/querybatch", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ queries }),
    signal: controller.signal,
  });
} finally {
  clearTimeout(timer);
}
if (!response.ok) throw new Error(`OSV_HTTP_${response.status}`);
const result = await response.json();
if (
  !Array.isArray(result.results) ||
  result.results.length !== queries.length
) {
  throw new Error("OSV_RESULT_SHAPE");
}
const findings = result.results.flatMap((item, index) =>
  (item.vulns ?? []).map(
    (vuln) =>
      `${queries[index].package.name}@${queries[index].version}: ${vuln.id}`,
  ),
);
if (findings.length > 0)
  throw new Error(`OSV_ADVISORIES: ${findings.join("; ")}`);
process.stdout.write(
  `CycloneDX ${bom.specVersion}: ${queries.length} components, all licences reviewed, 0 OSV advisories.\n`,
);
