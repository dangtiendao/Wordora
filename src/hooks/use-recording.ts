'use client';

import * as React from 'react';
import { useDatabase } from './use-database';
import { RecordingService, RecordingState, RecordingResult } from '@/domain/services/recording-service';
import { BrowserRecordingService } from '@/infrastructure/services/browser-recording-service';
import { generateUUID } from '@/lib/uuid';
import { getCurrentISOString } from '@/lib/date';
import { Recording } from '@/domain/entities/recording';

let globalRecordingService: RecordingService | null = null;

function getRecordingService(): RecordingService {
  if (!globalRecordingService) {
    globalRecordingService = new BrowserRecordingService();
  }
  return globalRecordingService;
}

export function useRecording() {
  const { container } = useDatabase();
  const service = React.useMemo(() => getRecordingService(), []);

  const [isSupported, setIsSupported] = React.useState(false);
  const [hasPermission, setHasPermission] = React.useState<boolean | null>(null);
  const [status, setStatus] = React.useState<RecordingState>('idle');
  const [timerSeconds, setTimerSeconds] = React.useState(0);
  const [audioUrl, setAudioUrl] = React.useState<string | null>(null);
  const [recordingResult, setRecordingResult] = React.useState<RecordingResult | null>(null);
  const [isLoadingSaved, setIsLoadingSaved] = React.useState(false);

  // Clean object URL helper
  const revokeCurrentUrl = React.useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
  }, [audioUrl]);

  React.useEffect(() => {
    let isMounted = true;
    const supported = service.isSupported();
    Promise.resolve().then(() => {
      if (isMounted) setIsSupported(supported);
    });

    if (supported) {
      const unsubscribe = service.onStateChange((newState) => {
        if (isMounted) setStatus(newState);
      });

      return () => {
        isMounted = false;
        unsubscribe();
        revokeCurrentUrl();
        service.cancel();
      };
    }
  }, [service, revokeCurrentUrl]);

  // Live timer tick during recording
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  React.useEffect(() => {
    let isMounted = true;
    if (status === 'recording') {
      Promise.resolve().then(() => {
        if (isMounted) setTimerSeconds(0);
      });
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      isMounted = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [status]);

  const requestPermission = React.useCallback(async () => {
    const granted = await service.requestPermission();
    setHasPermission(granted);
    return granted;
  }, [service]);

  const startRecording = React.useCallback(
    async (maxDurationSeconds = 30) => {
      revokeCurrentUrl();
      setRecordingResult(null);

      const perm = await requestPermission();
      if (!perm) {
        throw new Error('Chưa cấp quyền truy cập Micro.');
      }

      await service.start(maxDurationSeconds);
    },
    [service, requestPermission, revokeCurrentUrl]
  );

  const stopRecording = React.useCallback(async () => {
    const result = await service.stop();
    setRecordingResult(result);

    // Create object URL ONLY for client playback
    const url = URL.createObjectURL(result.blob);
    setAudioUrl(url);
    return result;
  }, [service]);

  const cancelRecording = React.useCallback(() => {
    service.cancel();
    revokeCurrentUrl();
    setRecordingResult(null);
    setTimerSeconds(0);
  }, [service, revokeCurrentUrl]);

  const loadSavedRecording = React.useCallback(
    async (itemId: string): Promise<Recording | null> => {
      if (!container) return null;
      setIsLoadingSaved(true);
      try {
        const savedList = await container.recordingRepository.findByItemId(itemId);
        if (savedList && savedList.length > 0) {
          const latest = savedList[savedList.length - 1];
          revokeCurrentUrl();
          const url = URL.createObjectURL(latest.audioBlob);
          setAudioUrl(url);
          setRecordingResult({
            blob: latest.audioBlob,
            mimeType: latest.mimeType,
            durationSeconds: Math.round(latest.durationMs / 1000),
          });
          return latest;
        }
        return null;
      } catch {
        return null;
      } finally {
        setIsLoadingSaved(false);
      }
    },
    [container, revokeCurrentUrl]
  );

  const saveRecording = React.useCallback(
    async (itemId: string): Promise<Recording> => {
      if (!container || !recordingResult) {
        throw new Error('Không có bản ghi âm hợp lệ để lưu.');
      }

      // Enforce 1 latest recording policy per item by deleting previous
      await container.recordingRepository.deleteByItemId(itemId);

      const now = getCurrentISOString();
      return await container.recordingRepository.create({
        id: generateUUID(),
        itemId,
        audioBlob: recordingResult.blob,
        mimeType: recordingResult.mimeType,
        durationMs: recordingResult.durationSeconds * 1000,
        createdAt: now,
      });
    },
    [container, recordingResult]
  );

  const deleteRecording = React.useCallback(
    async (itemId: string): Promise<boolean> => {
      if (!container) return false;
      revokeCurrentUrl();
      setRecordingResult(null);

      const count = await container.recordingRepository.deleteByItemId(itemId);
      return count > 0;
    },
    [container, revokeCurrentUrl]
  );

  return {
    isSupported,
    hasPermission,
    status,
    isRecording: status === 'recording',
    timerSeconds,
    audioUrl,
    recordingResult,
    isLoadingSaved,
    requestPermission,
    startRecording,
    stopRecording,
    cancelRecording,
    loadSavedRecording,
    saveRecording,
    deleteRecording,
  };
}
