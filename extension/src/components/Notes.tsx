import React, { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '../utils/api';
import { Sparkles, FileText, RotateCcw, Check, Globe, Loader2, AlertTriangle, Bookmark, Download, Quote, Layers } from 'lucide-react';
import '../styles.css';
import { type NotesData, type NotesStyle, styleOptions } from './NotesShared';
import { CornellView } from './NotesCornell';
import { MindMapView } from './NotesMindMap';
import { FlashCardsView } from './NotesFlashCards';

export function Notes() {
  const [pageContent, setPageContent] = useState('');
  const [pageTitle, setPageTitle] = useState('');
  const [pageUrl, setPageUrl] = useState('');
  const [readingPage, setReadingPage] = useState(false);
  const [pageRead, setPageRead] = useState(false);
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState('');
  const [notesData, setNotesData] = useState<NotesData | null>(null);
  const [notesId, setNotesId] = useState<string | null>(null);
  const [hasExistingNotes, setHasExistingNotes] = useState(false);
  const [notesStyle, setNotesStyle] = useState<NotesStyle>('cornell');
  const [showStyleDropdown, setShowStyleDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editingRow, setEditingRow] = useState<{ id: string; field: 'cue' | 'note' } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [savedIndicator, setSavedIndicator] = useState<string | null>(null);
  const notesEndRef = useRef<HTMLDivElement>(null);

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
      setPageUrl(tab.url);

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
        setPageContent(extracted);
        setPageRead(true);
        await checkExistingNotes(tab.url);
      } else {
        throw new Error('No content found on this page');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read page');
    } finally {
      setReadingPage(false);
    }
  };

  const checkExistingNotes = async (url: string) => {
    try {
      const existing = await api.getNotesForPage(url);
      if (existing && existing.notes_json?.rows?.length) {
        setNotesData(existing.notes_json);
        setNotesId(existing.id);
        setHasExistingNotes(true);
      }
    } catch {}
  };

  const handleGenerate = async () => {
    if (!pageContent.trim()) return;

    setError('');
    setLoading(true);
    setNotesData(null);
    setHasExistingNotes(false);

    try {
      const result = await api.generateNotes(pageContent, pageTitle, pageUrl, notesStyle);
      if (result.notes) {
        setNotesData(result.notes);
        setNotesId(result.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Notes generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateClick = () => {
    if (hasExistingNotes && notesData) {
      setShowRegenerateConfirm(true);
    } else {
      handleGenerate();
    }
  };

  const handleRegenerateWithStyle = async (newStyle: NotesStyle) => {
    if (!pageContent.trim()) return;
    setNotesStyle(newStyle);

    if (notesData) {
      setRegenerating(true);
      setError('');
      try {
        const result = await api.generateNotes(pageContent, pageTitle, pageUrl, newStyle);
        if (result.notes) {
          setNotesData(result.notes);
          setNotesId(result.id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Notes generation failed');
      } finally {
        setRegenerating(false);
      }
    }
  };

  const confirmRegenerate = async () => {
    setShowRegenerateConfirm(false);
    await handleGenerate();
  };

  const startEditing = (rowId: string, field: 'cue' | 'note', currentValue: string) => {
    setEditingRow({ id: rowId, field });
    setEditValue(currentValue);
  };

  const saveEdit = useCallback(async () => {
    if (!editingRow || !notesData) return;

    const updatedRows = notesData.rows.map(row => {
      if (row.id === editingRow.id) {
        return { ...row, [editingRow.field]: editValue };
      }
      return row;
    });

    const updatedNotes = { ...notesData, rows: updatedRows };
    setNotesData(updatedNotes);
    setEditingRow(null);

    if (notesId) {
      try {
        await api.updateNotes(notesId, updatedNotes);
        setSavedIndicator(editingRow.id);
        setTimeout(() => setSavedIndicator(null), 1500);
      } catch {}
    }
  }, [editingRow, editValue, notesData, notesId]);

  useEffect(() => {
    if (!editingRow) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEditingRow(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editingRow]);

  useEffect(() => {
    if (!showStyleDropdown) return;
    const handleClick = () => setShowStyleDropdown(false);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [showStyleDropdown]);

  const handleExport = () => {
    if (!notesData) return;

    const lines: string[] = [];
    lines.push(`# ${notesData.title}`);
    lines.push('');
    lines.push('## Cue Column | Note Column');
    lines.push('');
    lines.push('| Cue | Notes |');
    lines.push('|-----|-------|');

    for (const row of notesData.rows) {
      const escapedNote = row.note.replace(/\n/g, '<br>');
      lines.push(`| **${row.cue}** | ${escapedNote} |`);
    }

    lines.push('');
    lines.push('## Review Summary');
    lines.push('');
    lines.push(notesData.summary);

    const markdown = lines.join('\n');
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (readingPage) {
    return (
      <div className="h-full overflow-y-auto p-4">
        <div className="max-w-lg mx-auto space-y-4">
          <div className="glass3d rounded-3xl p-6 animate-fade-slide-up">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white font-nunito">Smart Notes</h2>
                <p className="text-xs text-slate-400 font-nunito">AI-powered study notes</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 font-nunito">Reading page content...</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-nunito">Extracting text from the current tab</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="max-w-lg mx-auto space-y-4">

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-500 dark:text-red-400 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {!hasExistingNotes && !notesData && !loading && (
          <div className="glass3d rounded-3xl p-6 animate-fade-slide-up">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white font-nunito">Smart Notes</h2>
                <p className="text-xs text-slate-400 font-nunito">AI-powered study notes in multiple styles</p>
              </div>
            </div>

            {pageRead && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 mb-4">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 font-nunito">Page loaded</p>
                  <p className="text-xs text-emerald-500 dark:text-emerald-400 font-nunito truncate">{pageTitle} &mdash; {pageContent.length.toLocaleString()} chars</p>
                </div>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Notes Style</label>
              <div className="style-selector">
                {styleOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setNotesStyle(option.id)}
                    className={`style-option ${notesStyle === option.id ? 'active' : ''}`}
                  >
                    <img src={chrome.runtime.getURL(option.iconImg)} alt={option.label} className="style-option-icon" />
                    <span className="style-option-label">{option.label}</span>
                    <span className="text-[8px] text-slate-400 dark:text-slate-500 leading-tight">{option.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="text-center py-2">
              <button
                onClick={handleGenerate}
                disabled={loading || !pageContent}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white text-sm font-semibold shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {loading ? 'Generating...' : 'Generate Notes'}
              </button>
            </div>
          </div>
        )}

        {loading && !notesData && (
          <div className="glass3d rounded-3xl p-6 animate-fade-slide-up">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-1"></div>
                <div className="h-3 w-24 bg-slate-100 dark:bg-slate-700 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700">
                  <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-600 rounded animate-pulse mb-2"></div>
                  <div className="h-3 w-full bg-slate-100 dark:bg-slate-600 rounded animate-pulse mb-1"></div>
                  <div className="h-3 w-2/3 bg-slate-100 dark:bg-slate-600 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(notesData?.rows?.length > 0) && (
          <div className="glass3d rounded-3xl overflow-hidden animate-fade-slide-up relative">
            {regenerating && (
              <div className="absolute inset-0 z-30 bg-white/60 dark:bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <span className="w-8 h-8 border-[3px] border-slate-200 dark:border-slate-600 border-t-blue-500 rounded-full animate-spin"></span>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Regenerating in new style...</p>
                </div>
              </div>
            )}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-400 flex items-center justify-center shadow-lg shadow-amber-500/20 flex-shrink-0">
                    <Bookmark className="w-[18px] h-[18px] text-white" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white font-nunito truncate">{notesData.title || 'Study Notes'}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-400 font-nunito">{notesData.rows.length} cues</span>
                      <span className="text-[10px] text-slate-300 dark:text-slate-600">|</span>
                      <span className="text-[10px] font-medium font-nunito flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                        {notesData.rows.filter(r => r.importance === 'high').length} key
                      </span>
                      <span className="text-[10px] text-slate-300 dark:text-slate-600">|</span>
                      <span className="text-[10px] uppercase tracking-wider font-medium text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <img src={chrome.runtime.getURL(styleOptions.find(o => o.id === notesStyle)?.iconImg || '')} alt="" className="w-3 h-3 inline-block" />
                        {styleOptions.find(o => o.id === notesStyle)?.label}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setShowStyleDropdown((prev) => !prev); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-xs text-slate-600 dark:text-slate-300 font-medium transition-colors"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Style</span>
                    </button>
                    {showStyleDropdown && (
                      <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-2 z-20 min-w-[160px]">
                        {styleOptions.map((opt) => {
                          const isActive = notesStyle === opt.id;
                          return (
                            <button
                              key={opt.id}
                              onClick={() => {
                                setShowStyleDropdown(false);
                                if (!isActive && notesData) {
                                  handleRegenerateWithStyle(opt.id);
                                } else {
                                  setNotesStyle(opt.id);
                                }
                              }}
                              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                                isActive
                                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                              }`}
                            >
                              <img src={chrome.runtime.getURL(opt.iconImg)} alt="" className="w-4 h-4" />
                              <span>{opt.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleRegenerateClick}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-xs text-slate-600 dark:text-slate-300 font-medium transition-colors disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Regenerate</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExport}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-xs text-slate-600 dark:text-slate-300 font-medium transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Download className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Export'}
                  </button>
                </div>
              </div>
            </div>

            {pageTitle && (
              <div className="px-6 py-2.5 border-b border-slate-100 dark:border-slate-700/50 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-800/30">
                <Globe className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-nunito truncate">{pageTitle}</span>
              </div>
            )}

            {notesStyle === 'cornell' && (
              <CornellView
                data={notesData}
                editingRow={editingRow}
                editValue={editValue}
                savedIndicator={savedIndicator}
                startEditing={startEditing}
                saveEdit={saveEdit}
                setEditValue={setEditValue}
              />
            )}

            {notesStyle === 'mindmap' && (
              <MindMapView data={notesData} title={pageTitle} />
            )}

            {notesStyle === 'flashcards' && (
              <FlashCardsView data={notesData} title={pageTitle} />
            )}

            {notesData.summary && notesStyle !== 'flashcards' && (
              <div className="border-t border-slate-200 dark:border-slate-700">
                <div className="mx-5 my-4 p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-900/15 dark:to-indigo-900/10 border border-blue-100 dark:border-blue-800/30">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                      <Quote className="w-3.5 h-3.5 text-white" />
                    </div>
                    <h4 className="text-xs font-bold text-blue-800 dark:text-blue-300 font-nunito tracking-wide uppercase">
                      Review Summary
                    </h4>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-1 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-400 to-indigo-400 dark:from-blue-500 dark:to-indigo-500 rounded-full opacity-60" />
                    <p className="text-sm text-slate-700 dark:text-slate-200 font-nunito leading-relaxed pl-4 italic">
                      &ldquo;{notesData.summary}&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="border-t border-slate-200 dark:border-slate-700">
              <div className="flex justify-center px-5 py-4">
                <button
                  type="button"
                  onClick={handleRegenerateClick}
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-xs text-slate-600 dark:text-slate-300 font-medium transition-colors disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Regenerate Notes
                </button>
              </div>
            </div>

            <div ref={notesEndRef} />
          </div>
        )}

        {showRegenerateConfirm && (
          <div className="absolute inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-slide-up" style={{ position: 'fixed', inset: 0 }}>
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-sm text-center w-full shadow-2xl border border-slate-200 dark:border-slate-700">
              <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-900 dark:text-white font-nunito mb-2">Regenerate Notes?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-nunito mb-6">
                You have unsaved edits. Regenerating will replace your current notes with a new version.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRegenerateConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-sm text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-all font-nunito"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRegenerate}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-white text-sm font-medium shadow-lg shadow-amber-500/25 transition-all active:scale-[0.98] font-nunito"
                >
                  Regenerate
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
