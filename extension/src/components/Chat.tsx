import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '../utils/api';
import { Send, Sparkles, User, Bot, FileText, Copy, Check, Globe, Loader2, X, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import '../styles.css';

interface ChatProps {
  initialContext?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 transition-all"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
      {label || (copied ? 'Copied' : 'Copy')}
    </button>
  );
}

function CodeBlock({ className, children }: { className?: string; children: React.ReactNode }) {
  const match = /language-(\w+)/.exec(className || '');
  const codeString = String(children).replace(/\n$/, '');
  return (
    <div className="relative group my-3 rounded-xl overflow-hidden border border-slate-700/50 shadow-lg">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 dark:bg-slate-900 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
          </div>
          <span className="text-xs text-slate-500 font-mono ml-2">{match?.[1] || 'code'}</span>
        </div>
        <CopyButton text={codeString} label="Copy" />
      </div>
      <pre className="!m-0 !rounded-none !bg-slate-850 !p-4 !overflow-x-auto">
        <code className={`!text-slate-200 !text-xs !font-mono !leading-relaxed ${className || ''}`}>{children}</code>
      </pre>
    </div>
  );
}

function MarkdownMessage({ content }: { content: string }) {
  return (
    <div className="prose prose-slate dark:prose-invert prose-sm max-w-none prose-headings:font-nunito prose-p:font-nunito prose-li:font-nunito prose-strong:font-semibold prose-code:font-mono prose-code:text-blue-600 dark:prose-code:text-blue-400 prose-code:bg-slate-100 dark:prose-code:bg-slate-600 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-xs prose-pre:!bg-transparent prose-pre:!p-0 prose-pre:!border-0 prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:font-medium prose-a:no-underline hover:prose-a:underline prose-blockquote:border-l-blue-400 dark:prose-blockquote:border-l-blue-500 prose-blockquote:text-slate-600 dark:prose-blockquote:text-slate-300 prose-blockquote:bg-blue-50/50 dark:prose-blockquote:bg-blue-900/10 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-xl prose-hr:border-slate-200 dark:prose-hr:border-slate-700">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            if (!match && !className) {
              return <code {...props}>{children}</code>;
            }
            return <CodeBlock className={className}>{children}</CodeBlock>;
          },
          pre({ children }) {
            return <>{children}</>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 justify-start">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-500/10">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="glass3d rounded-2xl rounded-bl-lg px-5 py-4">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
          <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
          <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
        </div>
      </div>
    </div>
  );
}

export function Chat({ initialContext }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetchingContent, setFetchingContent] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (initialContext) {
      setContext(initialContext);
      setShowContext(true);
    }
  }, [initialContext]);

  useEffect(() => {
    if (autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const history = await api.getChatHistory();
        let loaded: Message[] = [];
        if (Array.isArray(history)) {
          loaded = history;
        } else if (history?.messages?.length) {
          loaded = history.messages;
        }
        setMessages(loaded.filter(m => m.content?.trim()));
      } catch {
        // No history available
      }

      if (!initialContext) {
        try {
          const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
          const tab = tabs[0];
          if (tab?.id && tab.url && !tab.url.startsWith('chrome')) {
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
                  if (text) h.replaceWith(document.createTextNode(`\n${'#'.repeat(parseInt(level[1]))} ${text}\n`));
                });
                const lists = clone.querySelectorAll('ul, ol');
                lists.forEach(list => {
                  list.querySelectorAll('li').forEach(li => {
                    const text = li.textContent?.trim();
                    if (text) li.replaceWith(document.createTextNode(`\n- ${text}`));
                  });
                });
                const paras = clone.querySelectorAll('p');
                paras.forEach(p => {
                  const text = p.textContent?.trim();
                  if (text) p.replaceWith(document.createTextNode(`\n${text}\n`));
                });
                return (clone.textContent || '').replace(/\s+/g, ' ').replace(/\n\s+/g, '\n').trim().slice(0, 50000);
              },
            });
            const content = results?.[0]?.result;
            if (content) {
              const pageTitle = tab.title || 'Untitled Page';
              setContext(`Page: ${pageTitle}\nURL: ${tab.url}\n\n--- Page Content ---\n\n${content}`);
              setShowContext(true);
            }
          }
        } catch {
          // Auto-fetch failed, user can click Read Page
        }
      }
    })();
  }, []);

  const handleScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    setAutoScroll(isNearBottom);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    setError('');
    setLoading(true);
    setAutoScroll(true);
    const userMessage = input;
    setInput('');

    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);

    try {
      let assistantMessage = '';
      for await (const chunk of api.chatStream(userMessage, context)) {
        assistantMessage += chunk;
        setMessages((prev) => {
          const updated = [...prev];
          if (updated[updated.length - 1]?.role === 'assistant') {
            updated[updated.length - 1].content = assistantMessage;
          } else {
            updated.push({ role: 'assistant', content: assistantMessage });
          }
          return updated;
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chat failed');
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const fetchPageContent = async () => {
    setFetchingContent(true);
    setError('');
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tab = tabs[0];
      if (!tab?.id || !tab.url) throw new Error('No active tab found');

      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('about:')) {
        throw new Error('Cannot read content from Chrome system pages');
      }

      let content: string | null = null;
      const pageTitle = tab.title || 'Untitled Page';

      try {
        const response = await chrome.tabs.sendMessage(tab.id, { type: 'get-page-content' });
        content = response?.content || null;
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
        content = results?.[0]?.result || null;
      }

      if (content) {
        const fullContext = `Page: ${pageTitle}\nURL: ${tab.url}\n\n--- Page Content ---\n\n${content}`;
        setContext(fullContext);
        setShowContext(true);
      } else {
        throw new Error('No content found on this page');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read page');
    } finally {
      setFetchingContent(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError('');
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full gap-3 p-4">
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-500 dark:text-red-400 text-sm">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')} className="hover:bg-red-100 dark:hover:bg-red-800 rounded-lg p-1 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="glass3d rounded-3xl">
        <button
          onClick={() => setShowContext(!showContext)}
          className="w-full flex items-center justify-between px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 font-nunito hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Context {context ? `(${context.length.toLocaleString()} chars)` : ''}
          </div>
          <div className="flex items-center gap-2">
            {context && !showContext && (
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            )}
            {showContext ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showContext && (
          <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-700 pt-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchPageContent}
                  disabled={fetchingContent}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-xs text-slate-600 dark:text-slate-300 font-medium transition-colors disabled:opacity-50"
                >
                  {fetchingContent ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Globe className="w-3 h-3" />
                  )}
                  {fetchingContent ? 'Reading...' : 'Read Page'}
                </button>
              </div>
              {context && (
                <button
                  type="button"
                  onClick={() => setContext('')}
                  className="text-xs text-slate-400 hover:text-red-500 transition-colors font-nunito"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="relative">
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Paste relevant material or click 'Read Page' to pull content from the current tab..."
                disabled={loading}
                className="w-full bg-transparent border border-slate-200 dark:border-slate-600 rounded-2xl p-3 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 outline-none focus:border-blue-400 focus:ring-[3px] focus:ring-blue-100 dark:focus:ring-blue-900 resize-none transition-all h-20 font-nunito"
              />
            </div>
          </div>
        )}
      </div>

      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto glass3d rounded-3xl p-4"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center shadow-2xl shadow-blue-500/20 mb-4">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200 font-nunito mb-1">AI Study Assistant</h3>
             <p className="text-xs text-slate-500 dark:text-slate-400 font-nunito max-w-[240px]">
              Ask anything about your study material, the current page content, or any topic you're learning
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-500/10 mt-0.5">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}

                <div className={`max-w-[85%] ${msg.role === 'assistant' ? 'order-1' : ''}`}>
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-1.5 px-1">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-nunito">AI Assistant</span>
                      <span className="text-[10px] text-slate-300 dark:text-slate-500 font-nunito">just now</span>
                    </div>
                  )}
                  {msg.role === 'user' && (
                    <div className="flex items-center gap-2 mb-1.5 px-1 justify-end">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-nunito">You</span>
                      <span className="text-[10px] text-slate-300 dark:text-slate-500 font-nunito">just now</span>
                    </div>
                  )}
                  <div
                    className={`${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-2xl rounded-br-lg shadow-lg shadow-blue-500/20 p-3.5'
                        : 'glass3d text-slate-700 dark:text-slate-200 rounded-2xl rounded-bl-lg p-4'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <MarkdownMessage content={msg.content} />
                    ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap font-nunito">{msg.content}</p>
                    )}
                  </div>
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-1 mt-1.5 px-1">
                      <CopyButton text={msg.content} label="Copy response" />
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-purple-500/10 mt-0.5">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {loading && <div className="mt-5"><TypingIndicator /></div>}
        <div ref={messagesEndRef} />
      </div>

      {messages.length > 0 && !loading && (
        <div className="flex justify-center -my-1">
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all font-nunito"
          >
            <Trash2 className="w-3 h-3" /> Clear chat
          </button>
        </div>
      )}

      <form onSubmit={handleSend} className="glass3d rounded-3xl p-2 flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          disabled={loading}
          className="flex-1 bg-transparent px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 outline-none font-nunito"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
