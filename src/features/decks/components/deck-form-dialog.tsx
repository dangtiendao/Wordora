'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { CreateDeckSchema } from '@/domain/schemas/deck-schema';
import { Deck, CreateDeckInput } from '@/domain/entities/deck';

export interface DeckFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateDeckInput) => Promise<void>;
  initialData?: Deck | null;
  isLoading?: boolean;
}

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'Tiếng Anh (English)' },
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'ja', label: 'Tiếng Nhật (Japanese)' },
  { value: 'ko', label: 'Tiếng Hàn (Korean)' },
  { value: 'zh', label: 'Tiếng Trung (Chinese)' },
  { value: 'fr', label: 'Tiếng Pháp (French)' },
  { value: 'de', label: 'Tiếng Đức (German)' },
  { value: 'es', label: 'Tiếng Tây Ban Nha (Spanish)' },
];

const COLOR_PRESETS = [
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#f59e0b', // Amber
  '#06b6d4', // Cyan
];

const ICON_PRESETS = [
  { value: 'book', label: 'Sách 📖' },
  { value: 'globe', label: 'Địa cầu 🌐' },
  { value: 'sparkles', label: 'Ngôi sao ✨' },
  { value: 'flame', label: 'Ngọn lửa 🔥' },
  { value: 'graduation-cap', label: 'Mũ cử nhân 🎓' },
  { value: 'message-circle', label: 'Hội thoại 💬' },
];

export const DeckFormDialog: React.FC<DeckFormDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}) => {
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateDeckInput>({
    resolver: zodResolver(CreateDeckSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      sourceLanguage: initialData?.sourceLanguage || 'en',
      targetLanguage: initialData?.targetLanguage || 'vi',
      color: initialData?.color || '#10b981',
      icon: initialData?.icon || 'book',
    },
  });

  const selectedColor = watch('color');

  React.useEffect(() => {
    if (isOpen) {
      setServerError(null);
      reset({
        name: initialData?.name || '',
        description: initialData?.description || '',
        sourceLanguage: initialData?.sourceLanguage || 'en',
        targetLanguage: initialData?.targetLanguage || 'vi',
        color: initialData?.color || '#10b981',
        icon: initialData?.icon || 'book',
      });
    }
  }, [isOpen, initialData, reset]);

  const handleFormSubmit = async (data: CreateDeckInput) => {
    setServerError(null);
    if (data.sourceLanguage === data.targetLanguage) {
      setServerError('Ngôn ngữ nguồn và ngôn ngữ đích không được giống nhau.');
      return;
    }

    try {
      await onSubmit(data);
      onClose();
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Không thể lưu bộ học.');
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Chỉnh sửa bộ học' : 'Tạo bộ học mới'}
      description="Nhập thông tin bộ học từ vựng, cụm từ hoặc mẫu câu."
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 pt-1">
        {serverError && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300">
            {serverError}
          </div>
        )}

        <Input
          label="Tên bộ học *"
          placeholder="Ví dụ: English Oxford 3000..."
          error={errors.name?.message}
          {...register('name')}
        />

        <Textarea
          label="Mô tả bộ học"
          placeholder="Mô tả ngắn gọn mục đích bài học..."
          rows={2}
          error={errors.description?.message}
          {...register('description')}
        />

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Ngôn ngữ nguồn *"
            options={LANGUAGE_OPTIONS}
            error={errors.sourceLanguage?.message}
            {...register('sourceLanguage')}
          />

          <Select
            label="Ngôn ngữ đích *"
            options={LANGUAGE_OPTIONS}
            error={errors.targetLanguage?.message}
            {...register('targetLanguage')}
          />
        </div>

        <Select
          label="Biểu tượng *"
          options={ICON_PRESETS}
          error={errors.icon?.message}
          {...register('icon')}
        />

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300">Màu sắc đại diện</label>
          <div className="flex items-center gap-2">
            {COLOR_PRESETS.map((color) => (
              <button
                key={color}
                type="button"
                className={`w-7 h-7 rounded-full border-2 transition-transform ${
                  selectedColor === color ? 'border-white scale-110' : 'border-transparent opacity-80 hover:opacity-100'
                }`}
                style={{ backgroundColor: color }}
                onClick={() => setValue('color', color)}
                aria-label={`Chọn màu ${color}`}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            {initialData ? 'Lưu thay đổi' : 'Tạo mới'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
