import {
  MultipleChoiceExercise,
  FillBlankExercise,
  SentenceOrderExercise,
  AnswerEvaluation,
} from '@/domain/entities/exercise';

/**
 * Tùy chọn cấu hình kiểm tra câu trả lời dạng điền từ.
 */
export interface FillBlankEvaluationOptions {
  caseSensitive?: boolean;
  ignorePunctuation?: boolean;
}

/**
 * Bộ chấm điểm và đánh giá kết quả câu trả lời cho các dạng bài tập (Answer Evaluator Engine).
 */
export class AnswerEvaluator {
  /**
   * Chuẩn hóa chuỗi văn bản phục vụ so sánh đáp án (Text Normalizer).
   *
   * @remarks
   * - **UNICODE PRESERVATION**:
   *   - Sử dụng `text.normalize('NFC')` để đưa văn bản về dạng chuẩn Canonical Composition.
   *   - **TUYỆT ĐỐI KHÔNG TỰ BỎ DẤU**: Giữ nguyên toàn bộ dấu thanh tiếng Việt (ví dụ "táo", "phở") và các ký tự có dấu ngôn ngữ khác.
   * - **CASE & PUNCTUATION SENSITIVITY**:
   *   - Chuyển thành chữ thường trừ khi `options.caseSensitive === true`.
   *   - Loại bỏ dấu câu `/[.,/#!$%^&*;:{}=\-_`~()?'""]/g` nếu `options.ignorePunctuation === true`.
   * - **WHITESPACE COLLAPSING**: Thu gọn nhiều khoảng trắng thừa liền kề `/\s+/g` thành 1 khoảng trắng duy nhất và trim 2 đầu.
   *
   * @param text - Chuỗi văn bản nhập vào.
   * @param options - Tùy chọn phân biệt hoa/thường và dấu câu.
   * @returns Chuỗi văn bản đã qua chuẩn hóa.
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
   * Chấm điểm bài tập Trắc nghiệm (Multiple Choice).
   *
   * @param exercise - Đối tượng bài tập trắc nghiệm.
   * @param selectedIndex - Chỉ số phương án người dùng đã chọn.
   * @returns Kết quả `AnswerEvaluation` chứa trạng thái đúng/sai và lời phản hồi.
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
   * Chấm điểm bài tập Điền từ còn thiếu (Fill-in-the-Blank).
   *
   * @param exercise - Đối tượng bài tập điền từ.
   * @param userInput - Chuỗi đáp án do người dùng gõ vào.
   * @param options - Tùy chọn cấu hình chuẩn hóa chuỗi.
   * @returns Kết quả `AnswerEvaluation`.
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
   * Chấm điểm bài tập Sắp xếp câu (Sentence Order).
   *
   * @remarks
   * - **DUAL EVALUATION**:
   *   1. So sánh trực tiếp chuỗi mảng ID token (`isExactSequenceMatch`).
   *   2. Nếu thứ tự ID token khác nhưng các từ ghép thành chuỗi văn bản chuẩn hóa giống hệt câu gốc (`normUser === normOriginal`), vẫn công nhận kết quả đúng (hỗ trợ trường hợp câu có các từ trùng lặp nhau như "that that").
   *
   * @param exercise - Đối tượng bài tập sắp xếp câu.
   * @param selectedTokenIds - Mảng ID các token theo thứ tự người dùng xếp.
   * @returns Kết quả `AnswerEvaluation`.
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

