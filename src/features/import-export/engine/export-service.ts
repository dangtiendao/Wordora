import { RepositoryContainer } from '@/infrastructure/database/db-factory';
import { ExportEnvelope } from '../domain/import-export-types';
import { ExportEnvelopeSchema } from '../domain/import-export-schemas';
import { getCurrentISOString } from '@/lib/date';
import { Deck } from '@/domain/entities/deck';
import { LearningItem } from '@/domain/entities/learning-item';
import { ReviewState } from '@/domain/entities/review-state';
import { ReviewLog } from '@/domain/entities/review-log';
import { StudySession } from '@/domain/entities/study-session';

/**
 * Service ứng dụng thực hiện xuất dữ liệu sao lưu (Export Service).
 *
 * @remarks
 * - **EXPORT ENVELOPE FORMAT v1**:
 *   - Tạo đối tượng `ExportEnvelope` chứa thông tin định danh `app = 'wordora'`, `schemaVersion = 1` và mốc `exportedAt` UTC.
 *   - Thu thập toàn bộ bản ghi bộ học (bao gồm cả các bộ học bị lưu trữ `archivedAt !== null`), các mục học, trạng thái SRS, nhật ký ôn tập, phiên học và cấu hình.
 * - **AUDIO BLOB EXCLUSION POLICY**:
 *   - `recordings.included` bị cố định là `false`. Dữ liệu nhị phân âm thanh `Blob` KHÔNG được lưu trong tệp JSON xuất ra để đảm bảo tệp nhẹ và phòng chống tràn RAM khi parse/stringify.
 * - **SCHEMA VALIDATION PRIOR TO DOWNLOAD**:
 *   - Kiểm định đối tượng envelope qua `ExportEnvelopeSchema.safeParse(envelope)` trước khi tạo tệp tải xuống để bảo đảm tệp xuất ra luôn đạt chuẩn 100%.
 * - **CLEAN OBJECT URL DOWNLOAD**:
 *   - Tạo Blob URL tạm thời để phát lệnh tải xuống trên trình duyệt và gọi `URL.revokeObjectURL(url)` ngay lập tức sau đó.
 */
export class ExportService {
  constructor(private container: RepositoryContainer) {}

  /**
   * Sinh tên tệp sao lưu JSON chứa mốc thời gian UTC (ví dụ: `wordora-backup-2026-08-05-1200.json`).
   *
   * @param nowDate - Mốc thời gian xuất (mặc định `new Date()`).
   * @returns Chuỗi tên tệp sao lưu.
   */
  static generateFilename(nowDate: Date = new Date()): string {
    const y = nowDate.getUTCFullYear();
    const m = String(nowDate.getUTCMonth() + 1).padStart(2, '0');
    const d = String(nowDate.getUTCDate()).padStart(2, '0');
    const hh = String(nowDate.getUTCHours()).padStart(2, '0');
    const mm = String(nowDate.getUTCMinutes()).padStart(2, '0');
    return `wordora-backup-${y}-${m}-${d}-${hh}${mm}.json`;
  }

  /**
   * Truy vấn cơ sở dữ liệu và dựng đối tượng `ExportEnvelope` v1 hợp lệ.
   *
   * @returns Đối tượng `ExportEnvelope` đã qua kiểm định Zod Schema.
   */
  async createExportEnvelope(): Promise<ExportEnvelope> {
    const decks = await this.container.deckRepository.list(true); // Include archived
    const learningItems = await this.container.learningItemRepository.list();
    const reviewStates = await this.container.reviewStateRepository.list();
    const reviewLogs = await this.container.reviewLogRepository.list();
    const studySessions = await this.container.studySessionRepository.list();
    const settings = (await this.container.settingsRepository.get()) || {};

    const recordings = await this.container.db.recordings.toArray();

    const envelope: ExportEnvelope = {
      app: 'wordora',
      schemaVersion: 1,
      exportedAt: getCurrentISOString(),
      data: {
        decks: decks as Deck[],
        learningItems: learningItems as LearningItem[],
        reviewStates: reviewStates as ReviewState[],
        reviewLogs: reviewLogs as ReviewLog[],
        studySessions: studySessions as StudySession[],
        settings,
      },
      recordings: {
        included: false,
        count: recordings.length,
      },
    };

    // Validate envelope schema prior to export
    const parseResult = ExportEnvelopeSchema.safeParse(envelope);
    if (!parseResult.success) {
      throw new Error(`Lỗi cấu trúc dữ liệu xuất: ${parseResult.error.message}`);
    }

    return envelope;
  }

  /**
   * Thực hiện quá trình xuất dữ liệu và kích hoạt lệnh tải tệp JSON về trình duyệt.
   *
   * @param nowDate - Mốc thời gian thực hiện.
   * @returns Tên tệp đã tải về.
   */
  async exportAndDownload(nowDate: Date = new Date()): Promise<string> {
    const envelope = await this.createExportEnvelope();
    const jsonStr = JSON.stringify(envelope, null, 2);
    const filename = ExportService.generateFilename(nowDate);

    if (typeof window !== 'undefined') {
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    return filename;
  }
}

