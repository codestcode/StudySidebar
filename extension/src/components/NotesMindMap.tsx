import React, { useState } from 'react';
import { Brain } from 'lucide-react';
import { type NotesData, importanceConfig, renderNoteText } from './NotesShared';

export function MindMapView({ data, title }: { data: NotesData; title: string }) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  return (
    <div className="mindmap-container animate-fade-slide-up">
      <div className="mindmap-root">
        <div className="mindmap-root-node">
          <Brain className="w-5 h-5" />
          <span>{data.title || title || 'Mind Map'}</span>
        </div>

        <div className="mindmap-branches">
          {data.rows.map((row, i) => {
            const config = importanceConfig[row.importance] || importanceConfig.low;
            const ImportanceIcon = config.icon;
            const nodeClass = row.importance === 'high' ? 'mindmap-node-high' : row.importance === 'medium' ? 'mindmap-node-medium' : 'mindmap-node-low';

            return (
              <div key={row.id} className="mindmap-branch">
                <div className="mindmap-branch-line" />
                <div
                  className={`mindmap-node ${nodeClass}`}
                  onClick={() => setSelectedNode(selectedNode === row.id ? null : row.id)}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <ImportanceIcon className="w-3 h-3 inline-block mr-1.5" />
                  <span className="mindmap-node-label">{row.cue}</span>
                </div>
                <div className={`mindmap-detail ${selectedNode === row.id ? 'mindmap-detail-visible' : ''}`}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <ImportanceIcon className={`w-3 h-3 ${row.importance === 'high' ? 'text-amber-500' : row.importance === 'medium' ? 'text-blue-400' : 'text-slate-400'}`} />
                    <span className={`text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-full border ${config.badgeClass}`}>
                      {config.label}
                    </span>
                  </div>
                  <div className="mindmap-note-text">{renderNoteText(row.note)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
