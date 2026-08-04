import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import DashboardPage from './page';

describe('DashboardPage Smoke Test', () => {
  it('renders dashboard header and CTA buttons', () => {
    render(<DashboardPage />);
    expect(screen.getByText('Trang tổng quan')).toBeInTheDocument();
    expect(screen.getByText('Làm bài tập')).toBeInTheDocument();
  });

  it('renders quick stats cards', () => {
    render(<DashboardPage />);
    expect(screen.getByText('Từ đến hạn hôm nay')).toBeInTheDocument();
    expect(screen.getByText('Từ mới hôm nay')).toBeInTheDocument();
    expect(screen.getByText('Chuỗi ngày học')).toBeInTheDocument();
    expect(screen.getByText('Thời gian học hôm nay')).toBeInTheDocument();
  });
});
