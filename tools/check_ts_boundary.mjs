import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const eslintCli = resolve("node_modules/eslint/bin/eslint.js");
const probes = [
  {
    file: "packages/ts/domain-types/src/boundary-probe.ts",
    source:
      'import { App } from "../../../../apps/web/src/App"; export { App };',
    rule: "boundaries/dependencies",
  },
  {
    file: "apps/web/src/boundary-probe.ts",
    source: 'import x from "@calos/api-client"; export { x };',
    rule: "no-restricted-imports",
  },
];

for (const probe of probes) {
  const result = spawnSync(
    process.execPath,
    [eslintCli, "--stdin", "--stdin-filename", probe.file],
    {
      input: probe.source,
      encoding: "utf8",
    },
  );
  if (result.status !== 1 || !result.stdout.includes(probe.rule)) {
    process.stderr.write(
      (result.stdout ?? "") + (result.stderr ?? "") + String(result.error ?? ""),
    );
    process.exit(1);
  }
}
process.stdout.write("TypeScript boundary negative probes passed.\n");
