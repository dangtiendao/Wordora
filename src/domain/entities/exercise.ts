import { LearningItem } from './learning-item';
import { ExerciseType } from '../value-objects/types';

export interface BaseExercise {
  id: string;
  item: LearningItem;
  type: ExerciseType;
  prompt: string;
}

export interface MultipleChoiceExercise extends BaseExercise {
  type: 'multipleChoice';
  options: string[];
  correctIndex: number;
}

export interface FillBlankExercise extends BaseExercise {
  type: 'fillInBlank';
  sentenceWithBlank: string;
  correctAnswer: string;
  acceptableAnswers: string[];
}

export interface OrderToken {
  id: string; // Unique token ID (supports duplicate words in a sentence)
  text: string;
}

export interface SentenceOrderExercise extends BaseExercise {
  type: 'sentenceOrdering';
  originalSentence: string;
  tokens: OrderToken[]; // Shuffled tokens
  correctTokenSequence: string[]; // Ordered token IDs
}

export type Exercise = MultipleChoiceExercise | FillBlankExercise | SentenceOrderExercise;

export interface AnswerEvaluation {
  isCorrect: boolean;
  userChoice: string;
  correctAnswer: string;
  feedback: string;
}

export interface ExerciseResult {
  exerciseId: string;
  itemId: string;
  type: ExerciseType;
  prompt: string;
  userResponse: string;
  correctAnswer: string;
  isCorrect: boolean;
  responseTimeMs: number;
}
