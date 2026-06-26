import React, { useState } from 'react';
import { api } from '../utils/api';
import { Sparkles, ArrowLeft, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import '../styles.css';

interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
}

interface QuizContent {
  questions: Question[];
}

export function Quiz() {
  const [mode, setMode] = useState<'generate' | 'taking' | 'result'>('generate');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quiz, setQuiz] = useState<{ id: string; content: QuizContent } | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<{ score: number; correctCount: number; totalQuestions: number } | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setError('');
    setLoading(true);

    try {
      const quizData = await api.generateQuiz(topic, difficulty, title);
      setQuiz(quizData);
      setAnswers({});
      setMode('taking');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Quiz generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quiz) return;

    setError('');
    setLoading(true);

    try {
      const answersArray = Object.entries(answers).map(([index, selected]) => ({
        questionIndex: parseInt(index),
        selectedAnswer: selected,
      }));

      const resultData = await api.submitQuizAnswers(quiz.id, answersArray);
      setResult(resultData);
      setMode('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submit failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMode('generate');
    setTopic('');
    setTitle('');
    setQuiz(null);
    setAnswers({});
    setResult(null);
  };

  return (
    <div className="h-full overflow-y-auto p-4">
      {error && (
        <div className="mb-4 p-3 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-500 dark:text-red-400 text-sm">{error}</div>
      )}

      {mode === 'generate' && (
        <div className="max-w-lg mx-auto">
          <div className="glass3d rounded-3xl p-6 animate-fade-slide-up">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white font-nunito">Generate Quiz</h2>
                <p className="text-xs text-slate-400 font-nunito">Create a quiz on any topic</p>
              </div>
            </div>

            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300 font-nunito">Topic *</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., JavaScript Arrays"
                  required
                  disabled={loading}
                  className="input dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300 font-nunito">Title (optional)</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Midterm Review"
                  disabled={loading}
                  className="input dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300 font-nunito">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  disabled={loading}
                  className="input dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={loading}
                onClick={handleGenerate}
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  'Generate Quiz'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {mode === 'taking' && quiz && (
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white font-nunito">
                {quiz.content.questions?.length || 0} Questions
              </h2>
              <p className="text-xs text-slate-400 font-nunito">Select the best answer for each</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {quiz.content.questions?.map((q, i) => (
              <div key={i} className="glass3d rounded-2xl p-4 animate-fade-slide-up">
                <p className="font-semibold mb-3 text-sm text-slate-800 dark:text-slate-100 font-nunito">
                  {i + 1}. {q.question}
                </p>
                <div className="space-y-2">
                  {q.options?.map((option, j) => {
                    const isSelected = answers[i] === option;
                    return (
                      <label
                        key={j}
                        className={`flex items-center gap-3 cursor-pointer p-3 rounded-xl transition-all ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700'
                            : 'bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q${i}`}
                          value={option}
                          checked={isSelected}
                          onChange={(e) =>
                            setAnswers((prev) => ({ ...prev, [i]: e.target.value }))
                          }
                          disabled={loading}
                          className="w-4 h-4 accent-blue-500"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-200 font-nunito">{option}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="flex gap-2 mt-6">
              <button
                type="submit"
                className="btn btn-primary flex-1"
                disabled={loading}
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  'Submit Quiz'
                )}
              </button>
              <button
                type="button"
                className="btn border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600"
                onClick={handleReset}
                disabled={loading}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {mode === 'result' && result && (
        <div className="max-w-lg mx-auto">
          <div className="glass3d rounded-3xl p-8 text-center animate-fade-slide-up">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-500/20">
              {result.score >= 70 ? (
                <CheckCircle className="w-10 h-10 text-white" />
              ) : (
                <XCircle className="w-10 h-10 text-white" />
              )}
            </div>
            <h2 className="text-4xl font-bold mb-2 text-blue-500 font-nunito">
              {result.score.toFixed(0)}%
            </h2>
            <p className="text-base mb-6 text-slate-600 dark:text-slate-300 font-nunito">
              {result.correctCount} out of {result.totalQuestions} correct
            </p>
            <button
              type="button"
              className="btn btn-primary w-full"
              onClick={handleReset}
            >
              Generate New Quiz
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
