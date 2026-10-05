import { QuestionImage, QuizQuestion } from '../../types';

/**
 * Standard Category and Difficulty Filter Options for Question Bank Workspace
 */
export const CATEGORY_OPTIONS = [
  'All',
  'World Cup',
  'AFCON',
  'Premier League',
  'Champions League',
  'International Football',
  'Ethiopian Football',
  'Players',
  'Clubs',
  'History',
  'General Football',
];

export const DIFFICULTY_OPTIONS = [
  'All',
  'Easy',
  'Medium',
  'Hard',
  'Expert',
];

// Production Enforcement: All active questions and image assets load 100% live from GCP PostgreSQL
export const INITIAL_IMAGE_LIBRARY: QuestionImage[] = [];
export const INITIAL_QUESTION_BANK: QuizQuestion[] = [];
