import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '../utils/api';
import { Sparkles, FileText, RotateCcw, Check, Copy, Globe, Loader2, AlertTriangle } from 'lucide-react';
import '../styles.css';

export function Summary() {
  const [content, setContent] = useState('');
  const [pageTitle, setPageTitle] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [readingPage, setReadingPage] = useState(false);
  const [pageRead, setPageRead] = useState(false);
  const [summaryLength, setSummaryLength] = useState<'short' | 'medium' | 'detailed'>('short');
  const [summaryFormat, setSummaryFormat] = useState<'paragraph' | 'bullet' | 'concept'>('paragraph');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState('');
  const [copied, setCopied] = useState(false);
  const summaryEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    summaryEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [summary]);

  useEffect(() => {
    fetchPageContent();
  }, []);

  const fetchPageContent = async () => {
    setReadingPage(true);
    setError('');
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tab = tabs[0];
      if (!tab?.id || !tab.url) throw new Error('No active tab found');

      setPageTitle(tab.title || 'Untitled Page');
      setSourceUrl(tab.url);

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
    if (!content.trim()) return;

    setError('');
    setLoading(true);
    setSummary('');
    setCopied(false);

    try {
      let fullSummary = '';
      for await (const chunk of api.generateSummary(content, pageTitle, sourceUrl, summaryLength, summaryFormat)) {
        fullSummary += chunk;
        setSummary(fullSummary);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Summary generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!content.trim()) return;
    setError('');
    setLoading(true);
    setSummary('');
    setCopied(false);
    try {
      let fullSummary = '';
      for await (const chunk of api.generateSummary(content, pageTitle, sourceUrl, summaryLength, summaryFormat)) {
        fullSummary += chunk;
        setSummary(fullSummary);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Summary generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="max-w-lg mx-auto space-y-4">

        {error && !readingPage && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-500 dark:text-red-400 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        <div className="glass3d rounded-3xl p-6 animate-fade-slide-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white font-nunito">Summarise</h2>
              <p className="text-xs text-slate-400 font-nunito">Generate concise summaries of any content</p>
            </div>
          </div>

          {readingPage ? (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 mb-4">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 font-nunito">Reading page content...</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-nunito">Extracting text from the current tab</p>
              </div>
            </div>
          ) : pageRead ? (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 mb-4">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 font-nunito">Page content loaded</p>
                <p className="text-xs text-emerald-500 dark:text-emerald-400 font-nunito truncate">{pageTitle} — {content.length.toLocaleString()} chars</p>
              </div>
              <button
                type="button"
                onClick={fetchPageContent}
                disabled={readingPage}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-800 hover:bg-emerald-200 dark:hover:bg-emerald-700 text-xs text-emerald-700 dark:text-emerald-300 font-medium transition-colors disabled:opacity-50 flex-shrink-0"
              >
                <RotateCcw className="w-3 h-3" />
                Refresh
              </button>
            </div>
          ) : null}

          <form onSubmit={handleGenerate} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Summary Length</label>
              <div className="space-y-2">
                {[
                  { id: 'short', label: 'Short', desc: '3 key points' },
                  { id: 'medium', label: 'Medium', desc: '1 paragraph' },
                  { id: 'detailed', label: 'Detailed', desc: 'Full summary' },
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
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Summary Format</label>
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

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white text-sm font-semibold shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98] disabled:opacity-50"
              disabled={loading || !content || readingPage}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Generating...
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Generate Summary
                </span>
              )}
            </button>
          </form>
        </div>

        {(summary || loading) && (
          <div className="glass3d rounded-3xl p-6 animate-fade-slide-up">
            {loading && !summary ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <span className="w-6 h-6 border-2 border-slate-200 dark:border-slate-600 border-t-blue-500 rounded-full animate-spin mb-3"></span>
                <p className="text-sm font-nunito">Generating summary...</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white font-nunito">Summary</h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(summary);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-xs text-slate-600 dark:text-slate-300 font-medium transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                    <button
                      type="button"
                      onClick={handleRegenerate}
                      disabled={loading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-xs text-slate-600 dark:text-slate-300 font-medium transition-colors disabled:opacity-50"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Regenerate
                    </button>
                  </div>
                </div>
                <div className="prose prose-slate dark:prose-invert prose-sm max-w-none prose-headings:font-nunito prose-p:font-nunito prose-li:font-nunito prose-strong:font-semibold prose-headings:text-slate-900 dark:prose-headings:text-white prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-li:text-slate-700 dark:prose-li:text-slate-300 prose-headings:mt-5 prose-headings:mb-2 prose-p:leading-relaxed prose-ul:space-y-1">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {summary}
                  </ReactMarkdown>
                </div>
                <div ref={summaryEndRef} />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
