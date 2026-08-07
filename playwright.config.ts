import { defineConfig, devices } from '@playwright/test';

/**
 * Tập tin cấu hình cho khung kiểm thử End-to-End Playwright (`playwright.config.ts`).
 *
 * @remarks
 * - **TEST DIRECTORY**: Đặt thư mục bài test E2E tại `./e2e`.
 * - **BASE URL & WEBSERVER**:
 *   - `baseURL`: `http://localhost:3000`.
 *   - `webServer`: Tự động khởi chạy lệnh production server `npm run start` tại cổng 3000 trước khi thực thi bài test E2E.
 * - **REQUIREMENT**: Yêu cầu ứng dụng Next.js đã được build thành công (`npm run build`) trước khi chạy test E2E.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});

