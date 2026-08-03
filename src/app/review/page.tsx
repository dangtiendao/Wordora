import * as React from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { RefreshCw } from 'lucide-react';

export default function ReviewPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Ôn tập ngắt quãng (SRS)"
        description="Ôn lại những từ cần củng cố theo thuật toán lặp lại ngắt quãng."
      />

      <EmptyState
        icon={<RefreshCw className="w-6 h-6" />}
        title="Khung tính năng ôn tập ngắt quãng (Phase 1)"
        description="Thuật toán ôn tập SRS độc lập và bộ đếm thời gian đến hạn sẽ được tích hợp ở Phase 4."
      />
    </div>
  );
}
