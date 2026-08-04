'use client';

import * as React from 'react';
import { useDatabase } from '@/hooks/use-database';
import { useSpeech } from '@/hooks/use-speech';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { Volume2, VolumeX, Save, CheckCircle2, Download, Upload, Trash2, AlertTriangle, FileText } from 'lucide-react';
import { AppSettings } from '@/domain/entities/app-settings';
import {
  ExportService,
  FileReaderAdapter,
  ImportPipeline,
  ImportPreview,
  ExportEnvelope,
  ConflictStrategy,
} from '@/features/import-export';

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

  // Backup & Restore state
  const [isExporting, setIsExporting] = React.useState(false);
  const [exportMessage, setExportMessage] = React.useState<string | null>(null);

  const [importPreview, setImportPreview] = React.useState<ImportPreview | null>(null);
  const [importEnvelopeRaw, setImportEnvelopeRaw] = React.useState<ExportEnvelope | null>(null);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = React.useState(false);
  const [conflictStrategy, setConflictStrategy] = React.useState<ConflictStrategy>('overwrite');
  const [isRestoring, setIsRestoring] = React.useState(false);

  // Clear DB Dialog State
  const [isResetDialogOpen, setIsResetDialogOpen] = React.useState(false);
  const [resetConfirmText, setResetConfirmText] = React.useState('');
  const [isResetting, setIsResetting] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

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

  // Handle Export Backup
  const handleExportBackup = async () => {
    if (!container) return;
    setIsExporting(true);
    setExportMessage(null);
    try {
      const exportService = new ExportService(container);
      const filename = await exportService.exportAndDownload();
      setExportMessage(`Đã xuất bản sao lưu thành công: ${filename}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không thể xuất bản sao lưu.');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle File Selection for Preview
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !container) return;

    try {
      const text = await FileReaderAdapter.readTextFile(file);
      const jsonObj = JSON.parse(text);
      const pipeline = new ImportPipeline(container);
      const preview = pipeline.generatePreview(jsonObj);

      setImportPreview(preview);
      setImportEnvelopeRaw(jsonObj);
      setIsPreviewDialogOpen(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lỗi khi đọc file backup.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle Execute Restore
  const handleConfirmRestore = async () => {
    if (!container || !importEnvelopeRaw) return;
    setIsRestoring(true);
    try {
      const pipeline = new ImportPipeline(container);
      await pipeline.executeRestore(importEnvelopeRaw, {
        conflictStrategy,
        restoreSettings: true,
      });

      alert('Đã khôi phục dữ liệu thành công từ bản sao lưu!');
      setIsPreviewDialogOpen(false);
      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lỗi khi khôi phục dữ liệu.');
    } finally {
      setIsRestoring(false);
    }
  };

  // Handle Reset All Application Data
  const handleResetData = async () => {
    if (!container || resetConfirmText !== 'XÁC NHẬN XÓA') return;
    setIsResetting(true);
    try {
      const db = container.db;
      await db.transaction(
        'rw',
        [db.decks, db.learningItems, db.reviewStates, db.reviewLogs, db.studySessions, db.recordings],
        async () => {
          await db.decks.clear();
          await db.learningItems.clear();
          await db.reviewStates.clear();
          await db.reviewLogs.clear();
          await db.studySessions.clear();
          await db.recordings.clear();
        }
      );
      alert('Đã xóa toàn bộ dữ liệu ứng dụng Wordora.');
      setIsResetDialogOpen(false);
      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lỗi khi xóa dữ liệu.');
    } finally {
      setIsResetting(false);
    }
  };

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
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader
        title="Cài đặt ứng dụng"
        description="Tùy chỉnh giọng phát âm TTS, tốc độ đọc, sao lưu bản lưu trữ và quản lý cơ sở dữ liệu local."
      />

      {/* TTS Speech Synthesis Settings */}
      <Card variant="glass" className="border-slate-800">
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
                  setSelectedVoiceUri('');
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

      {/* Backup & Restore Section */}
      <Card variant="glass" className="border-slate-800 space-y-4">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-emerald-400" />
            <div>
              <CardTitle className="text-lg">Sao lưu & Khôi phục dữ liệu (JSON Backup)</CardTitle>
              <CardDescription>
                Xuất toàn bộ bộ học, từ vựng và lịch sử ôn tập ra file sao lưu JSON an toàn hoặc khôi phục dữ liệu từ bản sao lưu trước đó.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {exportMessage && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{exportMessage}</span>
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-1">
            <p className="font-semibold text-slate-200 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-teal-400" /> Chính sách sao lưu dữ liệu ghi âm (Recordings):
            </p>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Bản sao lưu JSON bao gồm tất cả các Bộ học, Từ vựng, Trạng thái SRS, Lịch sử ôn tập và Phiên học. Các bản ghi âm giọng nói luyện phát âm được lưu trữ cục bộ trực tiếp trên thiết bị của bạn và không gộp trong file JSON này để tối ưu dung lượng.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap pt-2">
            <Button
              variant="primary"
              size="md"
              isLoading={isExporting}
              onClick={handleExportBackup}
              className="gap-2"
            >
              <Download className="w-4 h-4" /> Xuất bản sao lưu (JSON)
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleFileSelect}
            />

            <Button
              variant="outline"
              size="md"
              onClick={() => fileInputRef.current?.click()}
              className="gap-2"
            >
              <Upload className="w-4 h-4" /> Kiểm tra & Khôi phục từ file JSON
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dangerous Operations Section */}
      <Card variant="glass" className="border-rose-900/40 bg-rose-950/10">
        <CardHeader>
          <div className="flex items-center gap-2 text-rose-400">
            <AlertTriangle className="w-5 h-5" />
            <div>
              <CardTitle className="text-lg">Vùng nguy hiểm (Danger Zone)</CardTitle>
              <CardDescription className="text-rose-400/80">
                Thao tác xóa toàn bộ dữ liệu ứng dụng Wordora khỏi trình duyệt.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <p className="text-xs text-slate-400">
            Cảnh báo: Dữ liệu Wordora được lưu trữ cục bộ trên trình duyệt này (`IndexedDB`). Nếu bạn xóa dữ liệu duyệt web hoặc thực hiện thao tác xóa dữ liệu, tất cả bộ học và tiến trình sẽ bị mất hoàn toàn nếu chưa tạo bản sao lưu.
          </p>

          <Button
            variant="danger"
            size="md"
            onClick={() => {
              setResetConfirmText('');
              setIsResetDialogOpen(true);
            }}
            className="gap-2"
          >
            <Trash2 className="w-4 h-4" /> Xóa toàn bộ dữ liệu ứng dụng
          </Button>
        </CardContent>
      </Card>

      {/* Import Preview Modal Dialog */}
      <Dialog
        isOpen={isPreviewDialogOpen}
        onClose={() => setIsPreviewDialogOpen(false)}
        title="Xem trước & Khôi phục dữ liệu"
        description="Thông tin chi tiết từ bản sao lưu JSON được kiểm định."
      >
        <div className="space-y-4 py-2 text-xs">
          {importPreview?.validationResult.isValid ? (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Tệp sao lưu hợp lệ (Wordora schemaVersion 1).</span>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 space-y-1">
              <p className="font-bold">Tệp sao lưu không hợp lệ:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                {importPreview?.validationResult.errors.map((e, idx) => (
                  <li key={idx}>
                    {e.path}: {e.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {importPreview && (
            <div className="space-y-2 border-t border-b border-slate-800 py-3">
              <p className="font-semibold text-slate-200">Nội dung dữ liệu trong bản sao lưu:</p>
              <ul className="grid grid-cols-2 gap-2 text-slate-300 font-mono text-[11px]">
                <li>• Số bộ học: <strong>{importPreview.deckCount}</strong></li>
                <li>• Số từ vựng: <strong>{importPreview.learningItemCount}</strong></li>
                <li>• Trạng thái SRS: <strong>{importPreview.reviewStateCount}</strong></li>
                <li>• Nhật ký ôn tập: <strong>{importPreview.reviewLogCount}</strong></li>
                <li>• Phiên đã học: <strong>{importPreview.studySessionCount}</strong></li>
                <li>• Ghi âm đi kèm: <strong>{importPreview.recordingsCount} bản</strong> (chỉ lưu local)</li>
              </ul>
            </div>
          )}

          {importPreview?.validationResult.isValid && (
            <div className="space-y-2">
              <label className="font-medium text-slate-200">Xử lý khi khôi phục:</label>
              <Select
                options={[
                  { value: 'overwrite', label: 'Ghi đè hoàn toàn (Xóa dữ liệu cũ & Khôi phục mới)' },
                  { value: 'duplicate', label: 'Tạo bản sao mới (Giữ dữ liệu cũ & Thêm bản sao)' },
                ]}
                value={conflictStrategy}
                onChange={(e) => setConflictStrategy(e.target.value as ConflictStrategy)}
              />
              <p className="text-[11px] text-amber-400 italic">
                💡 Hệ thống sẽ tự động tạo bản sao lưu tạm thời trước khi ghi. Nếu có bất kỳ lỗi nào xảy ra, toàn bộ thao tác sẽ được hoàn tác an toàn!
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button variant="ghost" size="md" onClick={() => setIsPreviewDialogOpen(false)}>
              Hủy bỏ
            </Button>
            <Button
              variant="primary"
              size="md"
              disabled={!importPreview?.validationResult.isValid}
              isLoading={isRestoring}
              onClick={handleConfirmRestore}
            >
              Bắt đầu khôi phục ngay
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Reset Application Data Confirmation Dialog */}
      <Dialog
        isOpen={isResetDialogOpen}
        onClose={() => setIsResetDialogOpen(false)}
        title="Xác nhận xóa TOÀN BỘ dữ liệu?"
        description="Hành động này sẽ xóa vĩnh viễn tất cả bộ học, từ vựng, lịch sử ôn tập và bản ghi âm khỏi thiết bị."
        variant="danger"
      >
        <div className="space-y-4 py-2">
          <p className="text-xs text-rose-300 bg-rose-950/40 border border-rose-900 p-3 rounded-xl">
            Để xác nhận hành động nguy hiểm này, vui lòng nhập chính xác cụm từ <strong className="font-mono text-white underline">XÁC NHẬN XÓA</strong> vào ô dưới đây.
          </p>

          <input
            type="text"
            value={resetConfirmText}
            onChange={(e) => setResetConfirmText(e.target.value)}
            placeholder="Nhập XÁC NHẬN XÓA..."
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-rose-500 font-mono"
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button variant="ghost" size="md" onClick={() => setIsResetDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="danger"
              size="md"
              disabled={resetConfirmText !== 'XÁC NHẬN XÓA'}
              isLoading={isResetting}
              onClick={handleResetData}
            >
              Xóa vĩnh viễn dữ liệu
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
