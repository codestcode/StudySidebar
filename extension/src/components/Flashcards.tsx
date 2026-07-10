import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';
import { Sparkles, Brain, Clock, ChevronRight, RotateCcw, Check, X, Layers, BrainCircuit, Play } from 'lucide-react';
import { ContextLoader } from './ContextLoader';
import { type PageContext } from '../utils/page';
import '../styles.css';

export function Flashcards() {
  const [activeTab, setActiveTab] = useState<'generate' | 'review' | 'browse'>('generate');
  const [pageContext, setPageContext] = useState<PageContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [allCards, setAllCards] = useState<any[]>([]);
  const [dueCards, setDueCards] = useState<any[]>([]);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [generatedCount, setGeneratedCount] = useState(5);

  const fetchCards = async () => {
    try {
      const cards = await api.getFlashcards();
      setAllCards(cards);
    } catch {}
  };

  const fetchDueCards = async () => {
    try {
      const due = await api.getDueFlashcards();
      setDueCards(due);
      setCurrentReviewIndex(0);
      setShowAnswer(false);
    } catch {}
  };

  useEffect(() => {
    if (activeTab === 'browse') fetchCards();
    if (activeTab === 'review') fetchDueCards();
  }, [activeTab]);

  const handleContextLoaded = useCallback((ctx: PageContext) => {
    setPageContext(ctx);
    setError('');
  }, []);

  const handleGenerate = async () => {
    if (!pageContext?.content) return;
    setLoading(true);
    setError('');
    
    try {
      await api.generateFlashcards(pageContext.content, pageContext.title, pageContext.url, generatedCount);
      setActiveTab('browse');
    } catch (err: any) {
      setError(err.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (isCorrect: boolean) => {
    if (dueCards.length === 0) return;
    const currentCard = dueCards[currentReviewIndex];
    
    try {
      await api.reviewFlashcard(currentCard.id, isCorrect);
      
      if (currentReviewIndex + 1 < dueCards.length) {
        setCurrentReviewIndex(prev => prev + 1);
        setShowAnswer(false);
      } else {
        await fetchDueCards();
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 mb-4 rounded-2xl gap-0.5">
        <button
          onClick={() => setActiveTab('generate')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'generate' ? 'bg-white dark:bg-slate-700 text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          Generate
        </button>
        <button
          onClick={() => setActiveTab('review')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'review' ? 'bg-white dark:bg-slate-700 text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          Review {dueCards.length > 0 && `(${dueCards.length})`}
        </button>
        <button
          onClick={() => setActiveTab('browse')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'browse' ? 'bg-white dark:bg-slate-700 text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          Browse
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-xl text-sm mb-4">
            {error}
          </div>
        )}

        {activeTab === 'generate' && (
          <div className="glass3d rounded-3xl p-6 animate-fade-slide-up space-y-6">
            <ContextLoader onContextLoaded={handleContextLoaded} onError={setError} />
            
            <div className="text-center pt-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/20">
                <BrainCircuit className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">Create Flashcards</h3>
              
              <div className="flex items-center justify-center gap-3 my-4">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Count:</label>
                <select 
                  value={generatedCount} 
                  onChange={(e) => setGeneratedCount(Number(e.target.value))}
                  className="input py-1 px-3 w-24 text-center"
                >
                  <option value={3}>3 Cards</option>
                  <option value={5}>5 Cards</option>
                  <option value={10}>10 Cards</option>
                </select>
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading || !pageContext}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-purple-500 hover:bg-purple-600 text-white font-semibold shadow-lg shadow-purple-500/25 transition-all disabled:opacity-50"
              >
                {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <Sparkles className="w-4 h-4" />}
                {loading ? 'Generating...' : 'Generate Flashcards'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'review' && (
          <div className="h-full animate-fade-slide-up flex flex-col items-center justify-center">
            {dueCards.length === 0 ? (
              <div className="text-center p-8">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">You're all caught up!</h3>
                <p className="text-sm text-slate-500">Check back later or generate new cards.</p>
              </div>
            ) : (
              <div className="w-full max-w-sm">
                <div className="text-center text-xs font-bold text-slate-400 mb-4 tracking-widest uppercase">
                  Card {currentReviewIndex + 1} of {dueCards.length}
                </div>
                
                <div 
                  className="w-full min-h-[250px] perspective-1000 cursor-pointer group"
                  onClick={() => setShowAnswer(!showAnswer)}
                >
                  <div className={`relative w-full h-full duration-500 preserve-3d ${showAnswer ? 'rotate-y-180' : ''}`}>
                    
                    <div className="absolute inset-0 backface-hidden glass3d rounded-3xl p-6 flex items-center justify-center text-center shadow-xl border border-slate-200 dark:border-slate-700">
                      <p className="text-lg font-bold text-slate-900 dark:text-white">
                        {dueCards[currentReviewIndex].question}
                      </p>
                      <div className="absolute bottom-4 text-xs text-slate-400 animate-pulse">Click to flip</div>
                    </div>
                    
                    <div className="absolute inset-0 backface-hidden rotate-y-180 glass3d rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-xl border border-purple-200 dark:border-purple-900 bg-gradient-to-br from-purple-50/50 to-white dark:from-purple-900/20 dark:to-slate-800">
                      <p className="text-base text-slate-800 dark:text-slate-200">
                        {dueCards[currentReviewIndex].answer}
                      </p>
                    </div>

                  </div>
                </div>

                {showAnswer && (
                  <div className="flex gap-4 mt-8 animate-fade-slide-up">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleReview(false); }}
                      className="flex-1 py-3 rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold flex items-center justify-center gap-2 hover:bg-red-200 transition-colors"
                    >
                      <X className="w-5 h-5" /> Again
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleReview(true); }}
                      className="flex-1 py-3 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center gap-2 hover:bg-emerald-200 transition-colors"
                    >
                      <Check className="w-5 h-5" /> Got it
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'browse' && (
          <div className="space-y-3 pb-4 animate-fade-slide-up">
            {allCards.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm">No flashcards yet.</div>
            ) : (
              allCards.map(card => (
                <div key={card.id} className="p-4 glass3d rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">Level {card.box_level}</span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(card.next_review_at) <= new Date() ? 'Due now' : new Date(card.next_review_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="font-bold text-sm text-slate-900 dark:text-white mb-1">{card.question}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{card.answer}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
