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

interface QuizResultDetail {
  questionIndex: number;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

export function Quiz() {
  const [mode, setMode] = useState<'generate' | 'taking' | 'result' | 'review'>('generate');
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(15);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionTypes, setQuestionTypes] = useState<Set<string>>(new Set(['mcq']));
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quiz, setQuiz] = useState<{ id: string; content: QuizContent } | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<{ score: number; correctCount: number; totalQuestions: number; details: QuizResultDetail[] } | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || questionTypes.size === 0) return;

    setError('');
    setLoading(true);

    try {
      const quizData = await api.generateQuiz(topic, difficulty, title, numQuestions, Array.from(questionTypes));
      setQuiz(quizData);
      setAnswers({});
      setMode('taking');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Quiz generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quiz) return;

    setError('');
    setLoading(true);

    try {
      const questions = quiz.content.questions || [];
      const details: QuizResultDetail[] = questions.map((q, i) => ({
        questionIndex: i + 1,
        question: q.question,
        userAnswer: answers[i] || 'Not answered',
        correctAnswer: q.correctAnswer,
        isCorrect: answers[i] === q.correctAnswer,
      }));

      const correctCount = details.filter((d) => d.isCorrect).length;
      const score = (correctCount / questions.length) * 100;

      setResult({
        score,
        correctCount,
        totalQuestions: questions.length,
        details,
      });
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
    setNumQuestions(15);
    setDifficulty('medium');
    setQuestionTypes(new Set(['mcq']));
    setQuiz(null);
    setAnswers({});
    setResult(null);
    setCurrentQuestionIndex(0);
  };

  if (mode === 'generate') {
    return (
      <div className="flex flex-col h-full gap-4">
        <h2 className="text-base font-semibold text-slate-900">Create Quiz</h2>

        {error && (
          <div className="p-3 rounded-2xl bg-red-50 text-red-500 text-sm">{error}</div>
        )}

        <form onSubmit={handleGenerate} className="flex flex-col gap-4 flex-1">
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
            <label className="block text-sm font-medium mb-3">1. Number of Questions</label>
            <p className="text-xs text-slate-400 mb-3">How many questions do you want?</p>
            <div className="flex items-center gap-2 mb-3">
              <button
                type="button"
                onClick={() => setNumQuestions(Math.max(1, numQuestions - 1))}
                disabled={loading || numQuestions <= 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
              >
                −
              </button>
              <input
                type="number"
                value={numQuestions}
                onChange={(e) => setNumQuestions(Math.max(1, parseInt(e.target.value) || 1))}
                disabled={loading}
                className="w-12 h-8 text-center border border-slate-200 rounded-lg"
                min="1"
              />
              <button
                type="button"
                onClick={() => setNumQuestions(numQuestions + 1)}
                disabled={loading}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
              >
                +
              </button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {[5, 10, 15, 20, 25].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNumQuestions(n)}
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
            <label className="block text-sm font-medium mb-3">2. Difficulty level</label>
            <p className="text-xs text-slate-400 mb-3">Select the difficulty level</p>
            <div className="flex gap-2">
              {(['easy', 'medium', 'hard'] as const).map((level) => (
                <label
                  key={level}
                  className={`px-4 py-2 text-xs font-medium rounded-lg border cursor-pointer transition-colors ${
                    difficulty === level
                      ? level === 'easy'
                        ? 'bg-green-50 border-green-300 text-green-700'
                        : level === 'medium'
                        ? 'bg-blue-50 border-blue-500 text-white bg-blue-500'
                        : 'bg-red-50 border-red-300 text-red-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="difficulty"
                    value={level}
                    checked={difficulty === level}
                    onChange={() => setDifficulty(level)}
                    disabled={loading}
                    className="hidden"
                  />
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-3">3. Question Type</label>
            <p className="text-xs text-slate-400 mb-3">Select one or more question type</p>
            <div className="space-y-2">
              {[
                { id: 'mcq', label: 'Multiple Choice (MCQ)' },
                { id: 'truefalse', label: 'True / False' },
                { id: 'essay', label: 'Essay (Short Answer)' },
              ].map((type) => (
                <label key={type.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={questionTypes.has(type.id)}
                    onChange={(e) => {
                      const newTypes = new Set(questionTypes);
                      if (e.target.checked) {
                        newTypes.add(type.id);
                      } else {
                        newTypes.delete(type.id);
                      }
                      setQuestionTypes(newTypes);
                    }}
                    disabled={loading}
                    className="accent-blue-500"
                  />
                  <span className="text-sm text-slate-700">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-gradient w-full mt-auto"
            disabled={loading || !topic.trim() || questionTypes.size === 0}
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
    const questions = quiz.content.questions || [];
    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    return (
      <div className="flex flex-col h-full bg-slate-50">
        <header className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white">
          <button
            className="p-2 rounded-lg hover:bg-slate-100"
            aria-label="back"
            onClick={handleReset}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-900">
              Question {currentQuestionIndex + 1} / {questions.length}
            </span>
            <div className="text-sm text-slate-400">⏱ 08:42</div>
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
                What is the output of the following code?
              </p>
              <pre className="bg-slate-100 p-3 rounded-lg text-xs text-slate-700 overflow-x-auto">
                {`x = 5 ;\ny = 10 ;\nprint( x + y ? ) ;`}
              </pre>
            </div>

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
                    onChange={(e) =>
                      setAnswers((prev) => ({ ...prev, [currentQuestionIndex]: e.target.value }))
                    }
                    disabled={loading}
                    className="accent-blue-500"
                  />
                  <span className="text-sm font-medium text-slate-700">{option}</span>
                </label>
              ))}
            </div>
          </div>
        </main>

        <div className="flex gap-2 p-4 bg-white border-t border-slate-200">
          <button
            type="button"
            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
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
              onClick={handleSubmit}
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
              onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
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

  if (mode === 'result' && result) {
    const wrongAnswers = result.details.filter((d) => !d.isCorrect).slice(0, 2);

    return (
      <div className="flex flex-col h-full bg-slate-50">
        <header className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white">
          <button
            className="p-2 rounded-lg hover:bg-slate-100"
            aria-label="back"
            onClick={handleReset}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <h2 className="text-base font-semibold text-blue-500">Quiz Results</h2>

          <div className="w-6" />
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-md mx-auto space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-900 mb-1">Create Job!</h3>
              <p className="text-sm text-slate-500 mb-6">You completed the quiz</p>

              <div className="inline-flex items-center justify-center w-28 h-28 rounded-full border-4 border-blue-500 mb-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-slate-900">{result.correctCount} / {result.totalQuestions}</div>
                  <div className="text-sm text-slate-500">Correct</div>
                  <div className="text-2xl font-bold text-blue-500 mt-1">{result.score.toFixed(0)}%</div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-3">Review Summary</h4>
              <div className="space-y-2">
                {wrongAnswers.map((detail) => (
                  <div key={detail.questionIndex} className="card p-3">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center text-red-500 font-bold text-xs">
                        ✕
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-xs font-medium text-slate-900">Question {detail.questionIndex}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          <span className="text-red-500">Your Answer:</span> {detail.userAnswer}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          <span className="text-green-500">Correct Answer:</span> {detail.correctAnswer}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                className="btn btn-primary w-full"
                onClick={() => setMode('review')}
              >
                Review All Answers
              </button>
              <button
                type="button"
                className="btn border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 w-full"
                onClick={handleReset}
              >
                New Quiz
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (mode === 'review' && result) {
    return (
      <div className="flex flex-col h-full bg-slate-50">
        <header className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white">
          <button
            className="p-2 rounded-lg hover:bg-slate-100"
            aria-label="back"
            onClick={() => setMode('result')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <h2 className="text-base font-semibold text-slate-900">Answer Review</h2>

          <div className="w-6" />
        </header>

        <main className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {result.details.map((detail) => (
              <div
                key={detail.questionIndex}
                className={`card p-4 border-l-4 ${
                  detail.isCorrect ? 'border-l-green-500 bg-green-50' : 'border-l-red-500 bg-red-50'
                }`}
              >
                <div className="flex gap-3">
                  <div
                    className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-sm ${
                      detail.isCorrect
                        ? 'bg-green-100 text-green-500'
                        : 'bg-red-100 text-red-500'
                    }`}
                  >
                    {detail.isCorrect ? '✓' : '✕'}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-slate-900">Question {detail.questionIndex}</p>
                    <p className="text-xs text-slate-700 mt-2 mb-1">Your Answer: <span className={detail.isCorrect ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>{detail.userAnswer}</span></p>
                    <p className="text-xs text-slate-700">Correct Answer: <span className="text-green-600 font-medium">{detail.correctAnswer}</span></p>
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
            onClick={() => setMode('result')}
          >
            Return To Results
          </button>
        </div>
      </div>
    );
  }

  return null;
}
