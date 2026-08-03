import * as React from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Layers, Plus } from 'lucide-react';

export default function DecksPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý bộ học"
        description="Danh sách các bộ từ vựng, cụm từ và mẫu câu của bạn."
        action={
          <Button size="md">
            <Plus className="w-4 h-4 mr-1" /> Tạo bộ học mới
          </Button>
        }
      />

      <EmptyState
        icon={<Layers className="w-6 h-6" />}
        title="Khung quản lý bộ học (Phase 1)"
        description="Tính năng lưu trữ và quản lý bộ học IndexedDB sẽ được kết nối ở Phase 2."
      />
    </div>
  );
}
