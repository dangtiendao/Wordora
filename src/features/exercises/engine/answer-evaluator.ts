import {
  MultipleChoiceExercise,
  FillBlankExercise,
  SentenceOrderExercise,
  AnswerEvaluation,
} from '@/domain/entities/exercise';

export interface FillBlankEvaluationOptions {
  caseSensitive?: boolean;
  ignorePunctuation?: boolean;
}

export class AnswerEvaluator {
  /**
   * Normalizes text preserving Unicode accents, collapsing multiple spaces.
   */
  static normalizeText(text: string, options?: FillBlankEvaluationOptions): string {
    let result = text.normalize('NFC').trim();

    if (!options?.caseSensitive) {
      result = result.toLowerCase();
    }

    if (options?.ignorePunctuation) {
      // Remove common punctuation while strictly preserving word characters and Unicode accents
      result = result.replace(/[.,/#!$%^&*;:{}=\-_`~()?'""]/g, '');
    }

    // Collapse multiple spaces into single space
    return result.replace(/\s+/g, ' ').trim();
  }

  /**
   * Evaluates Multiple Choice answer.
   */
  static evaluateMultipleChoice(
    exercise: MultipleChoiceExercise,
    selectedIndex: number
  ): AnswerEvaluation {
    const isCorrect = selectedIndex === exercise.correctIndex;
    const userChoice = exercise.options[selectedIndex] || 'Không chọn';
    const correctAnswer = exercise.options[exercise.correctIndex];

    return {
      isCorrect,
      userChoice,
      correctAnswer,
      feedback: isCorrect
        ? 'Chính xác! Bạn đã chọn đáp án đúng.'
        : `Chưa chính xác. Đáp án đúng là: "${correctAnswer}".`,
    };
  }

  /**
   * Evaluates Fill-in-the-Blank answer.
   */
  static evaluateFillBlank(
    exercise: FillBlankExercise,
    userInput: string,
    options?: FillBlankEvaluationOptions
  ): AnswerEvaluation {
    const normInput = this.normalizeText(userInput, options);
    const normCorrect = this.normalizeText(exercise.correctAnswer, options);

    const isAcceptable =
      normInput === normCorrect ||
      (exercise.acceptableAnswers &&
        exercise.acceptableAnswers.some(
          (ans) => this.normalizeText(ans, options) === normInput
        ));

    return {
      isCorrect: Boolean(isAcceptable),
      userChoice: userInput.trim(),
      correctAnswer: exercise.correctAnswer,
      feedback: isAcceptable
        ? 'Chính xác! Bạn đã điền từ chuẩn.'
        : `Chưa chính xác. Đáp án đúng là: "${exercise.correctAnswer}".`,
    };
  }

  /**
   * Evaluates Sentence Order answer.
   */
  static evaluateSentenceOrder(
    exercise: SentenceOrderExercise,
    selectedTokenIds: string[]
  ): AnswerEvaluation {
    // 1. Direct Token ID sequence comparison
    const isExactSequenceMatch =
      selectedTokenIds.length === exercise.correctTokenSequence.length &&
      selectedTokenIds.every((id, idx) => id === exercise.correctTokenSequence[idx]);

    // 2. Text sequence comparison (handles alternate identical word tokens)
    const userSentence = selectedTokenIds
      .map((id) => exercise.tokens.find((t) => t.id === id)?.text || '')
      .join(' ')
      .trim();

    const normUser = this.normalizeText(userSentence);
    const normOriginal = this.normalizeText(exercise.originalSentence);

    const isCorrect = isExactSequenceMatch || normUser === normOriginal;

    return {
      isCorrect,
      userChoice: userSentence,
      correctAnswer: exercise.originalSentence,
      feedback: isCorrect
        ? 'Chính xác! Bạn đã sắp xếp câu chuẩn.'
        : `Chưa chính xác. Câu hoàn chỉnh đúng là: "${exercise.originalSentence}".`,
    };
  }
}
