import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/e2e",
  testIgnore: "visual.spec.ts",
  timeout: 120000,
  workers: 1,
  use: {
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
      : undefined,
    baseURL: "http://127.0.0.1:5173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    viewport: { width: 1280, height: 850 },
  },
  webServer: [
    {
      command: "node --import tsx tests/e2e/server.ts",
      url: "http://127.0.0.1:3001/health",
      reuseExistingServer: false,
    },
    {
      command: "npm run dev -w apps/client -- --mode test",
      url: "http://127.0.0.1:5173",
      reuseExistingServer: false,
    },
  ],
});
