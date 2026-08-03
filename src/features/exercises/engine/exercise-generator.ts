import { LearningItem } from '@/domain/entities/learning-item';
import {
  MultipleChoiceExercise,
  FillBlankExercise,
  SentenceOrderExercise,
  OrderToken,
} from '@/domain/entities/exercise';
import { generateUUID } from '@/lib/uuid';

export class ExerciseGenerator {
  /**
   * Generates a Multiple Choice exercise.
   */
  static generateMultipleChoice(
    item: LearningItem,
    candidatePool: LearningItem[],
    randomizer: () => number = Math.random
  ): MultipleChoiceExercise | null {
    const correctAnswer = item.answer.trim();
    if (!correctAnswer) return null;

    // Filter potential distractors from candidate pool
    const candidates = candidatePool.filter(
      (c) =>
        c.id !== item.id &&
        c.answer.trim().length > 0 &&
        c.answer.trim().toLowerCase() !== correctAnswer.toLowerCase()
    );

    // Prioritize candidates matching item type & partOfSpeech
    candidates.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;
      if (a.type === item.type) scoreA += 2;
      if (b.type === item.type) scoreB += 2;
      if (a.partOfSpeech && a.partOfSpeech === item.partOfSpeech) scoreA += 1;
      if (b.partOfSpeech && b.partOfSpeech === item.partOfSpeech) scoreB += 1;
      return scoreB - scoreA;
    });

    // Select up to 3 unique distractor texts
    const distractors: string[] = [];
    const usedTexts = new Set<string>([correctAnswer.toLowerCase()]);

    for (const cand of candidates) {
      const text = cand.answer.trim();
      const lower = text.toLowerCase();
      if (!usedTexts.has(lower)) {
        usedTexts.add(lower);
        distractors.push(text);
        if (distractors.length >= 3) break;
      }
    }

    // Require at least 1 distractor for a valid multiple choice
    if (distractors.length === 0) return null;

    const allOptions = [correctAnswer, ...distractors];

    // Fisher-Yates Shuffle
    for (let i = allOptions.length - 1; i > 0; i--) {
      const j = Math.floor(randomizer() * (i + 1));
      [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
    }

    const correctIndex = allOptions.indexOf(correctAnswer);

    return {
      id: generateUUID(),
      item,
      type: 'multipleChoice',
      prompt: `Nghĩa của từ / cụm từ "${item.prompt}" là gì?`,
      options: allOptions,
      correctIndex,
    };
  }

  /**
   * Generates a Fill-in-the-Blank exercise.
   */
  static generateFillBlank(item: LearningItem): FillBlankExercise | null {
    const targetWord = item.prompt.trim();
    if (!targetWord) return null;

    let sentenceWithBlank = '';
    const sampleText = item.example?.trim() || '';

    // If an example sentence contains the prompt word, replace it with blank ___
    if (sampleText && sampleText.toLowerCase().includes(targetWord.toLowerCase())) {
      const regex = new RegExp(targetWord, 'gi');
      sentenceWithBlank = sampleText.replace(regex, '___');
    } else {
      sentenceWithBlank = `Điền từ thích hợp vào chỗ trống để dịch: "${item.answer}" ➔ ___`;
    }

    return {
      id: generateUUID(),
      item,
      type: 'fillInBlank',
      prompt: 'Điền từ / cụm từ còn thiếu:',
      sentenceWithBlank,
      correctAnswer: targetWord,
      acceptableAnswers: [targetWord],
    };
  }

  /**
   * Generates a Sentence Order exercise.
   */
  static generateSentenceOrder(
    item: LearningItem,
    randomizer: () => number = Math.random
  ): SentenceOrderExercise | null {
    // Sentence order works best on sentences or multi-word phrases
    const sourceText = (item.example || item.prompt).trim();
    if (!sourceText || sourceText.split(/\s+/).length < 2) {
      return null;
    }

    // Smart Tokenizer: splits words while handling basic space boundaries
    const rawTokens = sourceText.split(/\s+/).filter((t) => t.length > 0);
    if (rawTokens.length < 2) return null;

    const correctTokenSequence: string[] = [];
    const tokens: OrderToken[] = rawTokens.map((text, idx) => {
      const id = `token-${idx}-${generateUUID().slice(0, 4)}`;
      correctTokenSequence.push(id);
      return { id, text };
    });

    // Shuffled copy of tokens
    const shuffledTokens = [...tokens];
    for (let i = shuffledTokens.length - 1; i > 0; i--) {
      const j = Math.floor(randomizer() * (i + 1));
      [shuffledTokens[i], shuffledTokens[j]] = [shuffledTokens[j], shuffledTokens[i]];
    }

    return {
      id: generateUUID(),
      item,
      type: 'sentenceOrdering',
      prompt: `Sắp xếp các từ thành câu đúng (Nghĩa: "${item.exampleTranslation || item.answer}"):`,
      originalSentence: sourceText,
      tokens: shuffledTokens,
      correctTokenSequence,
    };
  }
}
