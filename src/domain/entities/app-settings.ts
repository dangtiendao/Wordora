export interface AnswerComparisonOptions {
  ignoreCase: boolean;
  ignorePunctuation: boolean;
  ignoreWhitespace: boolean;
}

export interface ReviewOptions {
  enableTTS: boolean;
  enableRecording: boolean;
  showPhonetic: boolean;
  showExample: boolean;
}

export interface AppSettings {
  id: string; // Singleton setting ID, e.g., 'default'
  speechLanguage: string;
  preferredVoiceURI?: string | null;
  speechRate: number; // 0.5 to 2.0
  speechPitch: number; // 0.5 to 1.5
  dailyNewItemLimit: number;
  sessionSize: number;
  autoPlaySpeech: boolean;
  answerComparisonOptions: AnswerComparisonOptions;
  reviewOptions: ReviewOptions;
  updatedAt: string; // ISO 8601 UTC
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  id: 'default',
  speechLanguage: 'en-US',
  preferredVoiceURI: null,
  speechRate: 1.0,
  speechPitch: 1.0,
  dailyNewItemLimit: 10,
  sessionSize: 20,
  autoPlaySpeech: false,
  answerComparisonOptions: {
    ignoreCase: true,
    ignorePunctuation: true,
    ignoreWhitespace: true,
  },
  reviewOptions: {
    enableTTS: true,
    enableRecording: true,
    showPhonetic: true,
    showExample: true,
  },
  updatedAt: new Date(0).toISOString(),
};

export type UpdateAppSettingsInput = Partial<Omit<AppSettings, 'id'>>;
