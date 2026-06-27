import React from 'react';
import { CheckCircle, XCircle, RotateCcw, ArrowLeft, Award, TrendingUp, BookOpen } from 'lucide-react';
import type { QuizResult as QuizResultType } from './QuizTypes';

interface QuizResultProps {
  result: QuizResultType;
  onReview: () => void;
  onReset: () => void;
}

export function QuizResult({ result, onReview, onReset }: QuizResultProps) {
  const wrongAnswers = result.details.filter((d) => !d.isCorrect).slice(0, 2);
  const percentage = result.score.toFixed(0);
  const isPassing = result.score >= 70;

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white">
        <button
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="back"
          onClick={onReset}
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>

        <h2 className="text-base font-semibold text-slate-900 font-nunito">Quiz Results</h2>

        <div className="w-9" />
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        <div className="max-w-lg mx-auto space-y-4 animate-fade-slide-up">

          <div className="glass3d rounded-3xl p-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                isPassing
                  ? 'bg-gradient-to-br from-emerald-500 to-green-400 shadow-emerald-500/20'
                  : 'bg-gradient-to-br from-amber-500 to-orange-400 shadow-amber-500/20'
              }`}>
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 font-nunito">
                  {isPassing ? 'Great Job!' : 'Keep Practicing!'}
                </h3>
                <p className="text-xs text-slate-400 font-nunito">You completed the quiz</p>
              </div>
            </div>

            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-emerald-400 shadow-lg shadow-blue-500/20 mb-4">
              <div className="w-28 h-28 rounded-full bg-white dark:bg-slate-800 flex flex-col items-center justify-center">
                <div className="text-2xl font-bold text-slate-900">{result.correctCount}/{result.totalQuestions}</div>
                <div className="text-xs text-slate-400 font-nunito">Correct</div>
                <div className={`text-xl font-bold mt-0.5 ${isPassing ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {percentage}%
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span className="text-slate-600 font-nunito">{result.correctCount} correct</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-400" />
                <span className="text-slate-600 font-nunito">{result.totalQuestions - result.correctCount} wrong</span>
              </div>
            </div>
          </div>

          {wrongAnswers.length > 0 && (
            <div className="glass3d rounded-3xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-4 h-4 text-blue-500" />
                <h4 className="text-sm font-semibold text-slate-900 font-nunito">Review Summary</h4>
              </div>
              <div className="space-y-3">
                {wrongAnswers.map((detail) => (
                  <div key={detail.questionIndex} className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 dark:bg-red-800 flex items-center justify-center">
                        <XCircle className="w-4 h-4 text-red-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-900 font-nunito mb-1">Question {detail.questionIndex}</p>
                        <p className="text-xs text-red-600 font-nunito">
                          Your answer: <span className="line-through">{detail.userAnswer}</span>
                        </p>
                        <p className="text-xs text-emerald-600 font-nunito mt-0.5">
                          Correct: {detail.correctAnswer}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.score === 100 && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
              <TrendingUp className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <p className="text-sm text-emerald-700 dark:text-emerald-300 font-nunito">Perfect score! You've mastered this topic.</p>
            </div>
          )}

          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={onReview}
              className="btn btn-primary w-full"
            >
              <BookOpen className="w-4 h-4" />
              Review All Answers
            </button>
            <button
              type="button"
              onClick={onReset}
              className="btn border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 w-full"
            >
              <RotateCcw className="w-4 h-4" />
              New Quiz
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}