export interface SpeechVoiceDTO {
  uri: string;
  name: string;
  lang: string;
  default: boolean;
  localService: boolean;
}

export interface SpeechOptions {
  rate?: number; // 0.5 to 2.0 (default 1.0)
  pitch?: number; // 0.5 to 1.5 (default 1.0)
  volume?: number; // 0.0 to 1.0 (default 1.0)
  voiceUri?: string;
  lang?: string;
}

export type SpeechState = 'idle' | 'speaking' | 'paused' | 'error';

export interface SpeechService {
  isSupported(): boolean;
  getVoices(): Promise<SpeechVoiceDTO[]>;
  speak(text: string, options?: SpeechOptions): Promise<void>;
  pause(): void;
  resume(): void;
  stop(): void;
  getState(): SpeechState;
  onStateChange(callback: (state: SpeechState) => void): () => void;
}
