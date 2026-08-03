'use client';

import * as React from 'react';
import { useRecording } from '@/hooks/use-recording';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Mic, Square, X, Save, Trash2, ShieldCheck, AlertTriangle } from 'lucide-react';

export interface VoiceRecorderWidgetProps {
  itemId: string;
  itemPrompt?: string;
  onSaved?: () => void;
  onDeleted?: () => void;
}

export const VoiceRecorderWidget: React.FC<VoiceRecorderWidgetProps> = ({
  itemId,
  itemPrompt,
  onSaved,
  onDeleted,
}) => {
  const {
    isSupported,
    hasPermission,
    isRecording,
    timerSeconds,
    audioUrl,
    recordingResult,
    startRecording,
    stopRecording,
    cancelRecording,
    loadSavedRecording,
    saveRecording,
    deleteRecording,
  } = useRecording();

  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isSavedInDb, setIsSavedInDb] = React.useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = React.useState(false);

  // Load saved recording for this item on mount
  React.useEffect(() => {
    let isMounted = true;
    if (itemId) {
      loadSavedRecording(itemId).then((saved) => {
        if (isMounted && saved) {
          setIsSavedInDb(true);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [itemId, loadSavedRecording]);

  const handleStart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setErrorMsg(null);
    try {
      await startRecording(30);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Không thể khởi động micro.');
    }
  };

  const handleStop = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setErrorMsg(null);
    try {
      await stopRecording();
      setIsSavedInDb(false);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Không thể dừng ghi âm.');
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    cancelRecording();
    setErrorMsg(null);
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!recordingResult) return;
    setIsSaving(true);
    setErrorMsg(null);
    try {
      await saveRecording(itemId);
      setIsSavedInDb(true);
      if (onSaved) onSaved();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Không thể lưu bản ghi âm.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteRecording(itemId);
      setIsSavedInDb(false);
      setIsDeleteConfirmOpen(false);
      if (onDeleted) onDeleted();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Không thể xóa bản ghi âm.');
    }
  };

  if (!isSupported) {
    return (
      <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-900/40 text-[11px] text-amber-400 flex items-center gap-1.5">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
        <span>Trình duyệt không hỗ trợ Web MediaRecorder API để ghi âm.</span>
      </div>
    );
  }

  return (
    <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2.5 text-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-slate-300 flex items-center gap-1.5 text-xs">
          <Mic className="w-3.5 h-3.5 text-emerald-400" /> Luyện phát âm cá nhân
        </span>

        <span className="text-[10px] text-slate-500 flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-400" /> Chỉ lưu trên thiết bị
        </span>
      </div>

      {errorMsg && (
        <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-800/60 text-[11px] text-rose-300">
          {errorMsg}
          {hasPermission === false && (
            <p className="mt-0.5 text-[10px] text-slate-400">
              💡 Hãy kiểm tra biểu tượng chiếc khóa/micro trên thanh địa chỉ trình duyệt để cấp quyền micro cho trang web (Localhost/HTTPS).
            </p>
          )}
        </div>
      )}

      {/* Recording State Controls */}
      {isRecording ? (
        <div className="flex items-center justify-between gap-3 p-2 rounded-xl bg-rose-950/30 border border-rose-900/60 animate-pulse">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span className="font-semibold text-rose-300 text-xs">
              Đang ghi âm... ({timerSeconds}s / 30s)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="danger"
              size="sm"
              onClick={handleStop}
              className="h-7 text-xs gap-1"
            >
              <Square className="w-3 h-3 fill-current" /> Dừng
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="h-7 text-xs text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" /> Hủy
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleStart}
            className="gap-1.5 text-xs text-emerald-400 border-emerald-900/60 hover:bg-emerald-950/40"
          >
            <Mic className="w-3.5 h-3.5" /> {audioUrl ? 'Ghi âm lại' : 'Bắt đầu ghi âm'}
          </Button>

          {audioUrl && (
            <div className="flex items-center gap-2">
              <audio controls src={audioUrl} className="h-7 max-w-[180px] sm:max-w-[220px]" />

              {!isSavedInDb && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSave}
                  isLoading={isSaving}
                  className="gap-1 text-xs h-7"
                >
                  <Save className="w-3 h-3" /> Lưu
                </Button>
              )}

              {isSavedInDb && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDeleteConfirmOpen(true);
                  }}
                  className="h-7 text-xs text-slate-400 hover:text-rose-400"
                  title="Xóa bản ghi âm"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        title="Xóa bản ghi âm cá nhân?"
        description={`Bạn có chắc chắn muốn xóa bản ghi âm cho "${itemPrompt || 'mục này'}"?`}
        confirmText="Xóa bản ghi âm"
        cancelText="Hủy"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
};
