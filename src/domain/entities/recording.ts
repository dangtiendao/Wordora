/**
 * Bản ghi âm từ người dùng (Recording) - Lưu trữ tệp âm thanh ghi âm mẫu phát âm của mục học.
 *
 * @remarks
 * - **SERIALIZATION LIMITATION**:
 *   - Chứa trường `audioBlob` mang kiểu dữ liệu trình duyệt `Blob`. Entity này **KHÔNG HOÀN TOÀN JSON-SERIALIZABLE** thuần túy nếu không chuyển hóa thành ArrayBuffer hoặc Base64 trong quá trình backup/export.
 *   - Dexie.js hỗ trợ ghi/đọc trực tiếp `Blob` vào IndexedDB mà không cần serialize tay.
 * - **BUSINESS RULE & DATA INTEGRITY**:
 *   - Liên kết 1:N với `LearningItem` thông qua `itemId` (một thẻ học có thể có nhiều bản thu âm).
 *   - Khi xóa `LearningItem`, tất cả `Recording` tương ứng phải được dọn dẹp sạch để giải phóng dung lượng đĩa của browser.
 * - **INVARIANT**:
 *   - `id` và `itemId` phải là chuỗi UUID v4.
 *   - `createdAt` phải tuân theo chuỗi chuẩn ISO 8601 UTC.
 */
export interface Recording {
  id: string;
  itemId: string;
  audioBlob: Blob;
  mimeType: string;
  durationMs: number;
  createdAt: string; // ISO 8601 UTC
}

/**
 * Payload dữ liệu đầu vào khi lưu một bản ghi âm mới.
 *
 * @remarks
 * - `id` tùy chọn, tự động sinh UUID v4 nếu không cung cấp.
 * - `createdAt` tùy chọn, mặc định lấy thời điểm hiện tại định dạng ISO 8601 UTC.
 */
export type CreateRecordingInput = Omit<Recording, 'id' | 'createdAt'> & {
  id?: string;
  createdAt?: string;
};

