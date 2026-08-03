import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import DashboardPage from './page';

describe('DashboardPage Smoke Test', () => {
  it('renders dashboard title and presentation placeholder notice', () => {
    render(<DashboardPage />);
    expect(screen.getByText('Trang tổng quan')).toBeInTheDocument();
    expect(screen.getByText(/Thông báo Phase 1:/i)).toBeInTheDocument();
  });

  it('renders quick stats cards', () => {
    render(<DashboardPage />);
    expect(screen.getByText('Mục cần ôn tập')).toBeInTheDocument();
    expect(screen.getByText('Từ mới hôm nay')).toBeInTheDocument();
    expect(screen.getByText('Chuỗi ngày học')).toBeInTheDocument();
  });
});
