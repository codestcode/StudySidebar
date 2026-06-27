import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { QuizContent } from './QuizTypes';

interface QuizTakingProps {
  quiz: { id: string; content: QuizContent };
  answers: Record<number, string>;
  onAnswerChange: (questionIndex: number, answer: string) => void;
  currentQuestionIndex: number;
  onPrevQuestion: () => void;
  onNextQuestion: () => void;
  onSubmit: () => void;
  onReset: () => void;
  loading: boolean;
  error: string;
}

export function QuizTaking({
  quiz, answers, onAnswerChange,
  currentQuestionIndex, onPrevQuestion, onNextQuestion,
  onSubmit, onReset,
  loading, error,
}: QuizTakingProps) {
  const questions = quiz.content.questions || [];

  if (!questions.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 bg-slate-50">
        <div className="glass3d rounded-3xl p-8 max-w-sm text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No questions generated</h3>
          <p className="text-sm text-slate-500 mb-4">The AI couldn't generate valid questions. Try different options or a different topic.</p>
          <button type="button" onClick={onReset} className="btn btn-primary">Try Again</button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const isEssay = !currentQuestion?.options?.length;

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white">
        <button
          className="p-2 rounded-lg hover:bg-slate-100"
          aria-label="back"
          onClick={onReset}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-900">
            Question {currentQuestionIndex + 1} / {questions.length}
          </span>
        </div>

        <div className="w-6" />
      </header>

      <div className="px-4 py-3 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-xs text-slate-500">{Math.round(progress)}% complete</span>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-4">
          <div className="card p-4">
            <p className="text-sm font-medium text-slate-900 mb-3">
              {currentQuestion?.question || 'Loading question...'}
            </p>
          </div>

          {isEssay ? (
            <div className="space-y-2">
              <textarea
                value={answers[currentQuestionIndex] || ''}
                onChange={(e) => onAnswerChange(currentQuestionIndex, e.target.value)}
                disabled={loading}
                placeholder="Type your answer here..."
                className="w-full min-h-[120px] p-3 rounded-xl border-2 border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none resize-y"
                rows={4}
              />
            </div>
          ) : (
            <div className="space-y-2">
              {currentQuestion?.options?.map((option, j) => (
                <label
                  key={j}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    answers[currentQuestionIndex] === option
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="current-question"
                    value={option}
                    checked={answers[currentQuestionIndex] === option}
                    onChange={(e) => onAnswerChange(currentQuestionIndex, e.target.value)}
                    disabled={loading}
                    className="accent-blue-500"
                  />
                  <span className="text-sm font-medium text-slate-700">{option}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </main>

      <div className="flex gap-2 p-4 bg-white border-t border-slate-200">
        <button
          type="button"
          onClick={onPrevQuestion}
          disabled={currentQuestionIndex === 0 || loading}
          className="btn border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Previous
        </button>

        {currentQuestionIndex === questions.length - 1 ? (
          <button
            type="button"
            onClick={onSubmit}
            disabled={loading}
            className="btn btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              'Submit'
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={onNextQuestion}
            disabled={loading}
            className="btn btn-primary flex-1 flex items-center justify-center gap-2"
          >
            Next
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>

      {error && (
        <div className="mx-4 mb-4 p-3 rounded-2xl bg-red-50 text-red-500 text-sm">{error}</div>
      )}
    </div>
  );
}