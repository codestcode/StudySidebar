import React from 'react';
import { Sparkles, Loader2, Check, RotateCcw, Globe, FileText, AlertTriangle } from 'lucide-react';
import type { GenMode, Difficulty } from './QuizTypes';

interface QuizGenerateProps {
  genMode: GenMode;
  onGenModeChange: (mode: GenMode) => void;
  content: string;
  pageTitle: string;
  readingPage: boolean;
  pageRead: boolean;
  topic: string;
  onTopicChange: (topic: string) => void;
  numQuestions: number;
  onNumQuestionsChange: (n: number) => void;
  difficulty: Difficulty;
  onDifficultyChange: (d: Difficulty) => void;
  questionTypes: Set<string>;
  onQuestionTypesChange: (types: Set<string>) => void;
  loading: boolean;
  error: string;
  onGenerate: (e: React.FormEvent) => void;
  onRefreshPage: () => void;
}

export function QuizGenerate({
  genMode, onGenModeChange,
  content, pageTitle, readingPage, pageRead,
  topic, onTopicChange,
  numQuestions, onNumQuestionsChange,
  difficulty, onDifficultyChange,
  questionTypes, onQuestionTypesChange,
  loading, error,
  onGenerate, onRefreshPage,
}: QuizGenerateProps) {
  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="max-w-lg mx-auto space-y-4">

        {error && !readingPage && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-500 dark:text-red-400 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        <div className="glass3d rounded-3xl p-6 animate-fade-slide-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-blue-500/20 overflow-hidden">
              <img src="/images/brain.png" alt="" className="w-6 h-6 object-contain" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white font-nunito">Create Quiz</h2>
              <p className="text-xs text-slate-400 font-nunito">Generate custom quizzes on any topic</p>
            </div>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => onGenModeChange('current-page')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-xl border-2 transition-all ${
                genMode === 'current-page'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <Globe className="w-4 h-4" />
                From Current Page
              </span>
            </button>
            <button
              type="button"
              onClick={() => onGenModeChange('enter-topic')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-xl border-2 transition-all ${
                genMode === 'enter-topic'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                Enter Topic
              </span>
            </button>
          </div>

          <form onSubmit={onGenerate} className="space-y-5">
            {genMode === 'current-page' ? (
              <>
                {readingPage ? (
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 font-nunito">Reading page content...</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-nunito">Extracting text from the current tab</p>
                    </div>
                  </div>
                ) : pageRead ? (
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 font-nunito">Page content loaded</p>
                      <p className="text-xs text-emerald-500 dark:text-emerald-400 font-nunito truncate">{pageTitle} — {content.length.toLocaleString()} chars</p>
                    </div>
                    <button
                      type="button"
                      onClick={onRefreshPage}
                      disabled={readingPage}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-800 hover:bg-emerald-200 dark:hover:bg-emerald-700 text-xs text-emerald-700 dark:text-emerald-300 font-medium transition-colors disabled:opacity-50 flex-shrink-0"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Refresh
                    </button>
                  </div>
                ) : null}
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Topic *</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => onTopicChange(e.target.value)}
                  placeholder="e.g., JavaScript Arrays"
                  required
                  disabled={loading}
                  className="input"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Number of Questions</label>
              <div className="flex items-center gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => onNumQuestionsChange(Math.max(1, numQuestions - 1))}
                  disabled={loading || numQuestions <= 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40"
                >
                  −
                </button>
                <input
                  type="number"
                  value={numQuestions}
                  onChange={(e) => onNumQuestionsChange(Math.max(1, parseInt(e.target.value) || 1))}
                  disabled={loading}
                  className="w-14 h-8 text-center border border-slate-200 rounded-lg text-sm"
                  min="1"
                />
                <button
                  type="button"
                  onClick={() => onNumQuestionsChange(numQuestions + 1)}
                  disabled={loading}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40"
                >
                  +
                </button>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[5, 10, 15, 20, 25].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => onNumQuestionsChange(n)}
                    disabled={loading}
                    className={`w-10 h-8 text-xs rounded-lg border transition-colors ${
                      numQuestions === n
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Difficulty level</label>
              <div className="flex gap-2">
                {(['easy', 'medium', 'hard'] as const).map((level) => (
                  <label
                    key={level}
                    className={`flex-1 px-3 py-2.5 text-xs font-medium rounded-xl border-2 cursor-pointer transition-all text-center ${
                      difficulty === level
                        ? level === 'easy'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : level === 'medium'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-red-500 bg-red-50 text-red-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="difficulty"
                      value={level}
                      checked={difficulty === level}
                      onChange={() => onDifficultyChange(level)}
                      disabled={loading}
                      className="hidden"
                    />
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Question Type</label>
              <div className="space-y-2">
                {[
                  { id: 'mcq', label: 'Multiple Choice (MCQ)' },
                  { id: 'truefalse', label: 'True / False' },
                  { id: 'essay', label: 'Essay (Short Answer)' },
                ].map((type) => (
                  <label key={type.id} className="flex items-center gap-3 p-3 rounded-xl border-2 border-slate-200 bg-white cursor-pointer hover:border-slate-300 transition-colors">
                    <input
                      type="checkbox"
                      checked={questionTypes.has(type.id)}
                      onChange={(e) => {
                        const newTypes = new Set(questionTypes);
                        if (e.target.checked) newTypes.add(type.id);
                        else newTypes.delete(type.id);
                        onQuestionTypesChange(newTypes);
                      }}
                      disabled={loading}
                      className="accent-blue-500 w-4 h-4"
                    />
                    <span className="text-sm text-slate-700">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white text-sm font-semibold shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98] disabled:opacity-50"
              disabled={
                loading ||
                (genMode === 'enter-topic' && !topic.trim()) ||
                (genMode === 'current-page' && !content) ||
                questionTypes.size === 0 ||
                readingPage
              }
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Generating...
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Generate Quiz
                </span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}