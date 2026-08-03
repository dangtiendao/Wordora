'use client';

import * as React from 'react';
import { FillBlankExercise, AnswerEvaluation } from '@/domain/entities/exercise';
import { AnswerEvaluator } from '../engine/answer-evaluator';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, CheckCircle2, XCircle } from 'lucide-react';

export interface FillBlankWidgetProps {
  exercise: FillBlankExercise;
  onEvaluate: (evaluation: AnswerEvaluation) => void;
  isSubmitted: boolean;
  userEvaluation: AnswerEvaluation | null;
}

export const FillBlankWidget: React.FC<FillBlankWidgetProps> = ({
  exercise,
  onEvaluate,
  isSubmitted,
  userEvaluation,
}) => {
  const [inputVal, setInputVal] = React.useState('');

  React.useEffect(() => {
    let isMounted = true;
    Promise.resolve().then(() => {
      if (isMounted) setInputVal('');
    });
    return () => {
      isMounted = false;
    };
  }, [exercise.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitted || !inputVal.trim()) return;
    const evalResult = AnswerEvaluator.evaluateFillBlank(exercise, inputVal);
    onEvaluate(evalResult);
  };

  return (
    <div className="space-y-4">
      {/* Display sentence with blank */}
      <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
        <p className="text-lg font-bold text-slate-100 tracking-wide leading-relaxed">
          {exercise.sentenceWithBlank}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="text"
          placeholder="Nhập từ còn thiếu ở đây..."
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          disabled={isSubmitted}
          autoFocus
          className="text-base"
        />

        {!isSubmitted && (
          <Button type="submit" variant="primary" disabled={!inputVal.trim()} className="gap-1 shrink-0">
            <Send className="w-4 h-4" /> Trả lời
          </Button>
        )}
      </form>

      {isSubmitted && userEvaluation && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-start gap-3 animate-in fade-in duration-300 ${
            userEvaluation.isCorrect
              ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
              : 'bg-rose-950/40 border-rose-800/80 text-rose-300'
          }`}
        >
          {userEvaluation.isCorrect ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}

          <div className="space-y-1">
            <p className="font-semibold text-sm">{userEvaluation.feedback}</p>
            {!userEvaluation.isCorrect && (
              <p className="text-slate-300">
                Đáp án chuẩn: <strong className="text-emerald-400 font-mono">{exercise.correctAnswer}</strong>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
