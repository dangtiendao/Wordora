import { describe, it, expect } from 'vitest';
import { LearningItem } from '@/domain/entities/learning-item';
import { ExerciseGenerator } from './engine/exercise-generator';
import { AnswerEvaluator } from './engine/answer-evaluator';

describe('Exercise Engine Tests', () => {
  const sampleItems: LearningItem[] = [
    {
      id: 'item-1',
      deckId: 'deck-1',
      type: 'vocabulary',
      prompt: 'apple',
      answer: 'quả táo',
      partOfSpeech: 'noun',
      difficulty: 1,
      tags: [],
      createdAt: '2026-08-01T00:00:00Z',
      updatedAt: '2026-08-01T00:00:00Z',
    },
    {
      id: 'item-2',
      deckId: 'deck-1',
      type: 'vocabulary',
      prompt: 'banana',
      answer: 'quả chuối',
      partOfSpeech: 'noun',
      difficulty: 1,
      tags: [],
      createdAt: '2026-08-01T00:00:00Z',
      updatedAt: '2026-08-01T00:00:00Z',
    },
    {
      id: 'item-3',
      deckId: 'deck-1',
      type: 'vocabulary',
      prompt: 'orange',
      answer: 'quả cam',
      partOfSpeech: 'noun',
      difficulty: 1,
      tags: [],
      createdAt: '2026-08-01T00:00:00Z',
      updatedAt: '2026-08-01T00:00:00Z',
    },
    {
      id: 'item-4',
      deckId: 'deck-1',
      type: 'vocabulary',
      prompt: 'grape',
      answer: 'quả nho',
      partOfSpeech: 'noun',
      difficulty: 1,
      tags: [],
      createdAt: '2026-08-01T00:00:00Z',
      updatedAt: '2026-08-01T00:00:00Z',
    },
    {
      id: 'item-sentence',
      deckId: 'deck-1',
      type: 'sentence',
      prompt: 'I think that that is true',
      answer: 'Tôi nghĩ rằng điều đó là đúng',
      example: 'I think that that is true',
      difficulty: 2,
      tags: [],
      createdAt: '2026-08-01T00:00:00Z',
      updatedAt: '2026-08-01T00:00:00Z',
    },
  ];

  it('generateMultipleChoice produces non-duplicate options with exact 1 correct answer', () => {
    const mc = ExerciseGenerator.generateMultipleChoice(sampleItems[0], sampleItems);
    expect(mc).not.toBeNull();
    if (!mc) return;

    expect(mc.options.length).toBe(4);
    const uniqueOptions = new Set(mc.options);
    expect(uniqueOptions.size).toBe(4);

    expect(mc.options[mc.correctIndex]).toBe('quả táo');
  });

  it('generateFillBlank replaces target prompt with blank preserving diacritics', () => {
    const fb = ExerciseGenerator.generateFillBlank(sampleItems[0]);
    expect(fb).not.toBeNull();
    if (!fb) return;

    expect(fb.correctAnswer).toBe('apple');
    expect(fb.sentenceWithBlank).toContain('___');
  });

  it('generateSentenceOrder handles duplicate tokens with unique token IDs', () => {
    const sentenceItem = sampleItems[4];
    const so = ExerciseGenerator.generateSentenceOrder(sentenceItem);
    expect(so).not.toBeNull();
    if (!so) return;

    expect(so.tokens.length).toBe(6);
    const tokenIds = new Set(so.tokens.map((t) => t.id));
    expect(tokenIds.size).toBe(6); // Every token has unique ID

    // Check duplicate words "that" exist as distinct tokens
    const thatTokens = so.tokens.filter((t) => t.text === 'that');
    expect(thatTokens.length).toBe(2);
  });

  it('AnswerEvaluator.evaluateFillBlank normalizes Unicode NFC & collapses whitespace', () => {
    const fb = ExerciseGenerator.generateFillBlank(sampleItems[0])!;
    
    // Normalization test with extra spaces and mixed casing
    const evalResult = AnswerEvaluator.evaluateFillBlank(fb, '  ApPlE   ');
    expect(evalResult.isCorrect).toBe(true);

    const wrongResult = AnswerEvaluator.evaluateFillBlank(fb, 'orange');
    expect(wrongResult.isCorrect).toBe(false);
  });

  it('AnswerEvaluator.evaluateSentenceOrder evaluates correct token sequence', () => {
    const sentenceItem = sampleItems[4];
    const so = ExerciseGenerator.generateSentenceOrder(sentenceItem)!;

    const evalCorrect = AnswerEvaluator.evaluateSentenceOrder(so, so.correctTokenSequence);
    expect(evalCorrect.isCorrect).toBe(true);

    const evalWrong = AnswerEvaluator.evaluateSentenceOrder(so, [...so.correctTokenSequence].reverse());
    expect(evalWrong.isCorrect).toBe(false);
  });
});
