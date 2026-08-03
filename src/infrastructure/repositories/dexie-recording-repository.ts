import { RecordingRepository } from '@/domain/repositories/recording-repository';
import { Recording, CreateRecordingInput } from '@/domain/entities/recording';
import { WordoraDatabase } from '../database/wordora-db';
import { generateUUID } from '@/lib/uuid';
import { getCurrentISOString } from '@/lib/date';

export class DexieRecordingRepository implements RecordingRepository {
  constructor(private db: WordoraDatabase) {}

  async findById(id: string): Promise<Recording | null> {
    const rec = await this.db.recordings.get(id);
    return rec || null;
  }

  async findByItemId(itemId: string): Promise<Recording[]> {
    return await this.db.recordings.where('itemId').equals(itemId).toArray();
  }

  async create(input: CreateRecordingInput): Promise<Recording> {
    const newRecording: Recording = {
      id: input.id || generateUUID(),
      itemId: input.itemId,
      audioBlob: input.audioBlob,
      mimeType: input.mimeType,
      durationMs: input.durationMs,
      createdAt: input.createdAt || getCurrentISOString(),
    };

    await this.db.recordings.add(newRecording);
    return newRecording;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.db.recordings.get(id);
    if (!existing) return false;

    await this.db.recordings.delete(id);
    return true;
  }

  async deleteByItemId(itemId: string): Promise<number> {
    return await this.db.recordings.where('itemId').equals(itemId).delete();
  }

  async bulkUpsert(recordings: Recording[]): Promise<void> {
    await this.db.recordings.bulkPut(recordings);
  }

  async count(itemId?: string): Promise<number> {
    if (itemId) {
      return await this.db.recordings.where('itemId').equals(itemId).count();
    }
    return await this.db.recordings.count();
  }
}
