import React from 'react';
import { CheckCircle, XCircle, ArrowLeft, ChevronLeft } from 'lucide-react';
import type { QuizResult as QuizResultType } from './QuizTypes';

interface QuizReviewProps {
  result: QuizResultType;
  onBack: () => void;
}

export function QuizReview({ result, onBack }: QuizReviewProps) {
  return (
    <div className="flex flex-col h-full bg-slate-50">
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white">
        <button
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="back"
          onClick={onBack}
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>

        <h2 className="text-base font-semibold text-slate-900 font-nunito">Answer Review</h2>

        <div className="w-9" />
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        <div className="max-w-lg mx-auto space-y-3 animate-fade-slide-up">
          {result.details.map((detail) => (
            <div
              key={detail.questionIndex}
              className={`glass3d rounded-2xl p-5 transition-all ${
                detail.isCorrect
                  ? 'shadow-emerald-500/5'
                  : 'shadow-red-500/5'
              }`}
            >
              <div className="flex gap-4">
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center shadow-lg ${
                    detail.isCorrect
                      ? 'bg-gradient-to-br from-emerald-500 to-green-400 shadow-emerald-500/20'
                      : 'bg-gradient-to-br from-red-500 to-rose-400 shadow-red-500/20'
                  }`}
                >
                  {detail.isCorrect
                    ? <CheckCircle className="w-4 h-4 text-white" />
                    : <XCircle className="w-4 h-4 text-white" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-900 font-nunito mb-1">Question {detail.questionIndex}</p>
                  <p className="text-sm text-slate-700 mb-3 font-nunito">{detail.question}</p>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
                    <span className="text-slate-500 font-nunito">
                      Your answer:{' '}
                      <span className={detail.isCorrect ? 'text-emerald-600 font-medium' : 'text-red-600 font-medium'}>
                        {detail.userAnswer}
                      </span>
                    </span>
                    {!detail.isCorrect && (
                      <span className="text-slate-500 font-nunito">
                        Correct answer:{' '}
                        <span className="text-emerald-600 font-medium">{detail.correctAnswer}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <div className="p-4 bg-white border-t border-slate-200">
        <button
          type="button"
          className="btn btn-primary w-full"
          onClick={onBack}
        >
          <ChevronLeft className="w-4 h-4" />
          Return To Results
        </button>
      </div>
    </div>
  );
}