import React, { useState, useRef, useEffect } from 'react';
import { api } from '../utils/api';
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
    <div className="flex flex-col h-full gap-3">
      <form
        onSubmit={handleGenerate}
        className="flex flex-col gap-3"
      >
        <div>
          <label className="block text-sm font-medium mb-1.5">Title (optional)</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Chapter 5 Summary"
            disabled={loading}
            className="input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Content to Summarize *</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste text, code, or notes you want summarized..."
            disabled={loading}
            className="input h-[150px] resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Source URL (optional)</label>
          <input
            type="url"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://example.com/article"
            disabled={loading}
            className="input"
          />
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
              className="btn border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              onClick={handleReset}
              disabled={loading}
            >
              Clear
            </button>
          )}
        </div>
      </form>

      {error && (
        <div className="p-3 rounded-2xl bg-red-50 text-red-500 text-sm">{error}</div>
      )}

      {(summary || loading) && (
        <div className="flex-1 overflow-y-auto bg-slate-100 rounded-2xl p-3">
          {loading && !summary ? (
            <div className="text-center text-slate-400">
              <div className="inline-block w-4 h-4 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin mb-2"></div>
              <p>Generating summary...</p>
            </div>
          ) : (
            <div className="text-sm leading-relaxed whitespace-pre-wrap text-slate-800">
              {summary}
            </div>
          )}
          <div ref={summaryEndRef} />
        </div>
      )}

      {summary && !loading && (
        <button
          type="button"
          className={`btn w-full ${
            saved
              ? 'bg-blue-100 text-blue-600 cursor-default'
              : 'btn-primary'
          }`}
          onClick={() => setSaved(true)}
          disabled={saved}
        >
          {saved ? '✓ Saved' : 'Save Summary'}
        </button>
      )}
    </div>
  );
}
