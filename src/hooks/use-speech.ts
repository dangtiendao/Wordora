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
