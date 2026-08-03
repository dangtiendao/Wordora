import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import DashboardPage from './page';

describe('DashboardPage Smoke Test', () => {
  it('renders dashboard header and CTA button', () => {
    render(<DashboardPage />);
    expect(screen.getByText('Trang tổng quan')).toBeInTheDocument();
    expect(screen.getByText('Bắt đầu học ngay')).toBeInTheDocument();
  });

  it('renders quick stats cards', () => {
    render(<DashboardPage />);
    expect(screen.getByText('Mục cần ôn tập')).toBeInTheDocument();
    expect(screen.getByText('Bộ học đang active')).toBeInTheDocument();
    expect(screen.getByText('Chuỗi ngày học')).toBeInTheDocument();
  });
});
