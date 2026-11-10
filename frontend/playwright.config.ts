import { defineConfig } from "playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 90_000,
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:4173",
    channel: "chrome",
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "cmd /c \"set NUXT_IGNORE_LOCK=1&& npm run dev -- --port 4173\"",
    url: "http://localhost:4173",
    reuseExistingServer: true,
    timeout: 240_000,
  },
});
