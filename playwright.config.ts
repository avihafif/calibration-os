import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/frontend",
  testMatch: "**/*.e2e.spec.ts",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    channel: (globalThis as { process?: { env?: { CI?: string } } }).process
      ?.env?.CI
      ? undefined
      : "chrome",
    baseURL: "http://127.0.0.1:4173",
  },
  webServer: {
    command:
      "pnpm --filter @calos/web exec vite preview --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false,
    timeout: 30000,
  },
});
