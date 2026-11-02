import { dirname, relative, resolve, sep } from "node:path";

export const packageNames = Object.freeze([
  "api-client",
  "domain-types",
  "editor-core",
  "designers",
  "ui-runtime",
  "expr-presentation",
  "ui-kit",
  "i18n",
]);
export const sourceKinds = Object.freeze(["web", ...packageNames]);
export const allowedImports = Object.freeze({
  web: [...packageNames, "web"],
  "api-client": ["api-client"],
  "domain-types": ["domain-types"],
  i18n: ["i18n"],
  "expr-presentation": ["expr-presentation", "domain-types"],
  "ui-kit": ["ui-kit", "i18n"],
  "editor-core": ["editor-core", "domain-types", "expr-presentation"],
  designers: [
    "designers",
    "editor-core",
    "ui-kit",
    "i18n",
    "domain-types",
    "expr-presentation",
  ],
  "ui-runtime": [
    "ui-runtime",
    "ui-kit",
    "i18n",
    "domain-types",
    "expr-presentation",
  ],
});

export function repoPath(absolute) {
  return relative(process.cwd(), absolute).split(sep).join("/");
}

export function kindForPath(path) {
  if (path === ".." || path.startsWith("../")) return "other-app";
  if (path.startsWith("apps/web/")) return "web";
  if (path.startsWith("design/")) return "design";
  if (path.startsWith("apps/") || path.startsWith("packages/py/"))
    return "other-app";
  const match = /^packages\/ts\/([^/]+)\//u.exec(path);
  if (match)
    return packageNames.includes(match[1]) ? match[1] : "unknown-package";
  return null;
}

export function targetForImport(filename, source) {
  if (/^(?:[A-Za-z]:[\\/]|\/)/u.test(source)) {
    return { kind: "other-app", path: source };
  }
  if (source.startsWith("@calos/")) {
    const name = source.slice("@calos/".length).split("/")[0];
    return packageNames.includes(name)
      ? { kind: name, path: null }
      : { kind: "unknown-package", path: null };
  }
  if (source.startsWith(".")) {
    const path = repoPath(resolve(dirname(filename), source));
    return { kind: kindForPath(path), path };
  }
  if (source.startsWith("design/")) return { kind: "design", path: source };
  if (source.startsWith("apps/") || source.startsWith("packages/")) {
    return { kind: kindForPath(source + "/"), path: source };
  }
  return { kind: null, path: null };
}

function designerSection(path) {
  return /^packages\/ts\/designers\/src\/([^/]+)\//u.exec(path)?.[1] ?? null;
}

export function importAllowed(filename, source) {
  const fromPath = repoPath(filename);
  const from = kindForPath(fromPath);
  const target = targetForImport(filename, source);
  if (from === null || from === "design" || from === "other-app") return true;
  if (from === "unknown-package") return false;
  if (target.kind === null) return true;
  if (!allowedImports[from].includes(target.kind)) return false;
  if (
    from === "designers" &&
    target.kind === "designers" &&
    target.path !== null
  ) {
    const fromSection = designerSection(fromPath);
    const toSection = designerSection(target.path);
    if (
      fromSection !== null &&
      toSection !== null &&
      fromSection !== toSection &&
      toSection !== "inspector" &&
      toSection !== "shared"
    ) {
      return false;
    }
  }
  return true;
}
