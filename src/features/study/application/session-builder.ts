import { LearningItem } from '@/domain/entities/learning-item';

/**
 * Phân loại thứ tự sắp xếp thẻ học trong phiên.
 */
export type SessionOrder = 'sequential' | 'random';

/**
 * Chế độ lọc danh sách mục học cho phiên.
 */
export type SessionFilterMode = 'all' | 'new_only';

/**
 * Tùy chọn cấu hình cho Session Builder.
 */
export interface SessionBuilderConfig {
  deckId: string;
  cardLimit?: number; // 0 or undefined means all
  order?: SessionOrder;
  filterMode?: SessionFilterMode;
  randomizer?: () => number; // Injectable randomizer for deterministic testing
}

/**
 * Hàm thuần túy xây dựng danh sách các mục học cho một Phiên học (Study Session Items Builder).
 *
 * @remarks
 * - **IMMUTABILITY**: Tạo bản sao mảng (`[...filtered]`) trước khi sắp xếp/xáo trộn, tuyệt đối không gây side effect hay biến đổi mảng `items` nguồn.
 * - **DETERMINISTIC TESTING VIA INJECTABLE RANDOMIZER**:
 *   - Khi `order === 'random'`, áp dụng thuật toán xáo trộn Fisher-Yates (Fisher-Yates Shuffle).
 *   - Cho phép truyền hàm `randomizer: () => number` từ bên ngoài (thay vì dùng trực tiếp `Math.random`) giúp quá trình xáo trộn thẻ có tính deterministic chuẩn xác khi chạy unit test.
 * - **CARD LIMIT**: Giới hạn số lượng thẻ tối đa thông qua `cardLimit`.
 *
 * @param items - Danh sách tất cả các mục học khả thi.
 * @param config - Cấu hình lựa chọn cho phiên học.
 * @returns Mảng danh sách thẻ học đã qua xử lý lọc, xáo trộn và cắt giới hạn.
 */
export function buildStudySessionItems(
  items: LearningItem[],
  config: SessionBuilderConfig
): LearningItem[] {
  // Filter items belonging to the target deck
  let filtered = items.filter((item) => item.deckId === config.deckId);

  // Filter mode (for future SRS status filtering, currently filters all or by difficulty/new)
  if (config.filterMode === 'new_only') {
    // Treat difficulty >= 3 or items created within last 7 days as new/priority items
    filtered = filtered.filter((item) => (item.difficulty ?? 3) >= 3);
  }

  // Immutable copy for ordering
  const result = [...filtered];

  if (config.order === 'random') {
    const random = config.randomizer || Math.random;
    // Fisher-Yates shuffle algorithm
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
  }

  // Apply card limit
  if (config.cardLimit && config.cardLimit > 0 && config.cardLimit < result.length) {
    return result.slice(0, config.cardLimit);
  }

  return result;
}

