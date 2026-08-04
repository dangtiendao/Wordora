import { RepositoryContainer } from '@/infrastructure/database/db-factory';
import {
  ExportEnvelope,
  ImportPreview,
  ValidationResult,
  ImportOptions,
} from '../domain/import-export-types';
import {
  ExportEnvelopeSchema,
  MAX_IMPORT_FILE_SIZE_BYTES,
  sanitizeObject,
} from '../domain/import-export-schemas';
import { generateUUID } from '@/lib/uuid';
import { getCurrentISOString } from '@/lib/date';
import { Deck } from '@/domain/entities/deck';
import { LearningItem } from '@/domain/entities/learning-item';
import { ReviewState } from '@/domain/entities/review-state';
import { ReviewLog } from '@/domain/entities/review-log';
import { StudySession } from '@/domain/entities/study-session';

export class FileReaderAdapter {
  static async readTextFile(file: File): Promise<string> {
    if (file.size > MAX_IMPORT_FILE_SIZE_BYTES) {
      throw new Error(`Dung lượng tệp vượt quá giới hạn tối đa (tối đa 20 MB).`);
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Lỗi khi đọc tệp từ thiết bị.'));
      reader.readAsText(file, 'UTF-8');
    });
  }
}

export class ImportValidator {
  static validateJson(jsonText: string): ValidationResult {
    let rawObj: unknown;
    try {
      rawObj = JSON.parse(jsonText);
    } catch {
      return {
        isValid: false,
        errors: [{ path: 'root', message: 'Tệp không phải là định dạng JSON hợp lệ.' }],
      };
    }

    // Prototype pollution protection
    const cleanObj = sanitizeObject(rawObj);

    const parseResult = ExportEnvelopeSchema.safeParse(cleanObj);
    if (!parseResult.success) {
      const errors = parseResult.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));
      return {
        isValid: false,
        errors,
      };
    }

    const envelope = parseResult.data as unknown as ExportEnvelope;
    return {
      isValid: true,
      schemaVersion: envelope.schemaVersion,
      exportedAt: envelope.exportedAt,
      errors: [],
      envelope,
    };
  }
}

export class ImportPipeline {
  constructor(private container: RepositoryContainer) {}

  /**
   * Generates a preview dry-run summary of the import envelope.
   */
  generatePreview(envelope: ExportEnvelope): ImportPreview {
    const validationResult = ImportValidator.validateJson(JSON.stringify(envelope));

    return {
      deckCount: envelope.data.decks.length,
      learningItemCount: envelope.data.learningItems.length,
      reviewStateCount: envelope.data.reviewStates.length,
      reviewLogCount: envelope.data.reviewLogs.length,
      studySessionCount: envelope.data.studySessions.length,
      hasSettings: Boolean(envelope.data.settings && Object.keys(envelope.data.settings).length > 0),
      schemaVersion: envelope.schemaVersion,
      exportedAt: envelope.exportedAt,
      recordingsCount: envelope.recordings.count,
      validationResult,
    };
  }

  /**
   * Executes atomic restore inside a Dexie multi-table transaction with automatic backup-before-restore.
   */
  async executeRestore(envelope: ExportEnvelope, options?: ImportOptions): Promise<void> {
    const strategy = options?.conflictStrategy || 'overwrite';
    const db = this.container.db;

    // 1. Verify schema validity
    const validation = ImportValidator.validateJson(JSON.stringify(envelope));
    if (!validation.isValid || !validation.envelope) {
      throw new Error(`Tệp sao lưu không hợp lệ: ${validation.errors[0]?.message || 'Lỗi kiểm định'}`);
    }

    // 2. Perform Automatic Backup-Before-Restore snapshot
    const backupSnapshot = {
      decks: await db.decks.toArray(),
      learningItems: await db.learningItems.toArray(),
      reviewStates: await db.reviewStates.toArray(),
      reviewLogs: await db.reviewLogs.toArray(),
      studySessions: await db.studySessions.toArray(),
      settings: await db.settings.toArray(),
    };

    try {
      // 3. Multi-Table Atomic Dexie Transaction
      await db.transaction(
        'rw',
        [db.decks, db.learningItems, db.reviewStates, db.reviewLogs, db.studySessions, db.settings],
        async () => {
          if (strategy === 'overwrite') {
            // Clear existing non-recording data
            await db.decks.clear();
            await db.learningItems.clear();
            await db.reviewStates.clear();
            await db.reviewLogs.clear();
            await db.studySessions.clear();

            // Bulk add restored data
            if (envelope.data.decks.length > 0) {
              await db.decks.bulkAdd(envelope.data.decks as Deck[]);
            }
            if (envelope.data.learningItems.length > 0) {
              await db.learningItems.bulkAdd(envelope.data.learningItems as LearningItem[]);
            }
            if (envelope.data.reviewStates.length > 0) {
              await db.reviewStates.bulkAdd(envelope.data.reviewStates as ReviewState[]);
            }
            if (envelope.data.reviewLogs.length > 0) {
              await db.reviewLogs.bulkAdd(envelope.data.reviewLogs as ReviewLog[]);
            }
            if (envelope.data.studySessions.length > 0) {
              await db.studySessions.bulkAdd(envelope.data.studySessions as StudySession[]);
            }

            if (options?.restoreSettings && envelope.data.settings) {
              const currentSettings = await db.settings.get('default');
              if (currentSettings) {
                await db.settings.put({
                  ...currentSettings,
                  ...envelope.data.settings,
                  updatedAt: getCurrentISOString(),
                });
              }
            }
          } else if (strategy === 'duplicate') {
            // Remap IDs for decks, items, review states, logs, sessions
            const deckIdMap = new Map<string, string>();
            const itemIdMap = new Map<string, string>();

            const newDecks = envelope.data.decks.map((deck) => {
              const newId = generateUUID();
              deckIdMap.set(deck.id, newId);
              return {
                ...deck,
                id: newId,
                name: `${deck.name} (Bản sao)`,
              };
            });

            const newItems = envelope.data.learningItems.map((item) => {
              const newId = generateUUID();
              itemIdMap.set(item.id, newId);
              return {
                ...item,
                id: newId,
                deckId: deckIdMap.get(item.deckId) || item.deckId,
              };
            });

            const newStates = envelope.data.reviewStates.map((state) => ({
              ...state,
              id: generateUUID(),
              itemId: itemIdMap.get(state.itemId) || state.itemId,
            }));

            const newLogs = envelope.data.reviewLogs.map((log) => ({
              ...log,
              id: generateUUID(),
              itemId: itemIdMap.get(log.itemId) || log.itemId,
            }));

            const newSessions = envelope.data.studySessions.map((session) => ({
              ...session,
              id: generateUUID(),
              deckId: deckIdMap.get(session.deckId) || session.deckId,
            }));

            if (newDecks.length > 0) await db.decks.bulkAdd(newDecks as Deck[]);
            if (newItems.length > 0) await db.learningItems.bulkAdd(newItems as LearningItem[]);
            if (newStates.length > 0) await db.reviewStates.bulkAdd(newStates as ReviewState[]);
            if (newLogs.length > 0) await db.reviewLogs.bulkAdd(newLogs as ReviewLog[]);
            if (newSessions.length > 0) await db.studySessions.bulkAdd(newSessions as StudySession[]);
          }
        }
      );
    } catch (err) {
      // Automatic Rollback Recovery: Restore pre-transaction snapshot if Dexie transaction fails
      try {
        await db.transaction(
          'rw',
          [db.decks, db.learningItems, db.reviewStates, db.reviewLogs, db.studySessions, db.settings],
          async () => {
            await db.decks.clear();
            await db.learningItems.clear();
            await db.reviewStates.clear();
            await db.reviewLogs.clear();
            await db.studySessions.clear();

            if (backupSnapshot.decks.length > 0) await db.decks.bulkAdd(backupSnapshot.decks);
            if (backupSnapshot.learningItems.length > 0) await db.learningItems.bulkAdd(backupSnapshot.learningItems);
            if (backupSnapshot.reviewStates.length > 0) await db.reviewStates.bulkAdd(backupSnapshot.reviewStates);
            if (backupSnapshot.reviewLogs.length > 0) await db.reviewLogs.bulkAdd(backupSnapshot.reviewLogs);
            if (backupSnapshot.studySessions.length > 0) await db.studySessions.bulkAdd(backupSnapshot.studySessions);
          }
        );
      } catch {
        // Rollback attempt log
      }

      throw new Error(`Khôi phục dữ liệu thất bại. Đã hoàn tác toàn bộ thao tác: ${err instanceof Error ? err.message : 'Lỗi hệ thống'}`);
    }
  }
}
