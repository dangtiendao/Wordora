'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { LearningItem } from '@/domain/entities/learning-item';
import { ReviewState } from '@/domain/entities/review-state';
import { CardRating } from '../store/study-session-store';
import { useSpeech } from '@/hooks/use-speech';
import { VoiceRecorderWidget } from '@/features/recording';
import { SM2Scheduler } from '@/features/srs';
import { RotateCw, Volume2, Square, X, Tag, HelpCircle } from 'lucide-react';

export interface FlashcardViewProps {
  deckName: string;
  item: LearningItem;
  reviewState?: ReviewState;
  currentIndex: number;
  totalItems: number;
  isAnswerVisible: boolean;
  onFlip: () => void;
  onRate: (rating: CardRating) => void;
  onCancel: () => void;
}

/**
 * Component hiển thị giao diện học từ vựng dạng thẻ ghi nhớ Flashcard (`FlashcardView`).
 *
 * @remarks
 * - **FLIP-BEFORE-RATE INVARIANT**:
 *   - Các nút đánh giá mức độ nhớ (1: Chưa nhớ, 2: Khó, 3: Nhớ, 4: Rất dễ) bị vô hiệu hóa (`disabled={!isAnswerVisible}`) cho tới khi người dùng lật thẻ xem đáp án.
 * - **KEYBOARD SHORTCUT CONTRACT**:
 *   - `Space` / `Enter`: Lật mặt thẻ.
 *   - Phím `1`, `2`, `3`, `4`: Đánh giá mức độ ghi nhớ (chỉ có tác dụng khi `isAnswerVisible === true`).
 *   - Phím `Escape`: Mở hộp thoại xác nhận hủy phiên học.
 *   - Có guard kiểm tra tiêu điểm bàn phím (`INPUT`, `TEXTAREA`, `SELECT`) để không kích hoạt phím tắt khi người dùng đang gõ văn bản.
 * - **AUDIO CLEANUP BOUNDARY**:
 *   - Tự động gọi `stop()` ngắt âm thanh TTS khi `currentIndex` hoặc `isAnswerVisible` thay đổi để tránh chồng lấp giọng đọc.
 * - **SRS INTERVAL PREVIEW COMPUTATION**:
 *   - Tính toán khoảng thời gian lặp lại SRS tiếp theo xem trước qua `SM2Scheduler.previewIntervals()` hiển thị trực tiếp trên từng nút đánh giá.
 */
export const FlashcardView: React.FC<FlashcardViewProps> = ({
  deckName,
  item,
  reviewState,
  currentIndex,
  totalItems,
  isAnswerVisible,
  onFlip,
  onRate,
  onCancel,
}) => {
  const [isCancelDialogOpen, setIsCancelDialogOpen] = React.useState(false);
  const { isSupported, isSpeaking, currentText, speak, stop } = useSpeech();

  const progressPercent = Math.round(((currentIndex + 1) / totalItems) * 100);

  const textToRead = isAnswerVisible ? item.answer : item.prompt;
  const isCurrentSpeaking = isSpeaking && currentText === textToRead;

  // Calculate SRS interval previews for rating buttons
  const previews = React.useMemo(() => {
    const dummyState: ReviewState = reviewState || {
      id: `tmp-${item.id}`,
      itemId: item.id,
      status: 'new',
      easeFactor: 2.5,
      intervalDays: 0,
      repetitions: 0,
      lapses: 0,
      dueAt: new Date().toISOString(),
      algorithmVersion: SM2Scheduler.ALGORITHM_VERSION,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return SM2Scheduler.previewIntervals(dummyState);
  }, [reviewState, item.id]);

  // Auto stop audio when switching items or flipping
  React.useEffect(() => {
    stop();
  }, [currentIndex, isAnswerVisible, stop]);

  // Keyboard shortcut listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        onFlip();
      } else if (e.key === '1' && isAnswerVisible) {
        e.preventDefault();
        onRate(1);
      } else if (e.key === '2' && isAnswerVisible) {
        e.preventDefault();
        onRate(2);
      } else if (e.key === '3' && isAnswerVisible) {
        e.preventDefault();
        onRate(3);
      } else if (e.key === '4' && isAnswerVisible) {
        e.preventDefault();
        onRate(4);
      } else if (e.code === 'Escape') {
        e.preventDefault();
        setIsCancelDialogOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onFlip, onRate, isAnswerVisible]);

  const handleAudioPlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isSupported) return;
    if (isCurrentSpeaking) {
      stop();
    } else {
      speak(textToRead);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 py-2">
      {/* Session Progress Header */}
      <div className="flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-emerald-400">{deckName}</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400 font-medium">
            Thẻ {currentIndex + 1} / {totalItems}
          </span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCancelDialogOpen(true)}
          className="text-slate-400 hover:text-rose-400 h-8 text-xs gap-1"
        >
          <X className="w-3.5 h-3.5" /> Thoát phiên
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Flashcard Container with Flip Animation */}
      <div
        className="relative min-h-[320px] sm:min-h-[360px] cursor-pointer perspective-1000 select-none group"
        onClick={onFlip}
      >
        <Card
          variant="glass"
          className={`w-full min-h-[320px] sm:min-h-[360px] p-6 sm:p-8 flex flex-col justify-between transition-all duration-500 transform-gpu border-slate-800/80 shadow-2xl relative ${
            isAnswerVisible
              ? 'bg-slate-900/90 border-emerald-500/40 shadow-emerald-950/20'
              : 'hover:border-slate-700 hover:bg-slate-900/70'
          }`}
        >
          {/* Card Top Header */}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="px-2 py-0.5 rounded-md bg-slate-800 font-medium uppercase tracking-wider text-[10px]">
              {item.type}
            </span>

            <Button
              variant="ghost"
              size="sm"
              className={`h-7 w-7 p-0 transition-colors ${
                isCurrentSpeaking
                  ? 'text-emerald-400 bg-emerald-950/80 animate-pulse'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
              title={
                !isSupported
                  ? 'Trình duyệt không hỗ trợ Web Speech API'
                  : isCurrentSpeaking
                  ? 'Dừng phát âm'
                  : 'Phát âm bằng TTS'
              }
              onClick={handleAudioPlay}
              disabled={!isSupported}
            >
              {isCurrentSpeaking ? <Square className="w-3.5 h-3.5 fill-current" /> : <Volume2 className="w-4 h-4" />}
            </Button>
          </div>

          {/* Card Main Body */}
          <div className="py-6 text-center space-y-4 my-auto">
            {/* Front Prompt */}
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {item.prompt}
              </h2>

              {item.phonetic && (
                <p className="text-sm font-mono text-emerald-400/90 font-medium">
                  {item.phonetic}
                </p>
              )}
            </div>

            {/* Back Answer & Details */}
            {isAnswerVisible ? (
              <div className="pt-4 border-t border-slate-800/80 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <p className="text-xl sm:text-2xl font-bold text-emerald-400">
                  {item.answer}
                </p>

                {item.example && (
                  <div className="max-w-md mx-auto p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-left space-y-1">
                    <p className="text-slate-200 italic">&ldquo;{item.example}&rdquo;</p>
                    {item.exampleTranslation && (
                      <p className="text-slate-400">➔ {item.exampleTranslation}</p>
                    )}
                  </div>
                )}

                {item.note && (
                  <p className="text-xs text-slate-400 italic bg-amber-950/20 border border-amber-900/40 p-2 rounded-lg max-w-md mx-auto">
                    💡 {item.note}
                  </p>
                )}
              </div>
            ) : (
              <div className="pt-6 flex flex-col items-center gap-1.5 text-xs text-slate-500 group-hover:text-slate-400 transition-colors">
                <RotateCw className="w-4 h-4 animate-pulse" />
                <span>Nhấp thẻ hoặc nhấn [Space] để lật đáp án</span>
              </div>
            )}
          </div>

          {/* Card Footer Tags */}
          <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-800/60 pt-3">
            <span className="flex items-center gap-1 text-[11px]">
              <HelpCircle className="w-3 h-3" /> Độ khó: {item.difficulty || 3}/5
            </span>

            {item.tags && item.tags.length > 0 && (
              <div className="flex items-center gap-1">
                <Tag className="w-3 h-3" />
                <span className="text-[10px] text-slate-400">#{item.tags[0]}</span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Voice Recorder Widget for Pronunciation Practice */}
      <VoiceRecorderWidget itemId={item.id} itemPrompt={item.prompt} />

      {/* Rating Buttons Section with SRS Interval Previews */}
      <div className="space-y-2 pt-2">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Button
            variant="danger"
            size="lg"
            disabled={!isAnswerVisible}
            onClick={() => onRate(1)}
            className="flex flex-col py-3 h-auto gap-0.5"
          >
            <span className="font-bold text-sm">1. Chưa nhớ</span>
            <span className="text-[10px] opacity-80 font-normal">Học lại ({previews.again})</span>
          </Button>

          <Button
            variant="secondary"
            size="lg"
            disabled={!isAnswerVisible}
            onClick={() => onRate(2)}
            className="flex flex-col py-3 h-auto gap-0.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold border-amber-500"
          >
            <span className="font-bold text-sm">2. Khó</span>
            <span className="text-[10px] opacity-90 font-normal">Chưa chắc ({previews.hard})</span>
          </Button>

          <Button
            variant="secondary"
            size="lg"
            disabled={!isAnswerVisible}
            onClick={() => onRate(3)}
            className="flex flex-col py-3 h-auto gap-0.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
          >
            <span className="font-bold text-sm">3. Nhớ</span>
            <span className="text-[10px] opacity-90 font-normal">Đã nhớ ({previews.good})</span>
          </Button>

          <Button
            variant="primary"
            size="lg"
            disabled={!isAnswerVisible}
            onClick={() => onRate(4)}
            className="flex flex-col py-3 h-auto gap-0.5"
          >
            <span className="font-bold text-sm">4. Rất dễ</span>
            <span className="text-[10px] opacity-90 font-normal">Thành thạo ({previews.easy})</span>
          </Button>
        </div>

        <p className="text-[11px] text-center text-slate-500">
          {!isAnswerVisible
            ? '💡 Lật thẻ để mở khóa các nút tự đánh giá'
            : 'Phím tắt: [Space] Lật thẻ | [1] Chưa nhớ | [2] Khó | [3] Nhớ | [4] Rất dễ'}
        </p>
      </div>

      {/* Exit Session Confirmation Dialog */}
      <Dialog
        isOpen={isCancelDialogOpen}
        onClose={() => setIsCancelDialogOpen(false)}
        title="Hủy phiên học hiện tại?"
        description="Tiến trình học tạm thời của phiên này chưa được hoàn tất. Bạn có chắc chắn muốn thoát?"
        confirmText="Hủy phiên học"
        cancelText="Tiếp tục học"
        variant="danger"
        onConfirm={onCancel}
      />
    </div>
  );
};

