import {
  SpeechService,
  SpeechVoiceDTO,
  SpeechOptions,
  SpeechState,
} from '@/domain/services/speech-service';

export class BrowserSpeechService implements SpeechService {
  private state: SpeechState = 'idle';
  private listeners: Set<(state: SpeechState) => void> = new Set();
  private cachedVoices: SpeechVoiceDTO[] = [];
  private isVoicesInitialized = false;

  constructor() {
    // SSR Safe: Only register event listeners on client side
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.initVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          this.initVoices();
        };
      }
    }
  }

  isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  private initVoices(): SpeechVoiceDTO[] {
    if (!this.isSupported()) return [];
    try {
      const nativeVoices = window.speechSynthesis.getVoices();
      this.cachedVoices = nativeVoices.map((v) => ({
        uri: v.voiceURI,
        name: v.name,
        lang: v.lang,
        default: v.default,
        localService: v.localService,
      }));
      this.isVoicesInitialized = true;
      return this.cachedVoices;
    } catch {
      return [];
    }
  }

  async getVoices(): Promise<SpeechVoiceDTO[]> {
    if (!this.isSupported()) return [];
    if (this.cachedVoices.length > 0) return this.cachedVoices;
    return this.initVoices();
  }

  getState(): SpeechState {
    return this.state;
  }

  private setState(newState: SpeechState): void {
    this.state = newState;
    this.listeners.forEach((callback) => callback(newState));
  }

  onStateChange(callback: (state: SpeechState) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private resolveVoice(
    targetLang?: string,
    targetVoiceUri?: string
  ): SpeechSynthesisVoice | null {
    if (!this.isSupported()) return null;

    const nativeVoices = window.speechSynthesis.getVoices();
    if (!nativeVoices || nativeVoices.length === 0) return null;

    // 1. Preferred Voice URI match
    if (targetVoiceUri) {
      const uriMatch = nativeVoices.find((v) => v.voiceURI === targetVoiceUri);
      if (uriMatch) return uriMatch;
    }

    if (!targetLang) return nativeVoices.find((v) => v.default) || nativeVoices[0];

    const langLower = targetLang.toLowerCase();

    // 2. Exact language match (e.g. "en-US")
    const exactLangMatch = nativeVoices.find(
      (v) => v.lang.toLowerCase() === langLower || v.lang.toLowerCase().replace('_', '-') === langLower
    );
    if (exactLangMatch) return exactLangMatch;

    // 3. Language prefix match (e.g. "en")
    const prefix = langLower.split('-')[0];
    const prefixMatch = nativeVoices.find((v) => v.lang.toLowerCase().startsWith(prefix));
    if (prefixMatch) return prefixMatch;

    // 4. Default voice matching prefix
    const defaultPrefixMatch = nativeVoices.find(
      (v) => v.default && v.lang.toLowerCase().startsWith(prefix)
    );
    if (defaultPrefixMatch) return defaultPrefixMatch;

    // 5. Global fallback
    return nativeVoices.find((v) => v.default) || nativeVoices[0];
  }

  async speak(text: string, options?: SpeechOptions): Promise<void> {
    if (!this.isSupported()) return;

    const trimmed = text.trim();
    if (!trimmed) return;

    // Stop any ongoing speech first to prevent overlapping utterance race conditions
    this.stop();

    try {
      const utterance = new SpeechSynthesisUtterance(trimmed);

      // Clamp rate (0.5 to 2.0) & pitch (0.5 to 1.5)
      utterance.rate = Math.max(0.5, Math.min(2.0, options?.rate ?? 1.0));
      utterance.pitch = Math.max(0.5, Math.min(1.5, options?.pitch ?? 1.0));
      utterance.volume = Math.max(0.0, Math.min(1.0, options?.volume ?? 1.0));

      const selectedVoice = this.resolveVoice(options?.lang, options?.voiceUri);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
      } else if (options?.lang) {
        utterance.lang = options.lang;
      }

      utterance.onstart = () => {
        this.setState('speaking');
      };

      utterance.onend = () => {
        this.setState('idle');
      };

      utterance.onerror = () => {
        this.setState('error');
        // Reset to idle after brief delay
        setTimeout(() => {
          if (this.state === 'error') this.setState('idle');
        }, 1000);
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      this.setState('error');
    }
  }

  pause(): void {
    if (!this.isSupported()) return;
    try {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        this.setState('paused');
      }
    } catch {
      // Silent catch
    }
  }

  resume(): void {
    if (!this.isSupported()) return;
    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        this.setState('speaking');
      }
    } catch {
      // Silent catch
    }
  }

  stop(): void {
    if (!this.isSupported()) return;
    try {
      window.speechSynthesis.cancel();
      this.setState('idle');
    } catch {
      // Silent catch
    }
  }
}
