export type RecordingState = 'idle' | 'recording' | 'paused' | 'error';

export interface RecordingResult {
  blob: Blob;
  mimeType: string;
  durationSeconds: number;
}

export interface RecordingService {
  isSupported(): boolean;
  requestPermission(): Promise<boolean>;
  start(maxDurationSeconds?: number): Promise<void>;
  stop(): Promise<RecordingResult>;
  cancel(): void;
  getState(): RecordingState;
  onStateChange(callback: (state: RecordingState) => void): () => void;
}
