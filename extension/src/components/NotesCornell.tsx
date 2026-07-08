import React from 'react';
import { Hash, Pencil, CheckCircle2 } from 'lucide-react';
import { type NotesData, importanceConfig, renderNoteText } from './NotesShared';

interface CornellViewProps {
  data: NotesData;
  editingRow: { id: string; field: 'cue' | 'note' } | null;
  editValue: string;
  savedIndicator: string | null;
  startEditing: (rowId: string, field: 'cue' | 'note', value: string) => void;
  saveEdit: () => void;
  setEditValue: (v: string) => void;
}

export function CornellView({ data, editingRow, editValue, savedIndicator, startEditing, saveEdit, setEditValue }: CornellViewProps) {
  return (
    <>
      <div className="cornell-header-row hidden md:flex px-6 py-2 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-700/50 text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 font-nunito">
        <div className="w-[32%] flex-shrink-0">Cue Column</div>
        <div className="w-[4%] flex-shrink-0 text-center">|</div>
        <div className="flex-1 pl-4">Notes Column</div>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
        {data.rows.map((row, index) => {
          const config = importanceConfig[row.importance] || importanceConfig.low;
          const ImportanceIcon = config.icon;
          const isEditingCue = editingRow?.id === row.id && editingRow?.field === 'cue';
          const isEditingNote = editingRow?.id === row.id && editingRow?.field === 'note';

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
                    {isEditingCue ? (
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
                        {savedIndicator === row.id && isEditingCue && (
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
                {isEditingNote ? (
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
                    {renderNoteText(row.note)}
                    <Pencil className="w-3 h-3 inline-block ml-1.5 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {savedIndicator === row.id && isEditingNote && (
                      <CheckCircle2 className="w-3.5 h-3.5 inline-block ml-1 text-emerald-500 animate-fade-slide-up align-text-bottom" />
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
