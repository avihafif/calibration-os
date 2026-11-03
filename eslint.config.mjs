import tseslint from "typescript-eslint";
import boundaries from "eslint-plugin-boundaries";
import { calosRules } from "./tools/eslint_rules.mjs";
import { allowedImports, sourceKinds } from "./tools/ts_boundary_policy.mjs";

const elements = [
  { type: "web", pattern: "apps/web/src", partialMatch: false },
  ...sourceKinds
    .filter((kind) => kind !== "web")
    .map((kind) => ({
      type: kind,
      pattern: `packages/ts/${kind}/src`,
      partialMatch: false,
    })),
  { type: "design", pattern: "design", partialMatch: false },
];
const policies = sourceKinds.flatMap((from) =>
  [...sourceKinds, "design"]
    .filter((to) => !allowedImports[from].includes(to))
    .map((to) => ({
      from: { element: { type: from } },
      disallow: { to: { element: { type: to } } },
    })),
);

export default [
  ...tseslint.configs.recommended,
  {
    files: ["apps/web/src/**/*.{ts,tsx}", "packages/ts/*/src/**/*.{ts,tsx}"],
    plugins: { boundaries, calos: calosRules },
    settings: {
      "import/resolver": { typescript: { alwaysTryTypes: true } },
      "boundaries/elements": elements,
    },
    rules: {
      "calos/import-boundary": "error",
      "calos/no-unsafe-web-api": "error",
      "boundaries/no-unknown-files": "error",
      "boundaries/dependencies": ["error", { default: "allow", policies }],
      "no-restricted-globals": [
        "error",
        "localStorage",
        "sessionStorage",
        "indexedDB",
        "fetch",
        "XMLHttpRequest",
        "WebSocket",
        "eval",
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message: "Executable HTML is forbidden.",
        },
        {
          selector: "NewExpression[callee.name='Function']",
          message: "Dynamic code is forbidden.",
        },
      ],
    },
  },
  {
    files: ["apps/web/src/**/*.{tsx,jsx}", "packages/ts/*/src/**/*.{tsx,jsx}"],
    rules: { "calos/no-hardcoded-ui-text": "error" },
  },
];
