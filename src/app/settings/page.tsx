import * as React from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Cài đặt ứng dụng"
        description="Tùy chỉnh giọng đọc TTS, số lượng bài học, sao lưu & khôi phục dữ liệu."
      />

      <EmptyState
        icon={<Settings className="w-6 h-6" />}
        title="Khung giao diện cài đặt (Phase 1)"
        description="Cấu hình giọng đọc Web Speech, giới hạn học tập và tính năng Export/Import JSON/CSV sẽ được triển khai ở Phase 7 & 8."
      />
    </div>
  );
}
