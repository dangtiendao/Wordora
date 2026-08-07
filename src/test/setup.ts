/**
 * File cấu hình setup toàn cục cho môi trường kiểm thử Vitest (`src/test/setup.ts`).
 *
 * @remarks
 * - Nạp `@testing-library/jest-dom/vitest` để mở rộng các custom matchers giao diện (như `toBeInTheDocument`, `toBeVisible`, `toHaveAttribute`) cho môi trường JSDOM.
 */
import '@testing-library/jest-dom/vitest';

