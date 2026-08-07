import { StudySession, CreateStudySessionInput, UpdateStudySessionInput } from '../entities/study-session';
import { SessionMode } from '../value-objects/types';

/**
 * Tiêu chí lọc danh sách Phiên học (StudySession).
 */
export interface StudySessionFilterOptions {
  deckId?: string;
  mode?: SessionMode;
}

/**
 * Hợp đồng Repository quản lý dữ liệu Phiên học (StudySession).
 *
 * @remarks
 * - **CONTRACT & BUSINESS RULES**:
 *   - `create(input)`: Ghi nhận bắt đầu một phiên học mới.
 *   - `update(input)`: Cập nhật chỉ số câu đúng, tổng câu hỏi và mốc thời gian `completedAt` khi hoàn thành phiên.
 *   - `bulkUpsert(sessions)`: Đảm bảo idempotency khi đồng bộ / khôi phục dữ liệu phiên học.
 */
export interface StudySessionRepository {
  findById(id: string): Promise<StudySession | null>;
  list(filter?: StudySessionFilterOptions): Promise<StudySession[]>;
  create(input: CreateStudySessionInput): Promise<StudySession>;
  update(input: UpdateStudySessionInput): Promise<StudySession>;
  delete(id: string): Promise<boolean>;
  bulkCreate(inputs: CreateStudySessionInput[]): Promise<StudySession[]>;
  bulkUpsert(sessions: StudySession[]): Promise<void>;
  count(filter?: StudySessionFilterOptions): Promise<number>;
}

