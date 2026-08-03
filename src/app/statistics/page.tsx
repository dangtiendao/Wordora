import * as React from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { BarChart2 } from 'lucide-react';

export default function StatisticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Thống kê học tập"
        description="Theo dõi tiến độ, chuỗi ngày học và hiệu quả ôn tập."
      />

      <EmptyState
        icon={<BarChart2 className="w-6 h-6" />}
        title="Khung giao diện thống kê (Phase 1)"
        description="Module tính toán thống kê và biểu đồ tiến độ sẽ được tích hợp ở Phase 6."
      />
    </div>
  );
}
