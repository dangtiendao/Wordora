import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Tập tin cấu hình cho khung kiểm thử Vitest (`vitest.config.ts`).
 *
 * @remarks
 * - **TEST ENVIRONMENT**: Sử dụng `environment: jsdom` mô phỏng DOM môi trường trình duyệt cho React Components và Custom Hooks.
 * - **SETUP FILES**: Nạp `./src/test/setup.ts` bổ sung matchers giao diện.
 * - **EXCLUSION BOUNDARY**: Loại trừ node_modules và e2e (Playwright E2E tests được quản lý riêng).
 * - **PATH ALIAS**: Thiết lập `@` trỏ tới `./src`.
 */
export default defineConfig({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plugins: [react() as any],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['**/node_modules/**', '**/e2e/**'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});


