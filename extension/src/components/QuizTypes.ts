export interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface QuizContent {
  questions: Question[];
}

export interface QuizResultDetail {
  questionIndex: number;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

export interface QuizResult {
  score: number;
  correctCount: number;
  totalQuestions: number;
  details: QuizResultDetail[];
}

export type GenMode = 'current-page' | 'enter-topic';
export type Mode = 'generate' | 'taking' | 'result' | 'review';
export type Difficulty = 'easy' | 'medium' | 'hard';
