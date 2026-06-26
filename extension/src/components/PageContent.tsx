import React, { useState, useEffect } from 'react';
import { Globe, Loader2, FileText, Send, RefreshCw, AlertTriangle, Check, X } from 'lucide-react';

interface PageContentProps {
  onSendToChat: (content: string) => void;
}

export function PageContent({ onSendToChat }: PageContentProps) {
  const [content, setContent] = useState('');
  const [pageUrl, setPageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const fetchContent = async () => {
    setLoading(true);
    setError('');
    setSent(false);
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tab = tabs[0];
      if (!tab?.id || !tab.url) throw new Error('No active tab found');

      setPageUrl(tab.url);

      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('about:')) {
        throw new Error('Cannot read content from Chrome system pages.\nOpen a regular webpage to use this feature.');
      }

      let extracted: string | null = null;
      const pageTitle = tab.title || 'Untitled Page';

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
            headings.forEach(h => {
              const level = h.tagName.toLowerCase();
              const text = h.textContent?.trim();
              if (text) {
                h.replaceWith(document.createTextNode(`\n${'#'.repeat(parseInt(level[1]))} ${text}\n`));
              }
            });

            const lists = clone.querySelectorAll('ul, ol');
            lists.forEach(list => {
              const items = list.querySelectorAll('li');
              items.forEach(li => {
                const text = li.textContent?.trim();
                if (text) {
                  li.replaceWith(document.createTextNode(`\n- ${text}`));
                }
              });
            });

            const paras = clone.querySelectorAll('p');
            paras.forEach(p => {
              const text = p.textContent?.trim();
              if (text) {
                p.replaceWith(document.createTextNode(`\n${text}\n`));
              }
            });

            return (clone.textContent || '')
              .replace(/\s+/g, ' ')
              .replace(/\n\s+/g, '\n')
              .trim()
              .slice(0, 50000);
          },
        });
        extracted = results?.[0]?.result || null;
      }

      if (extracted) {
        const fullContent = `Page: ${pageTitle}\nURL: ${tab.url}\n\n--- Page Content ---\n\n${extracted}`;
        setContent(fullContent);
      } else {
        throw new Error('No content found on this page');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read page');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const wordCount = content ? content.split(/\s+/).length : 0;

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="max-w-lg mx-auto space-y-4">
        <div className="glass3d rounded-3xl p-6 animate-fade-slide-up">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white font-nunito">Page Content</h2>
                <p className="text-xs text-slate-400 font-nunito">Content extracted from current page</p>
              </div>
            </div>
            <button
              type="button"
              onClick={fetchContent}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-xs text-slate-600 dark:text-slate-300 font-medium transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {pageUrl && (
            <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600">
              <Globe className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate font-nunito">{pageUrl}</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-center">
              <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <p className="text-sm text-amber-700 dark:text-amber-300 font-nunito whitespace-pre-line">{error}</p>
            </div>
          )}

          {loading && !content && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-blue-400" />
              <p className="text-sm font-nunito">Reading page content...</p>
            </div>
          )}

          {content && (
            <>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3 text-xs text-slate-400 font-nunito">
                  <span>{wordCount.toLocaleString()} words</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                  <span>{content.length.toLocaleString()} chars</span>
                </div>
              </div>

              <div className="relative">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-[250px] bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-2xl p-4 text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-blue-400 focus:ring-[3px] focus:ring-blue-100 dark:focus:ring-blue-900 resize-none font-nunito leading-relaxed"
                  readOnly={false}
                />
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => { onSendToChat(content); setSent(true); }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white text-sm font-medium shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98]"
                >
                  {sent ? (
                    <><Check className="w-4 h-4" /> Sent to Chat</>
                  ) : (
                    <><Send className="w-4 h-4" /> Send to Chat</>
                  )}
                </button>
                {content && (
                  <button
                    type="button"
                    onClick={() => setContent('')}
                    className="px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
