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
  const [readingPage, setReadingPage] = useState(false);
  const [pageRead, setPageRead] = useState(false);

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

  useEffect(() => {
    if (genMode === 'current-page' && !content) {
      fetchPageContent();
    }
  }, [genMode]);

  const fetchPageContent = async () => {
    setReadingPage(true);
    setError('');
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tab = tabs[0];
      if (!tab?.id || !tab.url) throw new Error('No active tab found');

      setPageTitle(tab.title || 'Untitled Page');

      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('about:')) {
        throw new Error('Cannot read content from Chrome system pages');
      }

      let extracted: string | null = null;

      try {
        const response = await chrome.tabs.sendMessage(tab.id, { type: 'get-page-content' });
        extracted = response?.content || null;
      } catch {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            const article = document.querySelector('article');
            const main = document.querySelector('main');
            const el = article || main || document.body;
            if (!el) return '';
            const clone = el.cloneNode(true) as HTMLElement;
            clone.querySelectorAll('script, style, nav, header, footer, iframe, svg, [role="navigation"], noscript').forEach(e => e.remove());
            const headings = clone.querySelectorAll('h1, h2, h3, h4, h5, h6');
            headings.forEach(h => { const level = h.tagName.toLowerCase(); const text = h.textContent?.trim(); if (text) h.replaceWith(document.createTextNode(`\n${'#'.repeat(parseInt(level[1]))} ${text}\n`)); });
            const lists = clone.querySelectorAll('ul, ol');
            lists.forEach(list => { const items = list.querySelectorAll('li'); items.forEach(li => { const text = li.textContent?.trim(); if (text) li.replaceWith(document.createTextNode(`\n- ${text}`)); }); });
            const paras = clone.querySelectorAll('p');
            paras.forEach(p => { const text = p.textContent?.trim(); if (text) p.replaceWith(document.createTextNode(`\n${text}\n`)); });
            return (clone.textContent || '').replace(/\s+/g, ' ').replace(/\n\s+/g, '\n').trim().slice(0, 50000);
          },
        });
        extracted = results?.[0]?.result || null;
      }

      if (extracted) {
        setContent(extracted);
        setPageRead(true);
      } else {
        throw new Error('No content found on this page');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read page');
    } finally {
      setReadingPage(false);
    }
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
    setPageRead(false);
    setGenMode('current-page');
  };

  const handleRefreshPage = () => {
    setContent('');
    setPageRead(false);
    fetchPageContent();
  };

  if (mode === 'generate') {
    return (
      <QuizGenerate
        genMode={genMode}
        onGenModeChange={setGenMode}
        content={content}
        pageTitle={pageTitle}
        readingPage={readingPage}
        pageRead={pageRead}
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
        onRefreshPage={handleRefreshPage}
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