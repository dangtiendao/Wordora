import { test, expect } from '@playwright/test';

test.describe('Wordora Core User Journeys E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('E2E-1: Dashboard page loads with header and quick stats cards', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Trang tổng quan');
    await expect(page.getByText('Từ đến hạn hôm nay')).toBeVisible();
    await expect(page.getByText('Từ mới hôm nay')).toBeVisible();
    await expect(page.getByText('Chuỗi ngày học')).toBeVisible();
  });

  test('E2E-2: Navigation to Decks page and Deck list rendering', async ({ page }) => {
    await page.goto('/decks');
    await expect(page.locator('h1')).toContainText('Danh sách Bộ học');
    await expect(page.getByRole('button', { name: 'Tạo bộ học mới' })).toBeVisible();
  });

  test('E2E-3: Navigation to Study page and Flashcard Setup', async ({ page }) => {
    await page.goto('/study');
    await expect(page.locator('h1')).toContainText('Phiên học Flashcard');
  });

  test('E2E-4: Navigation to Review Exercise page', async ({ page }) => {
    await page.goto('/review');
    await expect(page.locator('h1')).toContainText('Luyện tập & Bài tập');
  });

  test('E2E-5: Navigation to Statistics page and filters', async ({ page }) => {
    await page.goto('/statistics');
    await expect(page.locator('h1')).toContainText('Thống kê & Tiến độ học tập');
    await expect(page.getByText('Tỷ lệ chính xác')).toBeVisible();
    await expect(page.getByText('Tổng thời gian học')).toBeVisible();
  });

  test('E2E-6: Navigation to Settings page and Backup UI', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.locator('h1')).toContainText('Cài đặt ứng dụng');
    await expect(page.getByText('Sao lưu & Khôi phục dữ liệu')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Xuất bản sao lưu (JSON)' })).toBeVisible();
  });
});
