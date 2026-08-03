'use client';

import * as React from 'react';
import { useDatabase } from '@/hooks/use-database';
import { useSpeech } from '@/hooks/use-speech';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { Volume2, VolumeX, Save, CheckCircle2 } from 'lucide-react';
import { AppSettings } from '@/domain/entities/app-settings';

const LANGUAGE_OPTIONS = [
  { value: 'en-US', label: 'Tiếng Anh (Mỹ - en-US)' },
  { value: 'en-GB', label: 'Tiếng Anh (Anh - en-GB)' },
  { value: 'vi-VN', label: 'Tiếng Việt (vi-VN)' },
  { value: 'ja-JP', label: 'Tiếng Nhật (ja-JP)' },
  { value: 'ko-KR', label: 'Tiếng Hàn (ko-KR)' },
  { value: 'fr-FR', label: 'Tiếng Pháp (fr-FR)' },
  { value: 'de-DE', label: 'Tiếng Đức (de-DE)' },
  { value: 'es-ES', label: 'Tiếng Tây Ban Nha (es-ES)' },
];

export default function SettingsPage() {
  const { status, container } = useDatabase();
  const { isSupported, voices, isSpeaking, speak, stop } = useSpeech();

  const [speechLang, setSpeechLang] = React.useState<string>('en-US');
  const [selectedVoiceUri, setSelectedVoiceUri] = React.useState<string>('');
  const [speechRate, setSpeechRate] = React.useState<number>(1.0);
  const [speechPitch, setSpeechPitch] = React.useState<number>(1.0);

  const [isLoadingSettings, setIsLoadingSettings] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  // Filter voices by selected language prefix
  const filteredVoices = React.useMemo(() => {
    if (!voices || voices.length === 0) return [];
    const prefix = speechLang.split('-')[0].toLowerCase();
    const matches = voices.filter((v) => v.lang.toLowerCase().startsWith(prefix));
    return matches.length > 0 ? matches : voices;
  }, [voices, speechLang]);

  const voiceOptions = React.useMemo(() => {
    return filteredVoices.map((v) => ({
      value: v.uri,
      label: `${v.name} (${v.lang})${v.default ? ' [Mặc định]' : ''}`,
    }));
  }, [filteredVoices]);

  // Load app settings
  const loadSettings = React.useCallback(async () => {
    if (!container) return;
    setIsLoadingSettings(true);
    try {
      const current = await container.settingsRepository.get();
      setSpeechLang(current.speechLanguage || 'en-US');
      setSelectedVoiceUri(current.preferredVoiceURI || '');
      setSpeechRate(current.speechRate ?? 1.0);
      setSpeechPitch(current.speechPitch ?? 1.0);
    } catch {
      // Silent catch
    } finally {
      setIsLoadingSettings(false);
    }
  }, [container]);

  React.useEffect(() => {
    let isMounted = true;
    if (status === 'ready') {
      Promise.resolve().then(() => {
        if (isMounted) {
          loadSettings();
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [status, loadSettings]);

  // Update selected voice URI default if current selection is invalid
  React.useEffect(() => {
    let isMounted = true;
    if (filteredVoices.length > 0 && !selectedVoiceUri) {
      Promise.resolve().then(() => {
        if (isMounted) {
          setSelectedVoiceUri(filteredVoices[0].uri);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [filteredVoices, selectedVoiceUri]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!container) return;

    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const updated: Partial<AppSettings> = {
        speechLanguage: speechLang,
        preferredVoiceURI: selectedVoiceUri,
        speechRate,
        speechPitch,
      };
      await container.settingsRepository.update(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestAudio = () => {
    if (!isSupported) return;
    if (isSpeaking) {
      stop();
    } else {
      const sampleTexts: Record<string, string> = {
        'en-US': 'Hello! Welcome to Wordora language learning.',
        'en-GB': 'Hello! Welcome to Wordora language learning.',
        'vi-VN': 'Xin chào! Chào mừng bạn đến với ứng dụng Wordora.',
        'ja-JP': 'こんにちは！Wordoraへようこそ。',
        'ko-KR': '안녕하세요! Wordora에 오신 것을 환영합니다.',
      };
      const text = sampleTexts[speechLang] || 'Hello! Testing Web Speech API in Wordora.';
      speak(text, {
        lang: speechLang,
        voiceUri: selectedVoiceUri,
        rate: speechRate,
        pitch: speechPitch,
      });
    }
  };

  if (status === 'initializing' || isLoadingSettings) {
    return <LoadingState label="Đang tải cấu hình cài đặt..." />;
  }

  if (status === 'error') {
    return <ErrorState message="Không thể tải dữ liệu cài đặt từ cơ sở dữ liệu." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cài đặt ứng dụng"
        description="Tùy chỉnh giọng phát âm TTS, tốc độ đọc và các thiết lập cá nhân hóa."
      />

      <Card variant="glass" className="max-w-2xl mx-auto border-slate-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-emerald-400" />
            <div>
              <CardTitle className="text-lg">Cấu hình giọng đọc Web Speech (TTS)</CardTitle>
              <CardDescription>
                Tùy chỉnh giọng phát âm offline có sẵn trên trình duyệt và thiết bị của bạn.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {!isSupported ? (
            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-900/40 text-xs text-amber-300 flex items-center gap-2">
              <VolumeX className="w-5 h-5 shrink-0 text-amber-400" />
              <span>
                Trình duyệt của bạn hiện chưa hỗ trợ Web Speech API (`SpeechSynthesis`). Tính năng phát âm tự động sẽ tạm thời không khả dụng.
              </span>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              {saveSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Cài đặt giọng đọc đã được lưu thành công vào IndexedDB!</span>
                </div>
              )}

              <Select
                label="Ngôn ngữ phát âm mặc định"
                options={LANGUAGE_OPTIONS}
                value={speechLang}
                onChange={(e) => {
                  setSpeechLang(e.target.value);
                  setSelectedVoiceUri(''); // Reset selected voice for new language
                }}
              />

              {voiceOptions.length > 0 ? (
                <Select
                  label={`Giọng đọc khả dụng trên thiết bị (${voiceOptions.length} giọng)`}
                  options={voiceOptions}
                  value={selectedVoiceUri}
                  onChange={(e) => setSelectedVoiceUri(e.target.value)}
                />
              ) : (
                <p className="text-xs text-amber-400 italic">
                  Chưa tìm thấy giọng đọc tùy chỉnh cho ngôn ngữ này. Trình duyệt sẽ dùng giọng mặc định hệ thống.
                </p>
              )}

              {/* Speech Rate Slider */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-xs">
                  <label className="text-slate-300 font-medium">Tốc độ đọc (Speech Rate):</label>
                  <span className="font-mono text-emerald-400 font-bold">{speechRate.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={speechRate}
                  onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>0.5x (Chậm)</span>
                  <span>1.0x (Chuẩn)</span>
                  <span>2.0x (Nhanh)</span>
                </div>
              </div>

              {/* Speech Pitch Slider */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-xs">
                  <label className="text-slate-300 font-medium">Cao độ giọng (Pitch):</label>
                  <span className="font-mono text-emerald-400 font-bold">{speechPitch.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.1"
                  value={speechPitch}
                  onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>0.5 (Trầm)</span>
                  <span>1.0 (Chuẩn)</span>
                  <span>1.5 (Bổng)</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={handleTestAudio}
                  className="gap-2"
                >
                  <Volume2 className={`w-4 h-4 ${isSpeaking ? 'text-emerald-400 animate-pulse' : ''}`} />
                  {isSpeaking ? 'Dừng phát' : 'Nghe thử âm thanh'}
                </Button>

                <Button type="submit" variant="primary" size="md" isLoading={isSaving} className="gap-2">
                  <Save className="w-4 h-4" /> Lưu cấu hình
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
