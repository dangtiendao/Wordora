import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { renderHook } from '@testing-library/react';
import { useOnlineStatus } from '@/hooks/use-online-status';

/**
 * Bộ kiểm thử đơn vị cho Cấu hình PWA và Trạng thái Mạng (`Pwa & Offline Tests`).
 *
 * @remarks
 * - **VERIFICATION BOUNDARY**:
 *   - Kiểm tra sự tồn tại và tính hợp lệ của file manifest `public/manifest.json` và Service Worker `public/sw.js`.
 *   - Kiểm tra hoạt động của `useOnlineStatus` hook trong JSDOM.
 *   - **REAL DEVICE UNVERIFIED**: Việc cài đặt thực tế PWA (Standalone mode) và lưu cache Offline trên Safari iOS / Chrome Mobile chưa được xác minh trên phần cứng thực.
 */
describe('PWA & Offline Capabilities Tests', () => {
  it('validates public/manifest.json structure and attributes', () => {
    const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');
    expect(fs.existsSync(manifestPath)).toBe(true);

    const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);

    expect(manifest.name).toBe('Wordora - Cá nhân hóa học từ vựng');
    expect(manifest.short_name).toBe('Wordora');
    expect(manifest.start_url).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color).toBe('#10b981');
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  it('validates public/sw.js service worker script existence and version', () => {
    const swPath = path.join(process.cwd(), 'public', 'sw.js');
    expect(fs.existsSync(swPath)).toBe(true);

    const swContent = fs.readFileSync(swPath, 'utf-8');
    expect(swContent).toContain('CACHE_NAME');
    expect(swContent).toContain('SKIP_WAITING');
    expect(swContent).toContain('offline.html');
  });

  it('useOnlineStatus returns online state in browser environment', () => {
    const { result } = renderHook(() => useOnlineStatus());
    expect(typeof result.current).toBe('boolean');
  });
});

