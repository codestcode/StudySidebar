import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import type { GenMode, Difficulty, QuizContent, QuizResult } from './QuizTypes';
import { QuizGenerate } from './QuizGenerate';
import { QuizTaking } from './QuizTaking';
import { QuizResult as QuizResultComponent } from './QuizResult';
import { QuizReview } from './QuizReview';

export function Quiz() {
  const [mode, setMode] = useState<'generate' | 'taking' | 'result' | 'review'>('generate');
  const [genMode, setGenMode] = useState<GenMode>('current-page');

  const [content, setContent] = useState('');
  const [pageTitle, setPageTitle] = useState('');

  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [questionTypes, setQuestionTypes] = useState<Set<string>>(new Set(['mcq']));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quiz, setQuiz] = useState<{ id: string; content: QuizContent } | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const handleContextLoaded = (ctx: any) => {
    setContent(ctx.content);
    setPageTitle(ctx.title);
    setError('');
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (genMode === 'enter-topic') {
      if (!topic.trim() || questionTypes.size === 0) return;
    } else {
      if (!content.trim() || questionTypes.size === 0) return;
    }

    setError('');
    setLoading(true);

    try {
      const quizData = await api.generateQuiz(
        genMode === 'enter-topic' ? topic : pageTitle || 'Untitled',
        difficulty,
        '',
        numQuestions,
        Array.from(questionTypes),
        genMode === 'current-page' ? content : undefined
      );
      console.log('Quiz API response:', quizData);
      console.log('Quiz questions:', quizData?.content?.questions);
      setQuiz(quizData);
      setAnswers({});
      setCurrentQuestionIndex(0);
      setMode('taking');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Quiz generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!quiz) return;

    setError('');
    setLoading(true);

    try {
      const questions = quiz.content.questions || [];
      const details = questions.map((q, i) => ({
        questionIndex: i + 1,
        question: q.question,
        userAnswer: answers[i] || 'Not answered',
        correctAnswer: q.correctAnswer,
        isCorrect: answers[i] === q.correctAnswer,
      }));

      const correctCount = details.filter((d) => d.isCorrect).length;
      const score = (correctCount / questions.length) * 100;

      try {
        await api.trackQuizResult(score);
      } catch (e) {
        console.error('Failed to track quiz result:', e);
      }

      setResult({ score, correctCount, totalQuestions: questions.length, details });
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
    setNumQuestions(5);
    setDifficulty('medium');
    setQuestionTypes(new Set(['mcq']));
    setQuiz(null);
    setAnswers({});
    setResult(null);
    setCurrentQuestionIndex(0);
    setContent('');
    setGenMode('current-page');
  };

  if (mode === 'generate') {
    return (
      <QuizGenerate
        genMode={genMode}
        onGenModeChange={setGenMode}
        content={content}
        pageTitle={pageTitle}
        topic={topic}
        onTopicChange={setTopic}
        numQuestions={numQuestions}
        onNumQuestionsChange={setNumQuestions}
        difficulty={difficulty}
        onDifficultyChange={setDifficulty}
        questionTypes={questionTypes}
        onQuestionTypesChange={setQuestionTypes}
        loading={loading}
        error={error}
        onGenerate={handleGenerate}
        onContextLoaded={handleContextLoaded}
        onError={setError}
      />
    );
  }

  if (mode === 'taking' && quiz) {
    return (
      <QuizTaking
        quiz={quiz}
        answers={answers}
        onAnswerChange={(i, v) => setAnswers((prev) => ({ ...prev, [i]: v }))}
        currentQuestionIndex={currentQuestionIndex}
        onPrevQuestion={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
        onNextQuestion={() => setCurrentQuestionIndex(Math.min((quiz.content.questions?.length || 1) - 1, currentQuestionIndex + 1))}
        onSubmit={handleSubmit}
        onReset={handleReset}
        loading={loading}
        error={error}
      />
    );
  }

  if (mode === 'result' && result) {
    return (
      <QuizResultComponent
        result={result}
        onReview={() => setMode('review')}
        onReset={handleReset}
      />
    );
  }

  if (mode === 'review' && result) {
    return (
      <QuizReview
        result={result}
        onBack={() => setMode('result')}
      />
    );
  }

  return null;
}