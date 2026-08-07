'use client';

import * as React from 'react';
import { SpeechService, SpeechVoiceDTO, SpeechOptions, SpeechState } from '@/domain/services/speech-service';
import { BrowserSpeechService } from '@/infrastructure/services/browser-speech-service';

// Singleton instance to avoid multiple voiceschanged listeners
let globalSpeechService: SpeechService | null = null;

function getSpeechService(): SpeechService {
  if (!globalSpeechService) {
    globalSpeechService = new BrowserSpeechService();
  }
  return globalSpeechService;
}

/**
 * Custom React Hook quản lý tính năng Phát âm TTS trong giao diện UI (`useSpeech`).
 *
 * @remarks
 * - **SINGLETON SERVICE INSTANCE**: Sử dụng duy nhất 1 instance `BrowserSpeechService` toàn cục để tránh đăng ký lặp các sự kiện `onvoiceschanged` của trình duyệt.
 * - **UNMOUNT & ROUTE CHANGE CLEANUP**:
 *   - Khi component unmount hoặc chuyển trang, hàm dọn dẹp trong `useEffect` tự động hủy đăng ký listener (`unsubscribe()`) và dừng mọi âm thanh đang phát (`service.stop()`).
 *
 * @returns Đối tượng chứa trạng thái `isSupported`, danh sách `voices`, `status`, `isSpeaking`, `currentText` và các phương thức `speak`, `stop`, `pause`, `resume`.
 */
export function useSpeech() {
  const service = React.useMemo(() => getSpeechService(), []);
  const [isSupported, setIsSupported] = React.useState(false);
  const [voices, setVoices] = React.useState<SpeechVoiceDTO[]>([]);
  const [status, setStatus] = React.useState<SpeechState>('idle');
  const [currentText, setCurrentText] = React.useState<string>('');

  React.useEffect(() => {
    let isMounted = true;
    const supported = service.isSupported();
    Promise.resolve().then(() => {
      if (isMounted) setIsSupported(supported);
    });

    if (supported) {
      service.getVoices().then((v) => {
        if (isMounted) setVoices(v);
      });

      const unsubscribe = service.onStateChange((newState) => {
        if (isMounted) setStatus(newState);
      });

      return () => {
        isMounted = false;
        unsubscribe();
        // Auto cancel speech when unmounting or navigating routes
        service.stop();
      };
    }
  }, [service]);

  const speak = React.useCallback(
    async (text: string, options?: SpeechOptions) => {
      setCurrentText(text);
      await service.speak(text, options);
    },
    [service]
  );

  const stop = React.useCallback(() => {
    service.stop();
    setCurrentText('');
  }, [service]);

  const pause = React.useCallback(() => {
    service.pause();
  }, [service]);

  const resume = React.useCallback(() => {
    service.resume();
  }, [service]);

  return {
    isSupported,
    voices,
    status,
    isSpeaking: status === 'speaking',
    currentText,
    speak,
    stop,
    pause,
    resume,
  };
}

