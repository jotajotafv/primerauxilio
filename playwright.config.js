import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  outputDir: './test-results/artifacts',
  timeout: 90000,
  expect: { timeout: 15000 },
  workers: 1,
  reporter: [['list'], ['json', { outputFile: 'test-results/browser-results.json' }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:5173',
    browserName: 'chromium', channel: 'chrome', headless: true,
    viewport: { width: 1440, height: 1000 },
    launchOptions: { args: ['--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
    screenshot: 'only-on-failure',
    // Enable with --trace retain-on-failure when diagnosing a failure.
    // Continuous trace screenshots compete with software WebGL rendering.
    trace: 'off',
  },
});
