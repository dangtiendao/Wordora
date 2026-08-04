import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ExportService } from './engine/export-service';
import { FileReaderAdapter, ImportValidator, ImportPipeline } from './engine/import-pipeline';
import { ExportEnvelopeSchema, sanitizeObject, MAX_IMPORT_FILE_SIZE_BYTES } from './domain/import-export-schemas';
import { getRepositoryContainer, RepositoryContainer } from '@/infrastructure/database/db-factory';
import { WordoraDatabase } from '@/infrastructure/database/wordora-db';

describe('Import & Export Engine Tests', () => {
  let db: WordoraDatabase;
  let container: RepositoryContainer;
  const fixedNow = new Date('2026-08-01T12:00:00Z');

  beforeEach(() => {
    db = new WordoraDatabase(`test_io_db_${Date.now()}_${Math.random()}`);
    container = getRepositoryContainer(db);
  });

  afterEach(async () => {
    if (db) {
      await db.delete();
    }
  });

  it('generates valid timestamped filename', () => {
    const filename = ExportService.generateFilename(fixedNow);
    expect(filename).toBe('wordora-backup-2026-08-01-1200.json');
  });

  it('creates valid ExportEnvelope v1 for empty database', async () => {
    const service = new ExportService(container);
    const envelope = await service.createExportEnvelope();

    expect(envelope.app).toBe('wordora');
    expect(envelope.schemaVersion).toBe(1);
    expect(envelope.recordings.included).toBe(false);
    expect(envelope.data.decks.length).toBe(0);
    expect(envelope.data.learningItems.length).toBe(0);

    const validation = ExportEnvelopeSchema.safeParse(envelope);
    expect(validation.success).toBe(true);
  });

  it('sanitizes prototype pollution payloads correctly', () => {
    const pollutedPayload = JSON.parse(
      '{"app":"wordora","schemaVersion":1,"__proto__":{"polluted":true},"data":{"decks":[]}}'
    );

    const clean = sanitizeObject(pollutedPayload);
    expect(Object.prototype.hasOwnProperty.call(clean, '__proto__')).toBe(false);
    expect((clean as Record<string, unknown>).polluted).toBeUndefined();
  });

  it('rejects invalid JSON text, wrong app name, or unsupported schemaVersion', () => {
    // Invalid JSON
    const res1 = ImportValidator.validateJson('invalid json text');
    expect(res1.isValid).toBe(false);
    expect(res1.errors[0].message).toContain('JSON');

    // Wrong app name
    const wrongAppJson = JSON.stringify({
      app: 'other_app',
      schemaVersion: 1,
      exportedAt: '2026-08-01T00:00:00Z',
      data: { decks: [], learningItems: [], reviewStates: [], reviewLogs: [], studySessions: [], settings: {} },
      recordings: { included: false, count: 0 },
    });
    const res2 = ImportValidator.validateJson(wrongAppJson);
    expect(res2.isValid).toBe(false);

    // Unsupported schemaVersion
    const wrongVersionJson = JSON.stringify({
      app: 'wordora',
      schemaVersion: 99,
      exportedAt: '2026-08-01T00:00:00Z',
      data: { decks: [], learningItems: [], reviewStates: [], reviewLogs: [], studySessions: [], settings: {} },
      recordings: { included: false, count: 0 },
    });
    const res3 = ImportValidator.validateJson(wrongVersionJson);
    expect(res3.isValid).toBe(false);
  });

  it('FileReaderAdapter rejects oversized files exceeding MAX_IMPORT_FILE_SIZE_BYTES', async () => {
    const bigFile = new File(['a'.repeat(100)], 'big.json');
    Object.defineProperty(bigFile, 'size', { value: MAX_IMPORT_FILE_SIZE_BYTES + 1 });

    await expect(FileReaderAdapter.readTextFile(bigFile)).rejects.toThrow(/Dung lượng tệp vượt quá giới hạn/i);
  });

  it('performs full atomic restore and duplicate strategy correctly', async () => {
    const deck = await container.deckRepository.create({
      name: 'Original Deck',
      sourceLanguage: 'en',
      targetLanguage: 'vi',
    });

    await container.learningItemRepository.create({
      deckId: deck.id,
      type: 'vocabulary',
      prompt: 'hello',
      answer: 'xin chào',
    });

    const exportService = new ExportService(container);
    const envelope = await exportService.createExportEnvelope();

    const pipeline = new ImportPipeline(container);

    // Duplicate restore
    await pipeline.executeRestore(envelope, { conflictStrategy: 'duplicate' });

    const allDecks = await container.deckRepository.list(true);
    expect(allDecks.length).toBe(2);
    expect(allDecks.some((d) => d.name.includes('(Bản sao)'))).toBe(true);

    // Overwrite restore
    await pipeline.executeRestore(envelope, { conflictStrategy: 'overwrite' });
    const overwrittenDecks = await container.deckRepository.list(true);
    expect(overwrittenDecks.length).toBe(1);
  });
});
