import { ReviewRating } from '@/domain/value-objects/types';

export class ExerciseSrsMapper {
  /**
   * Maps an exercise result to an SRS ReviewRating based on correctness and response time.
   */
  static mapToRating(isCorrect: boolean, responseTimeMs: number): ReviewRating {
    if (!isCorrect) {
      return 'again';
    }

    const responseTimeSec = responseTimeMs / 1000;

    if (responseTimeSec < 3.0) {
      return 'easy';
    } else if (responseTimeSec <= 8.0) {
      return 'good';
    } else {
      return 'hard';
    }
  }
}
