import React, { useState, useRef, useEffect } from 'react';
import { api } from '../utils/api';
import { Sparkles, FileText, Link, RotateCcw, Bookmark, Check } from 'lucide-react';
import '../styles.css';

export function Summary() {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState('');
  const [saved, setSaved] = useState(false);
  const summaryEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    summaryEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [summary]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setError('');
    setLoading(true);
    setSummary('');
    setSaved(false);

    try {
      let fullSummary = '';
      for await (const chunk of api.generateSummary(content, title, sourceUrl)) {
        fullSummary += chunk;
        setSummary(fullSummary);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Summary generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setContent('');
    setTitle('');
    setSourceUrl('');
    setSummary('');
    setSaved(false);
  };

  return (
    <div className="h-full overflow-y-auto p-4">
      {error && (
        <div className="mb-4 p-3 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-500 dark:text-red-400 text-sm">{error}</div>
      )}

      <div className="max-w-lg mx-auto space-y-4">
        <form onSubmit={handleGenerate} className="glass3d rounded-3xl p-6 space-y-4 animate-fade-slide-up">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white font-nunito">Summarize</h2>
              <p className="text-xs text-slate-400 font-nunito">Generate AI summaries from any text</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300 font-nunito">Title (optional)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Chapter 5 Summary"
              disabled={loading}
              className="input dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300 font-nunito">Content to Summarize *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste text, code, or notes you want summarized..."
              disabled={loading}
              className="input dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 h-[150px] resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300 font-nunito">Source URL (optional)</label>
            <div className="relative">
              <Link className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://example.com/article"
                disabled={loading}
                className="input dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 pl-11"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={loading}
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                'Generate Summary'
              )}
            </button>
            {summary && (
              <button
                type="button"
                className="btn border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600"
                onClick={handleReset}
                disabled={loading}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>

        {(summary || loading) && (
          <div className="glass3d rounded-3xl p-6 animate-fade-slide-up">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 font-nunito">Summary</h3>
            <div className="max-h-[300px] overflow-y-auto">
              {loading && !summary ? (
                <div className="text-center text-slate-400 py-8">
                  <div className="inline-block w-5 h-5 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin mb-2"></div>
                  <p className="text-sm font-nunito">Generating summary...</p>
                </div>
              ) : (
                <div className="text-sm leading-relaxed whitespace-pre-wrap text-slate-700 dark:text-slate-200 font-nunito">
                  {summary}
                </div>
              )}
              <div ref={summaryEndRef} />
            </div>
          </div>
        )}

        {summary && !loading && (
          <button
            type="button"
            className={`btn w-full ${
              saved
                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700 cursor-default'
                : 'btn-primary'
            }`}
            onClick={() => setSaved(true)}
            disabled={saved}
          >
            {saved ? (
              <span className="flex items-center gap-2"><Check className="w-4 h-4" /> Saved</span>
            ) : (
              <span className="flex items-center gap-2"><Bookmark className="w-4 h-4" /> Save Summary</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
