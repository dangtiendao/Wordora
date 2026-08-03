export interface Recording {
  id: string;
  itemId: string;
  audioBlob: Blob;
  mimeType: string;
  durationMs: number;
  createdAt: string; // ISO 8601 UTC
}

export type CreateRecordingInput = Omit<Recording, 'id' | 'createdAt'> & {
  id?: string;
  createdAt?: string;
};
