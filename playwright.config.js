// @ts-check
const { defineConfig, devices } = require("@playwright/test");

const port = Number(process.env.PLATA_BROWSER_PORT || 4173);
const baseURL = process.env.PLATA_BROWSER_BASE_URL || `http://127.0.0.1:${port}`;

/**
 * Browser QA for the built Pages artifact (.dist/pages).
 * Kept separate from `npm run check` (zero-runtime-deps node smokes).
 */
module.exports = defineConfig({
  testDir: "./tests/browser",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["list"], ["github"]] : "list",
  timeout: 60_000,
  expect: {
    toHaveScreenshot: {
      maxDiffPixels: 120,
      animations: "disabled"
    }
  },
  use: {
    baseURL,
    trace: "on-first-retry",
    colorScheme: "light"
  },
  webServer: {
    command: `node scripts/serve-pages.js`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      PLATA_BROWSER_PORT: String(port),
      PORT: String(port)
    }
  },
  projects: [
    {
      name: "chromium-desktop",
      use: { ...devices["Desktop Chrome"] }
    },
    {
      name: "chromium-mobile",
      use: { ...devices["Pixel 5"] }
    },
    {
      name: "webkit-desktop",
      use: { ...devices["Desktop Safari"] }
    },
    {
      name: "webkit-mobile",
      use: { ...devices["iPhone 12"] }
    }
  ]
});
