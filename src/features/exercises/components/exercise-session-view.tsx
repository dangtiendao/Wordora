'use client';

import * as React from 'react';
import { useExerciseSessionStore } from '../store/exercise-session-store';
import { MultipleChoiceWidget } from './multiple-choice-widget';
import { FillBlankWidget } from './fill-blank-widget';
import { SentenceOrderWidget } from './sentence-order-widget';
import { AnswerEvaluation } from '@/domain/entities/exercise';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { useSpeech } from '@/hooks/use-speech';
import { Volume2, Square, ArrowRight, X } from 'lucide-react';

/**
 * Container điều phối giao diện phiên làm bài tập trắc nghiệm, điền từ và sắp xếp câu (`ExerciseSessionView`).
 *
 * @remarks
 * - **ORCHESTRATION CONTRACT**:
 *   - Lấy trạng thái phiên làm việc từ `useExerciseSessionStore`.
 *   - Điều hướng hiển thị Widget phù hợp (`MultipleChoiceWidget`, `FillBlankWidget`, `SentenceOrderWidget`) dựa theo `currentExercise.type`.
 * - **RESPONSE TIME MEASUREMENT**:
 *   - Khởi tạo `startTime = Date.now()` khi nạp câu hỏi mới.
 *   - Tính `responseTimeMs = Date.now() - startTime` khi nộp câu trả lời để lưu nhật ký ôn tập chính xác.
 * - **AUDIO CLEANUP**:
 *   - Dừng giọng đọc TTS (`stop()`) mỗi khi chuyển sang câu hỏi mới.
 */
export const ExerciseSessionView: React.FC = () => {
  const {
    deckName,
    exercises,
    currentIndex,
    status,
    submitAnswer,
    nextExercise,
    cancelSession,
  } = useExerciseSessionStore();

  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [userEvaluation, setUserEvaluation] = React.useState<AnswerEvaluation | null>(null);
  const [startTime, setStartTime] = React.useState<number>(() => Date.now());
  const [isCancelDialogOpen, setIsCancelDialogOpen] = React.useState(false);

  const { isSupported, isSpeaking, currentText, speak, stop } = useSpeech();

  const currentExercise = exercises[currentIndex];
  const totalExercises = exercises.length;
  const progressPercent = Math.round(((currentIndex + 1) / totalExercises) * 100);

  // Reset timer on new exercise
  React.useEffect(() => {
    let isMounted = true;
    Promise.resolve().then(() => {
      if (isMounted) {
        setStartTime(Date.now());
        setIsSubmitted(false);
        setUserEvaluation(null);
      }
    });
    stop();
    return () => {
      isMounted = false;
    };
  }, [currentIndex, stop]);

  if (status !== 'active' || !currentExercise) {
    return null;
  }

  const isCurrentSpeaking = isSpeaking && currentText === currentExercise.item.prompt;

  const handleAudioPlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isSupported) return;
    if (isCurrentSpeaking) {
      stop();
    } else {
      speak(currentExercise.item.prompt);
    }
  };

  const handleEvaluationResult = (evalResult: AnswerEvaluation) => {
    if (isSubmitted) return;
    const responseTimeMs = Date.now() - startTime;
    setUserEvaluation(evalResult);
    setIsSubmitted(true);
    submitAnswer(evalResult, responseTimeMs);
  };

  const handleNext = () => {
    nextExercise();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 py-2">
      {/* Session Progress Header */}
      <div className="flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-emerald-400">{deckName}</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400 font-medium">
            Câu hỏi {currentIndex + 1} / {totalExercises}
          </span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCancelDialogOpen(true)}
          className="text-slate-400 hover:text-rose-400 h-8 text-xs gap-1"
        >
          <X className="w-3.5 h-3.5" /> Hủy bài tập
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Exercise Card */}
      <Card variant="glass" className="border-slate-800/80 p-6 sm:p-8 space-y-6">
        <CardHeader className="p-0">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-md bg-slate-800 text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
              {currentExercise.type === 'multipleChoice'
                ? 'Trắc nghiệm'
                : currentExercise.type === 'fillInBlank'
                ? 'Điền vào chỗ trống'
                : 'Sắp xếp câu'}
            </span>

            <Button
              variant="ghost"
              size="sm"
              className={`h-7 w-7 p-0 transition-colors ${
                isCurrentSpeaking
                  ? 'text-emerald-400 bg-emerald-950/80 animate-pulse'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
              title={isCurrentSpeaking ? 'Dừng phát âm' : 'Phát âm bằng TTS'}
              onClick={handleAudioPlay}
              disabled={!isSupported}
            >
              {isCurrentSpeaking ? <Square className="w-3.5 h-3.5 fill-current" /> : <Volume2 className="w-4 h-4" />}
            </Button>
          </div>

          <h3 className="text-xl font-bold text-white tracking-tight pt-2">
            {currentExercise.prompt}
          </h3>
        </CardHeader>

        <CardContent className="p-0">
          {currentExercise.type === 'multipleChoice' && (
            <MultipleChoiceWidget
              exercise={currentExercise}
              onEvaluate={handleEvaluationResult}
              isSubmitted={isSubmitted}
              userEvaluation={userEvaluation}
            />
          )}

          {currentExercise.type === 'fillInBlank' && (
            <FillBlankWidget
              exercise={currentExercise}
              onEvaluate={handleEvaluationResult}
              isSubmitted={isSubmitted}
              userEvaluation={userEvaluation}
            />
          )}

          {currentExercise.type === 'sentenceOrdering' && (
            <SentenceOrderWidget
              exercise={currentExercise}
              onEvaluate={handleEvaluationResult}
              isSubmitted={isSubmitted}
              userEvaluation={userEvaluation}
            />
          )}
        </CardContent>

        {/* Next Question Action */}
        {isSubmitted && (
          <div className="flex justify-end pt-4 border-t border-slate-800/80 animate-in fade-in duration-300">
            <Button
              variant="primary"
              size="lg"
              onClick={handleNext}
              className="gap-2 px-6"
            >
              {currentIndex < totalExercises - 1 ? 'Câu tiếp theo' : 'Xem kết quả'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </Card>

      {/* Exit Dialog */}
      <Dialog
        isOpen={isCancelDialogOpen}
        onClose={() => setIsCancelDialogOpen(false)}
        title="Hủy phiên làm bài tập?"
        description="Kết quả các câu đã trả lời của phiên này sẽ bị hủy. Bạn có chắc chắn?"
        confirmText="Hủy phiên bài tập"
        cancelText="Tiếp tục làm bài"
        variant="danger"
        onConfirm={cancelSession}
      />
    </div>
  );
};

