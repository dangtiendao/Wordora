import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BrowserSpeechService } from './browser-speech-service';

/**
 * Bộ kiểm thử đơn vị cho BrowserSpeechService sử dụng Vitest.
 *
 * @remarks
 * - **MOCK LIMITATION NOTICE**:
 *   - Môi trường Node.js / JSDOM không có sẵn đối tượng `window.speechSynthesis`.
 *   - Các bài test tại đây sử dụng `vi.fn()` giả lập các sự kiện `speak`, `cancel`, `getVoices()`.
 *   - **TRÌNH DUYỆT THẬT**: Trong thực tế, việc nạp danh sách giọng đọc (`getVoices()`) trên Chrome diễn ra bất đồng bộ thông qua sự kiện `onvoiceschanged`. Việc phát âm phụ thuộc vào quyền autoplay của trình duyệt và giọng đọc được cài đặt trên OS. Các yếu tố này cần được xác minh thủ công trên thiết bị thực.
 */
describe('BrowserSpeechService Tests', () => {
  let originalSpeechSynthesis: typeof window.speechSynthesis;

  beforeEach(() => {
    originalSpeechSynthesis = window.speechSynthesis;

    const mockVoices = [
      { voiceURI: 'voice-1', name: 'Alex', lang: 'en-US', default: true, localService: true },
      { voiceURI: 'voice-2', name: 'Google US English', lang: 'en-US', default: false, localService: false },
      { voiceURI: 'voice-3', name: 'Kyoko', lang: 'ja-JP', default: false, localService: true },
    ] as SpeechSynthesisVoice[];

    // Mock speechSynthesis in global window
    Object.defineProperty(window, 'speechSynthesis', {
      writable: true,
      value: {
        getVoices: vi.fn().mockReturnValue(mockVoices),
        speak: vi.fn(),
        cancel: vi.fn(),
        pause: vi.fn(),
        resume: vi.fn(),
        onvoiceschanged: null,
        speaking: false,
        paused: false,
      },
    });

    // Mock SpeechSynthesisUtterance
    class MockUtterance {
      text: string;
      rate = 1.0;
      pitch = 1.0;
      volume = 1.0;
      voice: SpeechSynthesisVoice | null = null;
      lang = '';
      onstart: (() => void) | null = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;

      constructor(text: string) {
        this.text = text;
      }
    }

    vi.stubGlobal('SpeechSynthesisUtterance', MockUtterance);
  });

  afterEach(() => {
    Object.defineProperty(window, 'speechSynthesis', {
      writable: true,
      value: originalSpeechSynthesis,
    });
    vi.restoreAllMocks();
  });

  it('isSupported returns true when speechSynthesis exists', () => {
    const service = new BrowserSpeechService();
    expect(service.isSupported()).toBe(true);
  });

  it('getVoices returns mapped SpeechVoiceDTO array', async () => {
    const service = new BrowserSpeechService();
    const voices = await service.getVoices();

    expect(voices.length).toBe(3);
    expect(voices[0].name).toBe('Alex');
    expect(voices[0].uri).toBe('voice-1');
  });

  it('clamps rate and pitch values into valid ranges', async () => {
    const service = new BrowserSpeechService();
    await service.speak('Hello world', { rate: 5.0, pitch: -2.0 });

    expect(window.speechSynthesis.cancel).toHaveBeenCalled();
    expect(window.speechSynthesis.speak).toHaveBeenCalled();

    const callArg = (window.speechSynthesis.speak as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(callArg.rate).toBe(2.0); // Clamped to max 2.0
    expect(callArg.pitch).toBe(0.5); // Clamped to min 0.5
  });

  it('cancels previous speech before speaking new text', async () => {
    const service = new BrowserSpeechService();
    await service.speak('First text');
    await service.speak('Second text');

    expect(window.speechSynthesis.cancel).toHaveBeenCalledTimes(2);
    expect(window.speechSynthesis.speak).toHaveBeenCalledTimes(2);
  });

  it('stop cancels speech and sets state to idle', () => {
    const service = new BrowserSpeechService();
    service.stop();

    expect(window.speechSynthesis.cancel).toHaveBeenCalled();
    expect(service.getState()).toBe('idle');
  });
});

