import { RepositoryContainer } from '@/infrastructure/database/db-factory';
import { ExportEnvelope } from '../domain/import-export-types';
import { ExportEnvelopeSchema } from '../domain/import-export-schemas';
import { getCurrentISOString } from '@/lib/date';
import { Deck } from '@/domain/entities/deck';
import { LearningItem } from '@/domain/entities/learning-item';
import { ReviewState } from '@/domain/entities/review-state';
import { ReviewLog } from '@/domain/entities/review-log';
import { StudySession } from '@/domain/entities/study-session';

export class ExportService {
  constructor(private container: RepositoryContainer) {}

  /**
   * Generates a timestamped filename for backup JSON file.
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
   * Creates a versioned ExportEnvelope v1 containing all database entities (excluding audio Blobs).
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
   * Triggers browser download of backup JSON file and cleans up Object URL.
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
