'use client';

import * as React from 'react';
import { SentenceOrderExercise, OrderToken, AnswerEvaluation } from '@/domain/entities/exercise';
import { AnswerEvaluator } from '../engine/answer-evaluator';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Undo2, Send } from 'lucide-react';

export interface SentenceOrderWidgetProps {
  exercise: SentenceOrderExercise;
  onEvaluate: (evaluation: AnswerEvaluation) => void;
  isSubmitted: boolean;
  userEvaluation: AnswerEvaluation | null;
}

export const SentenceOrderWidget: React.FC<SentenceOrderWidgetProps> = ({
  exercise,
  onEvaluate,
  isSubmitted,
  userEvaluation,
}) => {
  const [availableTokens, setAvailableTokens] = React.useState<OrderToken[]>([]);
  const [selectedTokens, setSelectedTokens] = React.useState<OrderToken[]>([]);

  // Initialize token pool on exercise load
  React.useEffect(() => {
    let isMounted = true;
    Promise.resolve().then(() => {
      if (isMounted) {
        setAvailableTokens(exercise.tokens);
        setSelectedTokens([]);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [exercise]);

  const handleSelectToken = (token: OrderToken) => {
    if (isSubmitted) return;
    setAvailableTokens((prev) => prev.filter((t) => t.id !== token.id));
    setSelectedTokens((prev) => [...prev, token]);
  };

  const handleDeselectToken = (token: OrderToken) => {
    if (isSubmitted) return;
    setSelectedTokens((prev) => prev.filter((t) => t.id !== token.id));
    setAvailableTokens((prev) => [...prev, token]);
  };

  const handleReset = () => {
    if (isSubmitted) return;
    setAvailableTokens(exercise.tokens);
    setSelectedTokens([]);
  };

  const handleSubmit = () => {
    if (isSubmitted || selectedTokens.length === 0) return;
    const selectedIds = selectedTokens.map((t) => t.id);
    const evalResult = AnswerEvaluator.evaluateSentenceOrder(exercise, selectedIds);
    onEvaluate(evalResult);
  };

  return (
    <div className="space-y-4">
      {/* Selected Answer Sequence Area */}
      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 min-h-[90px] flex flex-wrap items-center gap-2">
        {selectedTokens.length === 0 ? (
          <span className="text-xs text-slate-500 italic mx-auto">
            Nhấp các thẻ từ bên dưới để sắp xếp thành câu đúng...
          </span>
        ) : (
          selectedTokens.map((token) => (
            <button
              key={token.id}
              type="button"
              disabled={isSubmitted}
              onClick={() => handleDeselectToken(token)}
              className="px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 font-semibold text-sm hover:bg-emerald-900/60 transition-all shadow-md active:scale-95"
            >
              {token.text}
            </button>
          ))
        )}
      </div>

      {/* Available Token Pool */}
      <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex flex-wrap items-center justify-center gap-2.5">
        {availableTokens.map((token) => (
          <button
            key={token.id}
            type="button"
            disabled={isSubmitted}
            onClick={() => handleSelectToken(token)}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700/80 text-slate-200 font-medium text-sm hover:border-emerald-500 hover:text-emerald-400 transition-all shadow-md active:scale-95"
          >
            {token.text}
          </button>
        ))}
      </div>

      {/* Control Actions */}
      {!isSubmitted && (
        <div className="flex items-center justify-between gap-2 pt-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={selectedTokens.length === 0}
            className="gap-1 text-xs text-slate-400"
          >
            <Undo2 className="w-3.5 h-3.5" /> Đặt lại từ đầu
          </Button>

          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleSubmit}
            disabled={selectedTokens.length === 0}
            className="gap-1.5"
          >
            <Send className="w-4 h-4" /> Trả lời
          </Button>
        </div>
      )}

      {/* Evaluation Feedback */}
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
                Câu đúng chuẩn: <strong className="text-emerald-400 font-sans">{exercise.originalSentence}</strong>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
