import React, { useState } from 'react';
import { api } from '../utils/api';
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

  if (mode === 'generate') {
    return (
      <div>
        <h2 className="text-base font-semibold mb-4 text-slate-900">Generate Quiz</h2>

        {error && (
          <div className="mb-3 p-3 rounded-2xl bg-red-50 text-red-500 text-sm">{error}</div>
        )}

        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Topic *</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., JavaScript Arrays"
              required
              disabled={loading}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Title (optional)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Midterm Review"
              disabled={loading}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              disabled={loading}
              className="input"
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
    );
  }

  if (mode === 'taking' && quiz) {
    return (
      <div>
        <h2 className="text-base font-semibold mb-4 text-slate-900">
          {quiz.content.questions?.length || 0} Questions
        </h2>

        {error && (
          <div className="mb-3 p-3 rounded-2xl bg-red-50 text-red-500 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {quiz.content.questions?.map((q, i) => (
            <div key={i} className="card p-4">
              <p className="font-semibold mb-2 text-sm">
                {i + 1}. {q.question}
              </p>
              <div className="space-y-2">
                {q.options?.map((option, j) => (
                  <label
                    key={j}
                    className="flex items-center gap-2 cursor-pointer text-sm hover:text-blue-600 transition-colors"
                  >
                    <input
                      type="radio"
                      name={`q${i}`}
                      value={option}
                      checked={answers[i] === option}
                      onChange={(e) =>
                        setAnswers((prev) => ({ ...prev, [i]: e.target.value }))
                      }
                      disabled={loading}
                      className="accent-blue-500"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <div className="flex gap-2 mt-4">
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
              className="btn border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              onClick={handleReset}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (mode === 'result' && result) {
    return (
      <div className="text-center">
        <h2 className="text-3xl font-semibold mb-4 text-blue-500">
          {result.score.toFixed(0)}%
        </h2>
        <p className="text-base mb-2 text-slate-700">
          {result.correctCount} out of {result.totalQuestions} correct
        </p>
        <button
          type="button"
          className="btn btn-primary mt-4"
          onClick={handleReset}
        >
          Generate New Quiz
        </button>
      </div>
    );
  }

  return null;
}
