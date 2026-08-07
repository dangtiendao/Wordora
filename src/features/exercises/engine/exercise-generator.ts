import { LearningItem } from '@/domain/entities/learning-item';
import {
  MultipleChoiceExercise,
  FillBlankExercise,
  SentenceOrderExercise,
  OrderToken,
} from '@/domain/entities/exercise';
import { generateUUID } from '@/lib/uuid';

/**
 * Trình sinh động các dạng bài tập thực hành trong bộ nhớ (Exercise Generator Engine).
 */
export class ExerciseGenerator {
  /**
   * Sinh bài tập Trắc nghiệm chọn 1 đáp án đúng từ danh sách các lựa chọn (Multiple Choice Exercise).
   *
   * @remarks
   * - **DISTRACTOR SELECTION & DUPLICATE ELIMINATION**:
   *   - Loại bỏ chính mục học gốc (`c.id !== item.id`) và các mục có đáp án trùng với đáp án đúng (không phân biệt hoa/thường).
   *   - Ưu tiên chọn các ứng viên nhiễu có cùng kiểu (`type`, cộng 2 điểm) và cùng từ loại (`partOfSpeech`, cộng 1 điểm).
   *   - Đảm bảo loại bỏ các đáp án nhiễu bị trùng lặp nội dung bằng `Set<string>` (loại trừ cả trường hợp trùng khác hoa/thường).
   *   - Lấy tối đa 3 đáp án nhiễu. Yêu cầu bắt buộc phải có ít nhất 1 đáp án nhiễu; nếu không đủ ứng viên nhiễu sẽ trả về `null`.
   * - **EXACT CORRECT ANSWER INCLUSION**: Đáp án đúng được cam kết xuất hiện chính xác 1 lần trong mảng `options`, sau đó xáo trộn ngẫu nhiên bằng thuật toán Fisher-Yates (hỗ trợ `randomizer` đính kèm).
   *
   * @param item - Thẻ học làm căn cứ tạo câu hỏi.
   * @param candidatePool - Tập hợp các thẻ học ứng viên dùng để tạo các đáp án nhiễu.
   * @param randomizer - Hàm sinh số ngẫu nhiên (mặc định `Math.random`, hỗ trợ đè cho unit test).
   * @returns Đối tượng `MultipleChoiceExercise` hoặc `null` nếu không đủ điều kiện.
   */
  static generateMultipleChoice(
    item: LearningItem,
    candidatePool: LearningItem[],
    randomizer: () => number = Math.random
  ): MultipleChoiceExercise | null {
    const correctAnswer = item.answer.trim();
    if (!correctAnswer) return null;

    // Filter potential distractors from candidate pool
    const candidates = candidatePool.filter(
      (c) =>
        c.id !== item.id &&
        c.answer.trim().length > 0 &&
        c.answer.trim().toLowerCase() !== correctAnswer.toLowerCase()
    );

    // Prioritize candidates matching item type & partOfSpeech
    candidates.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;
      if (a.type === item.type) scoreA += 2;
      if (b.type === item.type) scoreB += 2;
      if (a.partOfSpeech && a.partOfSpeech === item.partOfSpeech) scoreA += 1;
      if (b.partOfSpeech && b.partOfSpeech === item.partOfSpeech) scoreB += 1;
      return scoreB - scoreA;
    });

    // Select up to 3 unique distractor texts
    const distractors: string[] = [];
    const usedTexts = new Set<string>([correctAnswer.toLowerCase()]);

    for (const cand of candidates) {
      const text = cand.answer.trim();
      const lower = text.toLowerCase();
      if (!usedTexts.has(lower)) {
        usedTexts.add(lower);
        distractors.push(text);
        if (distractors.length >= 3) break;
      }
    }

    // Require at least 1 distractor for a valid multiple choice
    if (distractors.length === 0) return null;

    const allOptions = [correctAnswer, ...distractors];

    // Fisher-Yates Shuffle
    for (let i = allOptions.length - 1; i > 0; i--) {
      const j = Math.floor(randomizer() * (i + 1));
      [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
    }

    const correctIndex = allOptions.indexOf(correctAnswer);

    return {
      id: generateUUID(),
      item,
      type: 'multipleChoice',
      prompt: `Nghĩa của từ / cụm từ "${item.prompt}" là gì?`,
      options: allOptions,
      correctIndex,
    };
  }

  /**
   * Sinh bài tập Điền từ còn thiếu vào chỗ trống (Fill-in-the-Blank Exercise).
   *
   * @remarks
   * - Nếu `item.example` chứa từ/cụm từ cần học (`item.prompt`), hàm sẽ thay thế từ đó bằng ký tự đại diện `___`.
   * - Ngược lại, sinh câu lệnh yêu cầu điền từ tương ứng với nghĩa tiếng Việt.
   */
  static generateFillBlank(item: LearningItem): FillBlankExercise | null {
    const targetWord = item.prompt.trim();
    if (!targetWord) return null;

    let sentenceWithBlank = '';
    const sampleText = item.example?.trim() || '';

    // If an example sentence contains the prompt word, replace it with blank ___
    if (sampleText && sampleText.toLowerCase().includes(targetWord.toLowerCase())) {
      const regex = new RegExp(targetWord, 'gi');
      sentenceWithBlank = sampleText.replace(regex, '___');
    } else {
      sentenceWithBlank = `Điền từ thích hợp vào chỗ trống để dịch: "${item.answer}" ➔ ___`;
    }

    return {
      id: generateUUID(),
      item,
      type: 'fillInBlank',
      prompt: 'Điền từ / cụm từ còn thiếu:',
      sentenceWithBlank,
      correctAnswer: targetWord,
      acceptableAnswers: [targetWord],
    };
  }

  /**
   * Sinh bài tập Sắp xếp câu (Sentence Ordering Exercise).
   *
   * @remarks
   * - **TOKENIZER & UNIQUE TOKEN IDS**:
   *   - Phân tách chuỗi câu thành mảng các từ dựa trên ranh giới khoảng trắng `/\s+/`.
   *   - Yêu cầu câu phải có tối thiểu **2 từ**.
   *   - Mỗi từ được gán một `id` token duy nhất (`token-${idx}-${UUID}`) để phân biệt chính xác các từ trùng lặp nhau trong cùng 1 câu.
   *   - Mảng token được xáo trộn ngẫu nhiên trước khi gửi lên UI.
   * - **LIMITATION**: Quy tắc tách từ bằng khoảng trắng phù hợp với tiếng Anh và hầu hết ngôn ngữ viết cách từ; chưa hỗ trợ tách từ chuyên sâu cho ngôn ngữ không dùng khoảng trắng (như tiếng Nhật/Trung không cách từ).
   */
  static generateSentenceOrder(
    item: LearningItem,
    randomizer: () => number = Math.random
  ): SentenceOrderExercise | null {
    // Sentence order works best on sentences or multi-word phrases
    const sourceText = (item.example || item.prompt).trim();
    if (!sourceText || sourceText.split(/\s+/).length < 2) {
      return null;
    }

    // Smart Tokenizer: splits words while handling basic space boundaries
    const rawTokens = sourceText.split(/\s+/).filter((t) => t.length > 0);
    if (rawTokens.length < 2) return null;

    const correctTokenSequence: string[] = [];
    const tokens: OrderToken[] = rawTokens.map((text, idx) => {
      const id = `token-${idx}-${generateUUID().slice(0, 4)}`;
      correctTokenSequence.push(id);
      return { id, text };
    });

    // Shuffled copy of tokens
    const shuffledTokens = [...tokens];
    for (let i = shuffledTokens.length - 1; i > 0; i--) {
      const j = Math.floor(randomizer() * (i + 1));
      [shuffledTokens[i], shuffledTokens[j]] = [shuffledTokens[j], shuffledTokens[i]];
    }

    return {
      id: generateUUID(),
      item,
      type: 'sentenceOrdering',
      prompt: `Sắp xếp các từ thành câu đúng (Nghĩa: "${item.exampleTranslation || item.answer}"):`,
      originalSentence: sourceText,
      tokens: shuffledTokens,
      correctTokenSequence,
    };
  }
}

