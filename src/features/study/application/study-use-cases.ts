import { StudySessionRepository } from '@/domain/repositories/study-session-repository';
import { StudySession } from '@/domain/entities/study-session';
import { getCurrentISOString } from '@/lib/date';

export interface CompleteStudySessionInput {
  deckId: string;
  totalCards: number;
  startedAt: string;
  ratings: Record<number, number>; // Rating 1, 2, 3, 4 count breakdown
  mode?: 'flashcard';
}

export class StudyUseCases {
  constructor(private studySessionRepo: StudySessionRepository) {}

  async completeStudySession(input: CompleteStudySessionInput): Promise<StudySession> {
    const completedAt = getCurrentISOString();
    const startTime = new Date(input.startedAt).getTime();
    const endTime = new Date(completedAt).getTime();
    const durationSeconds = Math.max(1, Math.round((endTime - startTime) / 1000));

    const goodCount = input.ratings[3] || 0;
    const easyCount = input.ratings[4] || 0;
    const correctCards = goodCount + easyCount;

    return await this.studySessionRepo.create({
      deckId: input.deckId,
      mode: input.mode || 'flashcard',
      startedAt: input.startedAt,
      completedAt,
      totalQuestions: input.totalCards,
      correctAnswers: correctCards,
      durationSeconds,
    });
  }

  async listStudySessions(deckId?: string): Promise<StudySession[]> {
    return await this.studySessionRepo.list({ deckId });
  }
}
