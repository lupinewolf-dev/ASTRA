import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/e2e",
  testMatch: "visual.spec.ts",
  timeout: 45000,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:5180",
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
      args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
    },
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev -w apps/client -- --mode test --port 5180",
    url: "http://127.0.0.1:5180",
    reuseExistingServer: false,
  },
});
