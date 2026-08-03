'use client';

import * as React from 'react';
import { useDatabase } from '@/hooks/use-database';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Deck } from '@/domain/entities/deck';
import { Exercise } from '@/domain/entities/exercise';
import { ExerciseGenerator } from '@/features/exercises/engine/exercise-generator';
import {
  useExerciseSessionStore,
  ExerciseSessionView,
  ExerciseSummaryView,
} from '@/features/exercises';
import { Brain, Play, AlertCircle } from 'lucide-react';

export default function ReviewPage() {
  const { status, container } = useDatabase();
  const { status: sessionStatus, startSession } = useExerciseSessionStore();

  const [decks, setDecks] = React.useState<Deck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = React.useState<string>('');
  const [exerciseMode, setExerciseMode] = React.useState<string>('mixed');
  const [questionCount, setQuestionCount] = React.useState<number>(10);

  const [isLoadingDecks, setIsLoadingDecks] = React.useState(true);
  const [isBuildingSession, setIsBuildingSession] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Load active decks
  const loadDecks = React.useCallback(async () => {
    if (!container) return;
    setIsLoadingDecks(true);
    try {
      const active = await container.deckRepository.list(false);
      setDecks(active);
      if (active.length > 0 && !selectedDeckId) {
        setSelectedDeckId(active[0].id);
      }
    } catch {
      // Silent catch
    } finally {
      setIsLoadingDecks(false);
    }
  }, [container, selectedDeckId]);

  React.useEffect(() => {
    let isMounted = true;
    if (status === 'ready') {
      Promise.resolve().then(() => {
        if (isMounted) loadDecks();
      });
    }
    return () => {
      isMounted = false;
    };
  }, [status, loadDecks]);

  const handleStartExercises = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!container || !selectedDeckId) return;

    setIsBuildingSession(true);
    setErrorMsg(null);

    try {
      const targetDeck = decks.find((d) => d.id === selectedDeckId);
      const items = await container.learningItemRepository.list({ deckId: selectedDeckId });

      if (!items || items.length === 0) {
        setErrorMsg('Bộ học này chưa có từ vựng / câu học. Vui lòng thêm từ vựng trước khi làm bài tập.');
        return;
      }

      const generatedExercises: Exercise[] = [];

      for (const item of items) {
        if (exerciseMode === 'multiple_choice' || exerciseMode === 'mixed') {
          const mc = ExerciseGenerator.generateMultipleChoice(item, items);
          if (mc) generatedExercises.push(mc);
        }

        if (exerciseMode === 'fill_blank' || exerciseMode === 'mixed') {
          const fb = ExerciseGenerator.generateFillBlank(item);
          if (fb) generatedExercises.push(fb);
        }

        if (exerciseMode === 'sentence_order' || exerciseMode === 'mixed') {
          const so = ExerciseGenerator.generateSentenceOrder(item);
          if (so) generatedExercises.push(so);
        }

        if (generatedExercises.length >= questionCount * 2) break;
      }

      if (generatedExercises.length === 0) {
        setErrorMsg('Không đủ dữ liệu để tạo bài tập cho chế độ này. Hãy thử thêm từ vựng hoặc câu hoàn chỉnh.');
        return;
      }

      // Shuffle generated exercises
      const finalExercises = generatedExercises
        .sort(() => Math.random() - 0.5)
        .slice(0, questionCount);

      startSession(selectedDeckId, targetDeck?.name || 'Bộ học', finalExercises);
    } catch {
      setErrorMsg('Đã có lỗi xảy ra khi tạo danh sách bài tập.');
    } finally {
      setIsBuildingSession(false);
    }
  };

  if (status === 'initializing' || isLoadingDecks) {
    return <LoadingState label="Đang tải dữ liệu bộ học..." />;
  }

  if (status === 'error') {
    return <ErrorState message="Không thể kết nối tới cơ sở dữ liệu IndexedDB." />;
  }

  // Active Session View
  if (sessionStatus === 'active') {
    return <ExerciseSessionView />;
  }

  // Summary Report View
  if (sessionStatus === 'completed') {
    return <ExerciseSummaryView />;
  }

  // Setup Form View
  return (
    <div className="space-y-6">
      <PageHeader
        title="Luyện tập & Bài tập"
        description="Rèn luyện từ vựng qua bài tập trắc nghiệm, điền từ vào chỗ trống và sắp xếp câu hoàn chỉnh."
      />

      {decks.length === 0 ? (
        <EmptyState
          icon={<Brain className="w-6 h-6" />}
          title="Chưa có bộ học nào"
          description="Vui lòng tạo bộ học và thêm từ vựng để bắt đầu các bài luyện tập."
        />
      ) : (
        <Card variant="glass" className="max-w-xl mx-auto border-slate-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-emerald-400" />
              <div>
                <CardTitle className="text-lg">Cấu hình bài luyện tập</CardTitle>
                <CardDescription>
                  Chọn bộ học và dạng bài tập để khởi tạo phiên làm bài.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/80 text-xs text-rose-300 flex items-center gap-2 mb-4">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleStartExercises} className="space-y-4">
              <Select
                label="Chọn bộ học"
                options={decks.map((d) => ({ value: d.id, label: `${d.name} (${d.sourceLanguage} ➔ ${d.targetLanguage})` }))}
                value={selectedDeckId}
                onChange={(e) => setSelectedDeckId(e.target.value)}
              />

              <Select
                label="Dạng bài tập"
                options={[
                  { value: 'mixed', label: '🔀 Hỗn hợp (Trắc nghiệm, Điền từ & Sắp xếp câu)' },
                  { value: 'multiple_choice', label: '🎯 Trắc nghiệm 4 đáp án (Multiple Choice)' },
                  { value: 'fill_blank', label: '✍️ Điền vào chỗ trống (Fill in the Blank)' },
                  { value: 'sentence_order', label: '🧩 Sắp xếp các từ thành câu (Sentence Ordering)' },
                ]}
                value={exerciseMode}
                onChange={(e) => setExerciseMode(e.target.value)}
              />

              <Select
                label="Số lượng câu hỏi"
                options={[
                  { value: '5', label: '5 câu (Luyện nhanh)' },
                  { value: '10', label: '10 câu (Tiêu chuẩn)' },
                  { value: '15', label: '15 câu (Chuyên sâu)' },
                  { value: '20', label: '20 câu (Thử thách)' },
                ]}
                value={String(questionCount)}
                onChange={(e) => setQuestionCount(parseInt(e.target.value, 10))}
              />

              <div className="pt-4 border-t border-slate-800/80">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isBuildingSession}
                  className="w-full gap-2 text-sm"
                >
                  <Play className="w-4 h-4 fill-current" /> Bắt đầu làm bài tập
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
