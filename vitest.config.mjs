import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: [
      "packages/ts/i18n/src/**/*.test.ts",
      "apps/web/src/**/*.test.tsx",
    ],
    pool: "forks",
    maxWorkers: 2,
    minWorkers: 1,
  },
});
