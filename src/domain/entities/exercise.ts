import { LearningItem } from './learning-item';
import { ExerciseType } from '../value-objects/types';

/**
 * Cấu trúc cơ sở cho bài tập luyện tập được sinh ra trong bộ nhớ (Runtime Exercise Model).
 *
 * @remarks
 * - Bài tập được tạo động trong quá trình diễn ra phiên học (quiz/srsReview), không lưu trực tiếp entity bài tập xuống DB.
 * - `item`: Mục học `LearningItem` gốc làm căn cứ tạo câu hỏi.
 */
export interface BaseExercise {
  id: string;
  item: LearningItem;
  type: ExerciseType;
  prompt: string;
}

/**
 * Dạng bài tập Trắc nghiệm (Multiple Choice).
 *
 * @remarks
 * - **INVARIANT**: `options` chứa mảng các lựa chọn đáp án (đáp án đúng + các đáp án nhiễu). `correctIndex` là chỉ số vị trí đáp án đúng trong mảng `options` (`0 <= correctIndex < options.length`).
 */
export interface MultipleChoiceExercise extends BaseExercise {
  type: 'multipleChoice';
  options: string[];
  correctIndex: number;
}

/**
 * Dạng bài tập Điền từ còn thiếu vào ô trống (Fill in the blank).
 *
 * @remarks
 * - **BUSINESS RULE**:
 *   - `sentenceWithBlank`: Chuỗi câu mẫu trong đó từ cần điền được thay bằng ký tự đại diện (ví dụ: "___").
 *   - `acceptableAnswers`: Mảng các từ/cụm từ đồng nghĩa hoặc biến thể chấp nhận được ngoài `correctAnswer`.
 */
export interface FillBlankExercise extends BaseExercise {
  type: 'fillInBlank';
  sentenceWithBlank: string;
  correctAnswer: string;
  acceptableAnswers: string[];
}

/**
 * Token đại diện cho một từ hoặc dấu câu trong bài tập sắp xếp câu.
 *
 * @remarks
 * - **WHY UNIQUE ID**: Mỗi token phải có một `id` duy nhất (ví dụ UUID/nanoid) để phân biệt chính xác kể cả khi câu chứa các từ lặp lại giống hệt nhau (ví dụ câu "that that is...").
 */
export interface OrderToken {
  id: string; // Unique token ID (supports duplicate words in a sentence)
  text: string;
}

/**
 * Dạng bài tập Sắp xếp câu (Sentence Ordering).
 *
 * @remarks
 * - **INVARIANT**:
 *   - `tokens`: Mảng các `OrderToken` đã được xáo trộn ngẫu nhiên.
 *   - `correctTokenSequence`: Mảng lưu chuỗi ID của các token theo đúng thứ tự cú pháp của câu gốc.
 */
export interface SentenceOrderExercise extends BaseExercise {
  type: 'sentenceOrdering';
  originalSentence: string;
  tokens: OrderToken[]; // Shuffled tokens
  correctTokenSequence: string[]; // Ordered token IDs
}

/**
 * Discriminated Union đại diện cho tất cả các dạng bài tập thực hành trong ứng dụng.
 */
export type Exercise = MultipleChoiceExercise | FillBlankExercise | SentenceOrderExercise;

/**
 * Dữ liệu kết quả đánh giá đáp án ngay tức thì sau khi người dùng nộp câu trả lời.
 */
export interface AnswerEvaluation {
  isCorrect: boolean;
  userChoice: string;
  correctAnswer: string;
  feedback: string;
}

/**
 * Bản ghi kết quả thực hiện câu hỏi bài tập để thống kê và tính toán trong phiên làm bài.
 */
export interface ExerciseResult {
  exerciseId: string;
  itemId: string;
  type: ExerciseType;
  prompt: string;
  userResponse: string;
  correctAnswer: string;
  isCorrect: boolean;
  responseTimeMs: number;
}

