import { defineConfig, devices } from "@playwright/test";

const localURL = process.env.GITHUB_ACTIONS ? 'http://127.0.0.1:4173/comissao-festas-pedidos/' : 'http://127.0.0.1:4173/';
export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  workers: 2,
  reporter: [['list'], ['json', { outputFile: 'test-results/report.json' }]],
  use: {
    baseURL: process.env.TEST_URL || localURL,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "iphone-webkit",
      use: { ...devices["iPhone 13"], browserName: "webkit" },
    },
  ],
  webServer: process.env.TEST_URL
    ? undefined
    : {
        command:
          "npm run build && npm run preview -- --host 127.0.0.1 --port 4173 --strictPort",
        url: localURL,
        reuseExistingServer: !process.env.CI,
      },
});
