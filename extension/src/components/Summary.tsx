import React, { useState, useRef, useEffect } from 'react';
import { api } from '../utils/api';
import { Sparkles, FileText, Link, RotateCcw, Bookmark, Check } from 'lucide-react';
import '../styles.css';

export function Summary() {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [summaryLength, setSummaryLength] = useState<'short' | 'medium' | 'detailed'>('short');
  const [summaryFormat, setSummaryFormat] = useState<'paragraph' | 'bullet' | 'concept'>('paragraph');
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
      for await (const chunk of api.generateSummary(content, title, sourceUrl, summaryLength, summaryFormat)) {
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
    setSummaryLength('short');
    setSummaryFormat('paragraph');
  };

  return (
    <div className="flex flex-col h-full gap-3">
      <h2 className="text-base font-semibold text-slate-900">Summarise</h2>

      <form onSubmit={handleGenerate} className="flex flex-col gap-4 flex-1">
        <div className="card p-4 bg-blue-50 border border-blue-200">
          <div className="flex gap-3 items-start">
            <div className="w-6 h-6 rounded-full bg-green-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">Current Page Detected</p>
              <p className="text-xs text-slate-600 mt-1">We'll summarize the contents of this page</p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-3">Summary Length</label>
          <div className="space-y-2">
            {[
              { id: 'short', label: 'Short', desc: '3-day points' },
              { id: 'medium', label: 'Medium', desc: '1 paragraph' },
              { id: 'detailed', label: 'Detailed', desc: 'Whole summary' },
            ].map((option) => (
              <label
                key={option.id}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  summaryLength === option.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="length"
                  value={option.id}
                  checked={summaryLength === option.id}
                  onChange={() => setSummaryLength(option.id as 'short' | 'medium' | 'detailed')}
                  disabled={loading}
                  className="accent-blue-500"
                />
                <div>
                  <div className="text-sm font-medium text-slate-900">{option.label}</div>
                  <div className="text-xs text-slate-500">{option.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-3">Summary Format</label>
          <div className="space-y-2">
            {[
              { id: 'paragraph', label: 'Paragraph', desc: 'Full summary' },
              { id: 'bullet', label: 'Bullet Point', desc: 'Key points in bullets' },
              { id: 'concept', label: 'Key Concept', desc: 'Summary of key concepts' },
            ].map((option) => (
              <label
                key={option.id}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  summaryFormat === option.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="format"
                  value={option.id}
                  checked={summaryFormat === option.id}
                  onChange={() => setSummaryFormat(option.id as 'paragraph' | 'bullet' | 'concept')}
                  disabled={loading}
                  className="accent-blue-500"
                />
                <div>
                  <div className="text-sm font-medium text-slate-900">{option.label}</div>
                  <div className="text-xs text-slate-500">{option.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-red-50 text-red-500 text-sm">{error}</div>
        )}

        <button
          type="submit"
          className="btn btn-gradient w-full mt-auto"
          disabled={loading}
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11z" fill="white" />
              </svg>
              Generate Summary
            </>
          )}
        </button>

        <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 1C6.48 1 2 5.48 2 11s4.48 10 10 10 10-4.48 10-10S17.52 1 12 1zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S15.33 8 14.5 8 13 8.67 13 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S8.33 8 7.5 8 6 8.67 6 9.5 6.67 11 7.5 11z" fill="currentColor" />
          </svg>
          Your data is private and secure
        </div>
      </form>

      {(summary || loading) && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {loading && !summary ? (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <div className="inline-block w-4 h-4 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin mb-2"></div>
                <p>Generating summary...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto space-y-4 pb-4">
                <div>
                  <h3 className="text-sm font-semibold text-teal-600 mb-2">Summarize</h3>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-900 mb-2 uppercase tracking-wide">Overview</h4>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {summary.split('\n\n')[0] || summary}
                  </p>
                </div>

                {summary.includes('Key') && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900 mb-2 uppercase tracking-wide">Key Points</h4>
                    <ul className="text-xs text-slate-700 leading-relaxed space-y-1">
                      {summary.split('\n').filter((line) => line.trim().startsWith('-')).map((line, i) => (
                        <li key={i} className="ml-3">• {line.replace(/^-\s*/, '').trim()}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {summary.includes('Conclusion') && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900 mb-2 uppercase tracking-wide">Conclusion</h4>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {summary.split('Conclusion')[1]?.split('\n')[0] || ''}
                    </p>
                  </div>
                )}

                <div ref={summaryEndRef} />
              </div>

              <div className="flex gap-2 border-t border-slate-200 pt-3">
                <button
                  type="button"
                  className="flex-1 btn border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2"
                  onClick={() => {
                    navigator.clipboard.writeText(summary);
                    setSaved(true);
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" fill="currentColor" />
                  </svg>
                  Copy Summary
                </button>
                <button
                  type="button"
                  className="flex-1 btn btn-primary flex items-center justify-center gap-2"
                  onClick={handleGenerate}
                  disabled={loading}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7.5 10.5H2v-3h5.5v3zm0 7H2v-3h5.5v3zm7-7h-5.5v-3H14.5v3zm0 7h-5.5v-3H14.5v3zm7-7h-5.5v-3H21.5v3zm0 7h-5.5v-3H21.5v3zm-17-14h20c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H4.5c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2z" fill="white" />
                  </svg>
                  Regenerate
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
