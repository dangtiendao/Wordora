'use client';

import * as React from 'react';
import { useExerciseSessionStore } from '../store/exercise-session-store';
import { useDatabase } from '@/hooks/use-database';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, CheckCircle2, XCircle, Clock, RotateCcw, Home } from 'lucide-react';
import { generateUUID } from '@/lib/uuid';
import { getCurrentISOString } from '@/lib/date';

export const ExerciseSummaryView: React.FC = () => {
  const { deckId, deckName, results, resetSession } = useExerciseSessionStore();
  const { container } = useDatabase();

  const totalQuestions = results.length;
  const correctAnswers = results.filter((r) => r.isCorrect).length;
  const scorePercent = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

  const totalDurationMs = results.reduce((acc, curr) => acc + curr.responseTimeMs, 0);
  const durationSeconds = Math.max(1, Math.round(totalDurationMs / 1000));
  const avgResponseTimeSec = totalQuestions > 0 ? (durationSeconds / totalQuestions).toFixed(1) : '0';

  // Persist completed StudySession into IndexedDB
  React.useEffect(() => {
    if (container && deckId && totalQuestions > 0) {
      const saveStudySession = async () => {
        try {
          await container.studySessionRepository.create({
            id: generateUUID(),
            deckId,
            mode: 'quiz',
            totalQuestions,
            correctAnswers,
            durationSeconds,
            startedAt: getCurrentISOString(),
            completedAt: getCurrentISOString(),
          });
        } catch {
          // Silent catch
        }
      };
      saveStudySession();
    }
  }, [container, deckId, totalQuestions, correctAnswers, durationSeconds]);

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4 animate-in fade-in duration-300">
      {/* Header Summary Card */}
      <Card variant="glass" className="text-center p-6 sm:p-8 space-y-4 border-slate-800">
        <div className="w-16 h-16 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-xl">
          <Trophy className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <CardTitle className="text-2xl sm:text-3xl font-extrabold text-white">
            Hoàn thành bài tập!
          </CardTitle>
          <p className="text-xs text-slate-400">
            Bộ học: <strong className="text-emerald-400">{deckName}</strong>
          </p>
        </div>

        {/* Score & Time Stats Grid */}
        <div className="grid grid-cols-3 gap-3 max-w-md mx-auto pt-2">
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Tỷ lệ đúng</span>
            <span className="text-xl font-bold text-emerald-400">{scorePercent}%</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Số câu đúng</span>
            <span className="text-xl font-bold text-emerald-400">
              {correctAnswers} / {totalQuestions}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">T/g TB / câu</span>
            <span className="text-xl font-bold text-teal-400 flex items-center justify-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {avgResponseTimeSec}s
            </span>
          </div>
        </div>
      </Card>

      {/* Detailed Results Breakdown */}
      <Card variant="glass" className="border-slate-800 p-6 space-y-4">
        <CardHeader className="p-0 pb-2">
          <CardTitle className="text-sm font-bold text-slate-300">
            Chi tiết kết quả làm bài tập ({results.length} câu)
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0 space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
          {results.map((res, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                res.isCorrect
                  ? 'bg-emerald-950/20 border-emerald-900/40 text-slate-200'
                  : 'bg-rose-950/20 border-rose-900/40 text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {res.isCorrect ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}

                <div className="truncate">
                  <p className="font-semibold text-slate-100 truncate">{res.prompt}</p>
                  <p className="text-[11px] text-slate-400 truncate">
                    Bạn chọn: <span className={res.isCorrect ? 'text-emerald-400' : 'text-rose-400'}>{res.userResponse}</span>
                    {!res.isCorrect && (
                      <span className="text-slate-400 italic"> (Đúng: {res.correctAnswer})</span>
                    )}
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-mono text-slate-500 shrink-0">
                {(res.responseTimeMs / 1000).toFixed(1)}s
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Action Footer */}
      <div className="flex items-center justify-center gap-3 pt-2">
        <Button
          variant="outline"
          size="md"
          onClick={resetSession}
          className="gap-2 text-slate-300"
        >
          <RotateCcw className="w-4 h-4" /> Làm lại bài tập
        </Button>

        <Button
          variant="primary"
          size="md"
          onClick={resetSession}
          className="gap-2"
        >
          <Home className="w-4 h-4" /> Về trang tổng quan
        </Button>
      </div>
    </div>
  );
};
