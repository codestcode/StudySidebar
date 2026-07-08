import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Quote } from 'lucide-react';
import { type NotesData, importanceConfig, renderNoteText } from './NotesShared';

export function FlashCardsView({ data, title }: { data: NotesData; title: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const row = data.rows[currentIndex];
  const config = row ? importanceConfig[row.importance] || importanceConfig.low : importanceConfig.low;
  const ImportanceIcon = config.icon;

  const handlePrev = () => {
    setFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : data.rows.length - 1));
    }, 150);
  };

  const handleNext = () => {
    setFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev < data.rows.length - 1 ? prev + 1 : 0));
    }, 150);
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handlePrev();
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setFlipped((f) => !f); }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!row) return null;

  return (
    <div className="flashcards-container animate-fade-slide-up">
      <div className="flashcard-count">
        {currentIndex + 1} / {data.rows.length}
      </div>

      <div
        className={`flashcard ${flipped ? 'flipped' : ''}`}
        onClick={() => setFlipped((f) => !f)}
      >
        <div className="flashcard-inner">
          <div className="flashcard-front">
            <span className={`flashcard-importance ${config.badgeClass}`}>
              <ImportanceIcon className="w-2.5 h-2.5 inline-block mr-0.5" />
              {config.label}
            </span>
            <div className="flashcard-front-cue">{row.cue}</div>
            <div className="flashcard-front-hint">Tap to reveal</div>
          </div>
          <div className="flashcard-back">
            <div className="flashcard-back-note">{renderNoteText(row.note)}</div>
          </div>
        </div>
      </div>

      <div className="flashcard-actions">
        <button onClick={handlePrev} className="flashcard-nav-btn">
          <ChevronLeft className="w-3.5 h-3.5 inline mr-1" />Previous
        </button>
        <button onClick={() => setFlipped((f) => !f)} className="flashcard-nav-btn">
          <Maximize2 className="w-3.5 h-3.5 inline mr-1" />Flip
        </button>
        <button onClick={handleNext} className="flashcard-nav-btn">
          Next<ChevronRight className="w-3.5 h-3.5 inline ml-1" />
        </button>
      </div>

      {data.summary && currentIndex === data.rows.length - 1 && (
        <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-900/15 dark:to-indigo-900/10 border border-blue-100 dark:border-blue-800/30">
          <div className="flex items-center gap-2 mb-2">
            <Quote className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wide">Summary</span>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed italic">&ldquo;{data.summary}&rdquo;</p>
        </div>
      )}
    </div>
  );
}
