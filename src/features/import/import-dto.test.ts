import { describe, it, expect } from 'vitest';
import { LearningItemImportDTOSchema } from './schemas/learning-item-import-dto';
import { normalizeTags } from '@/features/learning-items/application/learning-item-use-cases';

describe('LearningItemImportDTO Schema Validation', () => {
  it('validates a valid import row and normalizes tags', () => {
    const rawRow = {
      type: 'vocabulary',
      prompt: '  hello  ',
      answer: '  xin chào  ',
      phonetic: '/həˈloʊ/',
      difficulty: '2',
      tags: 'greeting, daily , greeting, ',
    };

    const parsed = LearningItemImportDTOSchema.parse(rawRow);

    expect(parsed.prompt).toBe('  hello  ');
    expect(parsed.answer).toBe('  xin chào  ');
    expect(parsed.difficulty).toBe(2);
    expect(parsed.tags).toEqual(['greeting', 'daily']);
  });

  it('defaults missing optional fields cleanly', () => {
    const minRow = {
      prompt: 'apple',
      answer: 'quả táo',
    };

    const parsed = LearningItemImportDTOSchema.parse(minRow);

    expect(parsed.type).toBe('vocabulary');
    expect(parsed.difficulty).toBe(3);
    expect(parsed.phonetic).toBe('');
    expect(parsed.tags).toEqual([]);
  });

  it('rejects row missing prompt or answer', () => {
    const invalidRow = {
      type: 'vocabulary',
      prompt: '',
      answer: 'quả táo',
    };

    expect(LearningItemImportDTOSchema.safeParse(invalidRow).success).toBe(false);
  });

  it('normalizeTags handles array and string input with trim and deduplication', () => {
    expect(normalizeTags(['  tag1 ', 'tag2', 'tag1', ''])).toEqual(['tag1', 'tag2']);
    expect(normalizeTags(' apple, banana , apple, ')).toEqual(['apple', 'banana']);
  });
});
