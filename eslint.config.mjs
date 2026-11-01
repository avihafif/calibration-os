import tseslint from "typescript-eslint";
import boundaries from "eslint-plugin-boundaries";

export default [
  ...tseslint.configs.recommended,
  {
    files: [
      "apps/web/src/**/*.{ts,tsx}",
      "packages/ts/domain-types/src/**/*.ts",
    ],
    plugins: { boundaries },
    settings: {
      "import/resolver": { typescript: { alwaysTryTypes: true } },
      "boundaries/elements": [
        { type: "web", pattern: "apps/web/src", partialMatch: false },
        {
          type: "domain-types",
          pattern: "packages/ts/domain-types/src",
          partialMatch: false,
        },
      ],
    },
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@calos/api-client", "@calos/api-client/*"],
              message: "Use injected host ports in runtime packages.",
            },
          ],
        },
      ],
      "boundaries/dependencies": [
        "error",
        {
          default: "allow",
          policies: [
            {
              from: { element: { type: "web" } },
              disallow: { to: { module: { source: "@calos/api-client" } } },
            },
            {
              from: { element: { type: "domain-types" } },
              disallow: { to: { module: { source: "@calos/api-client" } } },
            },
            {
              from: { element: { type: "domain-types" } },
              disallow: { to: { element: { type: "web" } } },
            },
          ],
        },
      ],
    },
  },
];
