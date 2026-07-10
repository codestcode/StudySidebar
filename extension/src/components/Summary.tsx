import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '../utils/api';
import { Sparkles, FileText, RotateCcw, Check, Copy, Globe, Loader2, AlertTriangle, Network } from 'lucide-react';
import { ContextLoader } from './ContextLoader';
import { type PageContext } from '../utils/page';
import { MindMapViewer } from './MindMapViewer';
import '../styles.css';

export function Summary() {
  const [content, setContent] = useState('');
  const [pageTitle, setPageTitle] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [pageRead, setPageRead] = useState(false);
  const [summaryLength, setSummaryLength] = useState<'short' | 'medium' | 'detailed'>('short');
  const [summaryFormat, setSummaryFormat] = useState<'paragraph' | 'bullet' | 'concept'>('paragraph');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState('');
  const [copied, setCopied] = useState(false);
  const [showMindMap, setShowMindMap] = useState(false);
  const [mindMapSyntax, setMindMapSyntax] = useState<string | null>(null);
  const [generatingMindMap, setGeneratingMindMap] = useState(false);
  const summaryEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    summaryEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [summary]);

  const handleContextLoaded = (ctx: PageContext) => {
    setContent(ctx.content);
    setPageTitle(ctx.title);
    setSourceUrl(ctx.url);
    setPageRead(true);
    setError('');
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

  const handleVisualize = async () => {
    if (mindMapSyntax) {
      setShowMindMap(true);
      return;
    }
    if (!content) return;
    
    try {
      setGeneratingMindMap(true);
      setShowMindMap(true);
      const res = await api.generateMindMap(content);
      setMindMapSyntax(res.mindmap);
    } catch (err: any) {
      setError(err.message || 'Failed to generate mind map');
      setShowMindMap(false);
    } finally {
      setGeneratingMindMap(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="max-w-lg mx-auto space-y-4">

        {error && !pageRead && (
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

          <ContextLoader 
            onContextLoaded={handleContextLoaded} 
            onError={(err) => setError(err)} 
          />

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
              disabled={loading || !content}
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
          <div className="glass3d rounded-3xl overflow-hidden animate-fade-slide-up">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white font-nunito">Summary</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] uppercase tracking-wider font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{summaryLength}</span>
                      <span className="text-[10px] uppercase tracking-wider font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{summaryFormat === 'bullet' ? 'bullet' : summaryFormat === 'concept' ? 'concepts' : 'paragraph'}</span>
                    </div>
                  </div>
                </div>
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
                  <button
                    type="button"
                    onClick={handleVisualize}
                    disabled={generatingMindMap}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 text-xs text-purple-600 dark:text-purple-400 font-medium transition-colors"
                  >
                    {generatingMindMap ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Network className="w-3.5 h-3.5" />}
                    Visualize
                  </button>
                </div>
              </div>
            </div>

            {showMindMap && (
              <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Network className="w-4 h-4 text-purple-500" /> Concept Map
                  </h4>
                  <button onClick={() => setShowMindMap(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>
                {generatingMindMap ? (
                  <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-sm">
                    <Loader2 className="w-6 h-6 animate-spin mb-2 text-purple-500" />
                    Generating visual map...
                  </div>
                ) : (
                  <MindMapViewer syntax={mindMapSyntax || ''} />
                )}
              </div>
            )}

            {pageTitle && (
              <div className="px-6 py-2.5 border-b border-slate-100 dark:border-slate-700/50 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-800/30">
                <Globe className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-nunito truncate">{pageTitle}</span>
              </div>
            )}

            {loading && !summary ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <span className="w-8 h-8 border-[3px] border-slate-200 dark:border-slate-600 border-t-blue-500 rounded-full animate-spin mb-4"></span>
                <p className="text-sm font-nunito text-slate-500 dark:text-slate-400">Generating summary...</p>
              </div>
            ) : (
              <div className="p-6">
                <div className="prose prose-slate dark:prose-invert prose-sm max-w-none prose-headings:font-nunito prose-p:font-nunito prose-li:font-nunito prose-strong:font-semibold prose-headings:text-slate-900 dark:prose-headings:text-white prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-li:text-slate-700 dark:prose-li:text-slate-300 prose-headings:mt-6 prose-headings:mb-3 prose-headings:pb-1.5 prose-headings:border-b prose-headings:border-slate-100 dark:prose-headings:border-slate-700 prose-p:leading-relaxed prose-p:my-3 prose-ul:space-y-1.5 prose-li:my-1 prose-li:leading-relaxed prose-code:text-blue-600 dark:prose-code:text-blue-400 prose-code:bg-slate-100 dark:prose-code:bg-slate-700 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-xs prose-strong:text-slate-900 dark:prose-strong:text-white prose-blockquote:border-l-blue-400 dark:prose-blockquote:border-l-blue-500 prose-blockquote:text-slate-600 dark:prose-blockquote:text-slate-400 prose-blockquote:bg-blue-50/50 dark:prose-blockquote:bg-blue-900/10 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-xl prose-blockquote:my-4 prose-hr:border-slate-200 dark:prose-hr:border-slate-700">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {summary}
                  </ReactMarkdown>
                </div>
                <div ref={summaryEndRef} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
