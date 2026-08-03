import * as React from 'react';
import { MultipleChoiceExercise, AnswerEvaluation } from '@/domain/entities/exercise';
import { AnswerEvaluator } from '../engine/answer-evaluator';
import { CheckCircle2, XCircle } from 'lucide-react';

export interface MultipleChoiceWidgetProps {
  exercise: MultipleChoiceExercise;
  onEvaluate: (evaluation: AnswerEvaluation) => void;
  isSubmitted: boolean;
  userEvaluation: AnswerEvaluation | null;
}

export const MultipleChoiceWidget: React.FC<MultipleChoiceWidgetProps> = ({
  exercise,
  onEvaluate,
  isSubmitted,
  userEvaluation,
}) => {
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);

  // Reset selected choice when exercise changes
  React.useEffect(() => {
    let isMounted = true;
    Promise.resolve().then(() => {
      if (isMounted) setSelectedIndex(null);
    });
    return () => {
      isMounted = false;
    };
  }, [exercise.id]);

  // Keyboard shortcut listener (keys 1, 2, 3, 4)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSubmitted) return;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= exercise.options.length) {
        e.preventDefault();
        const index = num - 1;
        setSelectedIndex(index);
        const evalResult = AnswerEvaluator.evaluateMultipleChoice(exercise, index);
        onEvaluate(evalResult);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [exercise, isSubmitted, onEvaluate]);

  const handleSelect = (index: number) => {
    if (isSubmitted) return;
    setSelectedIndex(index);
    const evalResult = AnswerEvaluator.evaluateMultipleChoice(exercise, index);
    onEvaluate(evalResult);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {exercise.options.map((option, idx) => {
          const isSelected = selectedIndex === idx;
          const isCorrectIndex = idx === exercise.correctIndex;

          let btnStyle = 'border-slate-800 hover:border-emerald-500/60 bg-slate-900/60 text-white';
          if (isSubmitted) {
            if (isCorrectIndex) {
              btnStyle = 'border-emerald-500 bg-emerald-950/60 text-emerald-300 font-bold';
            } else if (isSelected && !userEvaluation?.isCorrect) {
              btnStyle = 'border-rose-500 bg-rose-950/60 text-rose-300';
            } else {
              btnStyle = 'border-slate-800/40 text-slate-500 opacity-60';
            }
          } else if (isSelected) {
            btnStyle = 'border-emerald-500 bg-emerald-950/40 text-emerald-300 font-semibold';
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={isSubmitted}
              onClick={() => handleSelect(idx)}
              className={`p-4 rounded-2xl border text-left text-sm transition-all flex items-center justify-between gap-3 shadow-lg select-none ${btnStyle}`}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <span className="font-medium">{option}</span>
              </div>

              {isSubmitted && isCorrectIndex && (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              )}
              {isSubmitted && isSelected && !userEvaluation?.isCorrect && (
                <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {!isSubmitted && (
        <p className="text-[11px] text-slate-500 text-center">
          💡 Nhấn phím tắt [1], [2], [3], [4] trên bàn phím để chọn nhanh đáp án.
        </p>
      )}
    </div>
  );
};
