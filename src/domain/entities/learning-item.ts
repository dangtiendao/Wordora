import { LearningItemType } from '../value-objects/types';

/**
 * Thẻ / Mục học (LearningItem) - Đại diện cho một từ vựng, cụm từ hoặc câu cần học.
 *
 * @remarks
 * - **BUSINESS RULE**:
 *   - Thuộc duy nhất một `Deck` thông qua `deckId`.
 *   - `prompt`: Văn bản ngôn ngữ đích (ví dụ: "apple" hoặc "xin chào"). Giữ nguyên dấu thanh Unicode nguyên bản, không tự ý loại bỏ hay biến đổi ký tự đặc biệt.
 *   - `answer`: Nghĩa hoặc đáp án dịch sang ngôn ngữ nguồn.
 *   - `difficulty`: Mức độ khó tùy chỉnh của mục học (thang điểm nguyên từ 1 = Dễ đến 5 = Rất khó).
 * - **INVARIANT**:
 *   - `id` và `deckId` phải là chuỗi UUID v4 hợp lệ.
 *   - `createdAt` và `updatedAt` bắt buộc phải sử dụng định dạng ISO 8601 UTC.
 *   - `tags` luôn là mảng các từ khóa (nếu không có tag nào thì là mảng rỗng `[]`).
 * - **DATA INTEGRITY & CASCADE**:
 *   - Khi tạo mới một `LearningItem`, một bản ghi `ReviewState` tương ứng BẮT BUỘC phải được khởi tạo đồng thời trong cùng một atomic transaction.
 *   - Khi xóa `LearningItem`, các bản ghi `ReviewState`, `ReviewLog`, và `Recording` thuộc mục học này phải được xóa cascade triệt để.
 */
export interface LearningItem {
  id: string;
  deckId: string;
  type: LearningItemType;
  prompt: string;
  answer: string;
  phonetic?: string;
  example?: string;
  exampleTranslation?: string;
  note?: string;
  partOfSpeech?: string;
  difficulty?: number; // 1 (easy) to 5 (hard)
  tags: string[];
  createdAt: string; // ISO 8601 UTC
  updatedAt: string; // ISO 8601 UTC
}

/**
 * Payload dữ liệu đầu vào khi tạo mới một Mục học (LearningItem).
 *
 * @remarks
 * - `id` tùy chọn, nếu bỏ trống hệ thống sẽ tự phát sinh UUID v4.
 * - `tags` tùy chọn ở mức DTO, sẽ được gán giá trị mặc định mảng rỗng `[]` khi khởi tạo entity.
 */
export type CreateLearningItemInput = Omit<LearningItem, 'id' | 'createdAt' | 'updatedAt' | 'tags'> & {
  id?: string;
  tags?: string[];
};

/**
 * Payload dữ liệu đầu vào khi cập nhật thông tin Mục học (LearningItem).
 *
 * @remarks
 * - **CONTRACT**: Bắt buộc phải có `id` để định danh mục học. `createdAt` và `deckId` không thay đổi qua update DTO này.
 */
export type UpdateLearningItemInput = Partial<Omit<LearningItem, 'id' | 'createdAt'>> & {
  id: string;
};

