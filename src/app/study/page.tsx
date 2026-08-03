import * as React from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { GraduationCap } from 'lucide-react';

export default function StudyPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Phiên học flashcard & Bài tập"
        description="Luyện tập từ vựng, phát âm và bài tập tương tác."
      />

      <EmptyState
        icon={<GraduationCap className="w-6 h-6" />}
        title="Khung giao diện học tập (Phase 1)"
        description="Tính năng Flashcard, Web Speech API TTS, ghi âm và bài tập tương tác sẽ được triển khai ở các phase tiếp theo."
      />
    </div>
  );
}
