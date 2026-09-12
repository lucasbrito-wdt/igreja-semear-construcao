import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  webServer: {
    command: 'pnpm build && pnpm start',
    port: 3600,
    env: { PORT: '3600' },
    timeout: 180_000,
    reuseExistingServer: false,
  },
  use: {
    baseURL: 'http://localhost:3600',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
});
