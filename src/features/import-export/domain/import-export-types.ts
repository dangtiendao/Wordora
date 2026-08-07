import { Deck } from '@/domain/entities/deck';
import { LearningItem } from '@/domain/entities/learning-item';
import { ReviewState } from '@/domain/entities/review-state';
import { ReviewLog } from '@/domain/entities/review-log';
import { StudySession } from '@/domain/entities/study-session';
import { AppSettings } from '@/domain/entities/app-settings';

/**
 * Metadata mô tả tình trạng các bản ghi âm giọng đọc trong tệp sao lưu.
 *
 * @remarks
 * - `included`: Bị cố định là `false`. Dữ liệu âm thanh nhị phân Blob KHÔNG được xuất kèm trong tệp JSON để tránh làm phình dung lượng và gây tràn bộ nhớ trình duyệt khi parse.
 */
export interface RecordingsMetadata {
  included: false;
  count: number;
}

/**
 * Payload chứa danh sách toàn bộ các thực thể dữ liệu trong bản sao lưu.
 */
export interface ExportDataPayload {
  decks: Deck[];
  learningItems: LearningItem[];
  reviewStates: ReviewState[];
  reviewLogs: ReviewLog[];
  studySessions: StudySession[];
  settings: Partial<AppSettings>;
}

/**
 * Khung vỏ bao bọc tệp sao lưu dữ liệu xuất ra JSON (Export Envelope v1).
 *
 * @remarks
 * - `app`: Mã định danh ứng dụng cố định `'wordora'`.
 * - `schemaVersion`: Phiên bản cấu trúc dữ liệu cố định `1`.
 * - `exportedAt`: Mốc thời gian xuất tệp định dạng chuẩn ISO 8601 UTC.
 * - `data`: Chứa toàn bộ bộ học, thẻ học, trạng thái SRS, nhật ký ôn tập, phiên học và cấu hình.
 * - `recordings`: Metadata ghi nhận số bản ghi âm (nhưng `included: false`).
 */
export interface ExportEnvelope {
  app: 'wordora';
  schemaVersion: 1;
  exportedAt: string; // ISO 8601 UTC
  data: ExportDataPayload;
  recordings: RecordingsMetadata;
}

/**
 * Chiến lược giải quyết xung đột khi khôi phục dữ liệu:
 * - `'skip'`: Bỏ qua các thực thể trùng lặp.
 * - `'overwrite'`: Xóa sạch dữ liệu cũ và ghi đè dữ liệu mới từ tệp sao lưu.
 * - `'duplicate'`: Sinh lại ID mới cho toàn bộ các thực thể để nhập thêm song song mà không đè dữ liệu cũ.
 */
export type ConflictStrategy = 'skip' | 'overwrite' | 'duplicate';

/**
 * Chi tiết một lỗi kiểm định cấu trúc JSON sao lưu.
 */
export interface ValidationErrorDetail {
  path: string;
  message: string;
}

/**
 * Kết quả kiểm định tính hợp lệ của tệp sao lưu JSON.
 */
export interface ValidationResult {
  isValid: boolean;
  schemaVersion?: number;
  exportedAt?: string;
  errors: ValidationErrorDetail[];
  envelope?: ExportEnvelope;
}

/**
 * Báo cáo xem trước dữ liệu trước khi thực hiện khôi phục (Import Preview Dry-Run Summary).
 *
 * @remarks
 * - Đầy đủ thống kê số lượng từng loại thực thể mà KHÔNG gây bất kỳ side effect hay biến đổi cơ sở dữ liệu.
 */
export interface ImportPreview {
  deckCount: number;
  learningItemCount: number;
  reviewStateCount: number;
  reviewLogCount: number;
  studySessionCount: number;
  hasSettings: boolean;
  schemaVersion: number;
  exportedAt: string;
  recordingsCount: number;
  validationResult: ValidationResult;
}

/**
 * Tùy chọn cấu hình quy trình khôi phục dữ liệu.
 */
export interface ImportOptions {
  conflictStrategy?: ConflictStrategy;
  restoreSettings?: boolean;
}

