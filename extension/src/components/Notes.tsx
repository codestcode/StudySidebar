import React, { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '../utils/api';
import { Sparkles, FileText, RotateCcw, Check, Copy, Globe, Loader2, AlertTriangle, Bookmark, Download, Pencil, CheckCircle2, Star, StickyNote, Lightbulb, Quote, Hash, Network } from 'lucide-react';
import { ContextLoader } from './ContextLoader';
import { type PageContext } from '../utils/page';
import { MindMapViewer } from './MindMapViewer';
import '../styles.css';

interface NoteRow {
  id: string;
  cue: string;
  note: string;
  importance: 'high' | 'medium' | 'low';
}

interface NotesData {
  title: string;
  rows: NoteRow[];
  summary: string;
}

const importanceConfig = {
  high: {
    label: 'Key Concept',
    badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-700',
    dotClass: 'bg-amber-500',
    icon: Star,
    borderClass: 'border-l-amber-400 dark:border-l-amber-500',
    headerClass: 'text-amber-700 dark:text-amber-300',
  },
  medium: {
    label: 'Supporting',
    badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-700',
    dotClass: 'bg-blue-400',
    icon: Lightbulb,
    borderClass: 'border-l-blue-400 dark:border-l-blue-500',
    headerClass: 'text-blue-700 dark:text-blue-300',
  },
  low: {
    label: 'Detail',
    badgeClass: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-600',
    dotClass: 'bg-slate-300 dark:bg-slate-600',
    icon: StickyNote,
    borderClass: 'border-l-slate-300 dark:border-l-slate-600',
    headerClass: 'text-slate-600 dark:text-slate-400',
  },
};

export function Notes() {
  const [pageContent, setPageContent] = useState('');
  const [pageTitle, setPageTitle] = useState('');
  const [pageUrl, setPageUrl] = useState('');
  const [pageRead, setPageRead] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notesData, setNotesData] = useState<NotesData | null>(null);
  const [notesId, setNotesId] = useState<string | null>(null);
  const [hasExistingNotes, setHasExistingNotes] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editingRow, setEditingRow] = useState<{ id: string; field: 'cue' | 'note' } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [savedIndicator, setSavedIndicator] = useState<string | null>(null);
  const [exported, setExported] = useState(false);
  
  const [showMindMap, setShowMindMap] = useState(false);
  const [mindMapSyntax, setMindMapSyntax] = useState<string | null>(null);
  const [generatingMindMap, setGeneratingMindMap] = useState(false);
  
  const notesEndRef = useRef<HTMLDivElement>(null);

  const handleContextLoaded = useCallback(async (ctx: PageContext) => {
    setPageContent(ctx.content);
    setPageTitle(ctx.title);
    setPageUrl(ctx.url);
    setPageRead(true);
    setError('');
    await checkExistingNotes(ctx.url);
  }, []);

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
      const result = await api.generateNotes(pageContent, pageTitle, pageUrl);
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

  const handleVisualize = async () => {
    if (mindMapSyntax) {
      setShowMindMap(true);
      return;
    }
    
    if (!pageContent) return;
    
    try {
      setGeneratingMindMap(true);
      setShowMindMap(true);
      const res = await api.generateMindMap(pageContent);
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
                <p className="text-xs text-slate-400 font-nunito">AI-powered Cornell-style study notes</p>
              </div>
            </div>

            <ContextLoader onContextLoaded={handleContextLoaded} onError={setError} />

            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-blue-500/20">
                <Bookmark className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white font-nunito mb-2">Generate Study Notes</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-nunito max-w-[260px] mx-auto mb-6 leading-relaxed">
                Cornell-style notes break down content into cues (keywords/questions), notes (explanations), and a review summary &mdash; perfect for active recall studying.
              </p>
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
          <div className="glass3d rounded-3xl overflow-hidden animate-fade-slide-up">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-400 flex items-center justify-center shadow-lg shadow-amber-500/20 flex-shrink-0">
                    <Bookmark className="w-[18px] h-[18px] text-white" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white font-nunito truncate">{notesData.title || 'Cornell Notes'}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-400 font-nunito">{notesData.rows.length} cues</span>
                      <span className="text-[10px] text-slate-300 dark:text-slate-600">|</span>
                      <span className="text-[10px] font-medium font-nunito flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                        {notesData.rows.filter(r => r.importance === 'high').length} key
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
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
                    onClick={handleVisualize}
                    disabled={generatingMindMap}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 text-xs text-purple-600 dark:text-purple-400 font-medium transition-colors"
                  >
                    {generatingMindMap ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Network className="w-3.5 h-3.5" />}
                    Visualize
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

            <div className="cornell-header-row hidden md:flex px-6 py-2 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-700/50 text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 font-nunito">
              <div className="w-[32%] flex-shrink-0">Cue Column</div>
              <div className="w-[4%] flex-shrink-0 text-center">|</div>
              <div className="flex-1 pl-4">Notes Column</div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {notesData.rows.map((row, index) => {
                const config = importanceConfig[row.importance] || importanceConfig.low;
                const ImportanceIcon = config.icon;
                return (
                  <div
                    key={row.id}
                    className={`cornell-row ${config.borderClass} hover:bg-slate-50/60 dark:hover:bg-slate-800/20 transition-all duration-150`}
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <div className="cornell-cue-column">
                      <div className="flex items-start gap-2">
                        <span className="text-[10px] text-slate-300 dark:text-slate-600 font-mono font-medium mt-1 flex-shrink-0 w-4">
                          <Hash className="w-3 h-3 inline" />
                        </span>
                        <div className="flex-1 min-w-0">
                          {editingRow?.id === row.id && editingRow?.field === 'cue' ? (
                            <textarea
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={saveEdit}
                              autoFocus
                              className="w-full text-sm font-bold text-slate-900 dark:text-white font-nunito bg-white dark:bg-slate-700 rounded-lg px-2 py-1.5 resize-none outline-none ring-2 ring-amber-400 dark:ring-amber-500 leading-snug"
                              rows={2}
                            />
                          ) : (
                            <div
                              onClick={() => startEditing(row.id, 'cue', row.cue)}
                              className="text-sm font-bold text-slate-900 dark:text-white font-nunito leading-snug cursor-pointer hover:text-amber-600 dark:hover:text-amber-400 transition-colors group"
                            >
                              {row.cue}
                              <Pencil className="w-3 h-3 inline-block ml-1 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                              {savedIndicator === row.id && editingRow?.field === 'cue' && (
                                <CheckCircle2 className="w-3.5 h-3.5 inline-block ml-1 text-emerald-500 animate-fade-slide-up align-text-bottom" />
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-1.5 mt-2">
                            <ImportanceIcon className={`w-3 h-3 ${row.importance === 'high' ? 'text-amber-500' : row.importance === 'medium' ? 'text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
                            <span className={`text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-full border ${config.badgeClass}`}>
                              {config.label}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="cornell-divider-column">
                      <div className="cornell-divider" />
                    </div>

                    <div className="cornell-note-column">
                      {editingRow?.id === row.id && editingRow?.field === 'note' ? (
                        <textarea
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={saveEdit}
                          autoFocus
                          className="w-full text-sm text-slate-700 dark:text-slate-200 font-nunito leading-relaxed bg-white dark:bg-slate-700 rounded-lg px-3 py-2 resize-none outline-none ring-2 ring-amber-400 dark:ring-amber-500"
                          rows={4}
                        />
                      ) : (
                        <div
                          onClick={() => startEditing(row.id, 'note', row.note)}
                          className="text-sm text-slate-700 dark:text-slate-200 font-nunito leading-relaxed cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors group whitespace-pre-wrap"
                        >
                          {row.note}
                          <Pencil className="w-3 h-3 inline-block ml-1.5 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                          {savedIndicator === row.id && editingRow?.field === 'note' && (
                            <CheckCircle2 className="w-3.5 h-3.5 inline-block ml-1 text-emerald-500 animate-fade-slide-up align-text-bottom" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {notesData.summary && (
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
