import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { renderHook } from '@testing-library/react';
import { useOnlineStatus } from '@/hooks/use-online-status';

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
