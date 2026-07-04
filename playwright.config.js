import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: "http://127.0.0.1:8788",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "node tests/e2e/static-server.mjs",
    url: "http://127.0.0.1:8788",
    reuseExistingServer: true,
    timeout: 30000,
  },
  reporter: [["list"], ["html", { outputFolder: "artifacts/playwright-report", open: "never" }]],
});
