'use client';

import * as React from 'react';
import { useForm, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { LearningItemTypeSchema } from '@/domain/schemas/learning-item-schema';
import { LearningItem, CreateLearningItemInput } from '@/domain/entities/learning-item';

export interface LearningItemFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateLearningItemInput) => Promise<void>;
  deckId: string;
  initialData?: LearningItem | null;
  isLoading?: boolean;
}

const TYPE_OPTIONS = [
  { value: 'vocabulary', label: 'Từ vựng (Vocabulary)' },
  { value: 'phrase', label: 'Cụm từ (Phrase)' },
  { value: 'sentence', label: 'Mẫu câu (Sentence)' },
];

const DIFFICULTY_OPTIONS = [
  { value: '1', label: '1 - Rất dễ' },
  { value: '2', label: '2 - Dễ' },
  { value: '3', label: '3 - Trung bình' },
  { value: '4', label: '4 - Khó' },
  { value: '5', label: '5 - Rất khó' },
];

const formSchema = z.object({
  type: LearningItemTypeSchema,
  prompt: z.string().min(1, 'Nội dung cần học không được để trống'),
  answer: z.string().min(1, 'Đáp án / nghĩa không được để trống'),
  phonetic: z.string().optional().default(''),
  example: z.string().optional().default(''),
  exampleTranslation: z.string().optional().default(''),
  note: z.string().optional().default(''),
  partOfSpeech: z.string().optional().default(''),
  difficulty: z.coerce.number().int().min(1).max(5).default(3),
  tagsString: z.string().optional().default(''),
});

type FormValues = z.infer<typeof formSchema>;

export const LearningItemFormDialog: React.FC<LearningItemFormDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  deckId,
  initialData,
  isLoading = false,
}) => {
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues: {
      type: initialData?.type || 'vocabulary',
      prompt: initialData?.prompt || '',
      answer: initialData?.answer || '',
      phonetic: initialData?.phonetic || '',
      example: initialData?.example || '',
      exampleTranslation: initialData?.exampleTranslation || '',
      note: initialData?.note || '',
      partOfSpeech: initialData?.partOfSpeech || '',
      difficulty: initialData?.difficulty || 3,
      tagsString: initialData?.tags ? initialData.tags.join(', ') : '',
    },
  });

  React.useEffect(() => {
    let isMounted = true;
    if (isOpen) {
      Promise.resolve().then(() => {
        if (isMounted) {
          setServerError(null);
          reset({
            type: initialData?.type || 'vocabulary',
            prompt: initialData?.prompt || '',
            answer: initialData?.answer || '',
            phonetic: initialData?.phonetic || '',
            example: initialData?.example || '',
            exampleTranslation: initialData?.exampleTranslation || '',
            note: initialData?.note || '',
            partOfSpeech: initialData?.partOfSpeech || '',
            difficulty: initialData?.difficulty || 3,
            tagsString: initialData?.tags ? initialData.tags.join(', ') : '',
          });
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, initialData, reset]);

  const handleFormSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      const tags = (values.tagsString || '')
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      await onSubmit({
        deckId,
        type: values.type,
        prompt: values.prompt,
        answer: values.answer,
        phonetic: values.phonetic,
        example: values.example,
        exampleTranslation: values.exampleTranslation,
        note: values.note,
        partOfSpeech: values.partOfSpeech,
        difficulty: Number(values.difficulty) || 3,
        tags,
      });
      onClose();
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Không thể lưu mục học tập.');
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Chỉnh sửa mục học tập' : 'Thêm mục học tập mới'}
      description="Nhập từ vựng, cụm từ hoặc mẫu câu cùng nghĩa và ví dụ tương ứng."
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-3.5 pt-1 max-h-[75vh] overflow-y-auto pr-1">
        {serverError && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300">
            {serverError}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Select label="Loại mục *" options={TYPE_OPTIONS} {...register('type')} />
          <Select label="Độ khó" options={DIFFICULTY_OPTIONS} {...register('difficulty')} />
        </div>

        <Input
          label="Nội dung cần học (Prompt) *"
          placeholder="Ví dụ: Vocabulary, How are you doing?..."
          error={errors.prompt?.message}
          {...register('prompt')}
        />

        <Input
          label="Đáp án / Nghĩa (Answer) *"
          placeholder="Ví dụ: Từ vựng, Bạn khỏe không?..."
          error={errors.answer?.message}
          {...register('answer')}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input label="Phiên âm (Phonetic)" placeholder="/vəˈkæbjələri/" {...register('phonetic')} />
          <Input label="Từ loại (Part of speech)" placeholder="Danh từ, Động từ, Noun..." {...register('partOfSpeech')} />
        </div>

        <Textarea label="Ví dụ minh họa (Example)" placeholder="Ví dụ câu tiếng Anh..." rows={2} {...register('example')} />
        <Textarea label="Dịch ví dụ (Translation)" placeholder="Dịch câu ví dụ sang tiếng Việt..." rows={2} {...register('exampleTranslation')} />

        <Input label="Tags (phân cách bằng dấu phẩy)" placeholder="daily, essential, n5..." {...register('tagsString')} />
        <Textarea label="Ghi chú thêm (Note)" placeholder="Ghi chú ngữ pháp hoặc mẹo nhớ..." rows={2} {...register('note')} />

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800 sticky bottom-0 bg-slate-900">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            {initialData ? 'Lưu thay đổi' : 'Thêm mới'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
