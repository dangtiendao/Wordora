/**
 * Domain Value Objects and Enums for Wordora
 * Completely decoupled from UI, React, Next.js, and Dexie.
 */

export type LearningItemType = 'vocabulary' | 'phrase' | 'sentence';

export type ReviewStatus = 'new' | 'learning' | 'review' | 'mastered';

export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';

export type ExerciseType = 'multipleChoice' | 'fillInBlank' | 'sentenceOrdering';

export type SessionMode = 'flashcard' | 'quiz' | 'srsReview';
