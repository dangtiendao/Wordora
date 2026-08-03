import { Recording, CreateRecordingInput } from '../entities/recording';

export interface RecordingRepository {
  findById(id: string): Promise<Recording | null>;
  findByItemId(itemId: string): Promise<Recording[]>;
  create(input: CreateRecordingInput): Promise<Recording>;
  delete(id: string): Promise<boolean>;
  deleteByItemId(itemId: string): Promise<number>;
  bulkUpsert(recordings: Recording[]): Promise<void>;
  count(itemId?: string): Promise<number>;
}
