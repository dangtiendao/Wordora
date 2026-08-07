/**
 * Đại diện cho một Bộ học (Deck) - Đơn vị tổng hợp gom nhóm các mục học từ vựng, cụm từ hoặc câu.
 *
 * @remarks
 * - **BUSINESS RULE**:
 *   - `sourceLanguage` và `targetLanguage` là mã ngôn ngữ (ví dụ: 'en', 'vi', 'ja').
 *   - Hỗ trợ ẩn/lưu trữ (Soft Delete / Archive): Khi `archivedAt` chứa mốc thời gian UTC, bộ học bị ẩn khỏi danh sách ôn tập nhưng dữ liệu vẫn được bảo toàn.
 * - **INVARIANT**:
 *   - `id` bắt buộc phải là chuỗi UUID v4 hợp lệ.
 *   - Các dấu mốc thời gian `createdAt`, `updatedAt`, `archivedAt` bắt buộc phải theo chuẩn ISO 8601 UTC.
 * - **DATA INTEGRITY & CASCADE**:
 *   - Khi thực hiện Hard Delete một Deck khỏi cơ sở dữ liệu, tất cả `LearningItem`, `ReviewState`, `ReviewLog`, `Recording`, và `StudySession` liên quan phải được xóa sạch (Cascade Delete) để tránh rác dữ liệu mồ côi (orphaned data).
 */
export interface Deck {
  id: string;
  name: string;
  description: string;
  sourceLanguage: string;
  targetLanguage: string;
  color: string;
  icon: string;
  createdAt: string; // ISO 8601 UTC
  updatedAt: string; // ISO 8601 UTC
  archivedAt?: string | null; // ISO 8601 UTC if archived
}

/**
 * Payload dữ liệu đầu vào khi tạo mới một Bộ học (Deck).
 *
 * @remarks
 * - `id` là thuộc tính tùy chọn; nếu bỏ trống, hệ thống lưu trữ sẽ khởi tạo UUID v4 ngẫu nhiên.
 * - Trường `description`, `color`, `icon` nếu không cung cấp sẽ nhận giá trị mặc định từ Zod Schema.
 */
export type CreateDeckInput = Omit<Deck, 'id' | 'createdAt' | 'updatedAt' | 'archivedAt' | 'color' | 'icon' | 'description'> & {
  id?: string;
  description?: string;
  color?: string;
  icon?: string;
  archivedAt?: string | null;
};

/**
 * Payload dữ liệu đầu vào khi cập nhật một Bộ học (Deck) hiện có.
 *
 * @remarks
 * - **CONTRACT**: Yêu cầu bắt buộc cung cấp `id` chính xác của Deck cần cập nhật. `createdAt` không thể bị chỉnh sửa.
 */
export type UpdateDeckInput = Partial<Omit<Deck, 'id' | 'createdAt'>> & {
  id: string;
};

