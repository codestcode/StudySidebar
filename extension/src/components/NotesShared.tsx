import React from 'react';
import { Star, Lightbulb, StickyNote } from 'lucide-react';

export type NotesStyle = 'cornell' | 'mindmap' | 'flashcards';

export interface NoteRow {
  id: string;
  cue: string;
  note: string;
  importance: 'high' | 'medium' | 'low';
}

export interface NotesData {
  title: string;
  rows: NoteRow[];
  summary: string;
}

export interface StyleOption {
  id: NotesStyle;
  label: string;
  icon: string;
  iconImg: string;
  desc: string;
}

export const styleOptions: StyleOption[] = [
  { id: 'cornell', label: 'Cornell', icon: '📋', iconImg: 'images/wirte.png', desc: 'Two-column study notes' },
  { id: 'mindmap', label: 'Mind Map', icon: '🧠', iconImg: 'images/mind-mapping.png', desc: 'Visual node-based layout' },
  { id: 'flashcards', label: 'Flash Cards', icon: '🃏', iconImg: 'images/blackjack.png', desc: 'Flip cards for recall' },
];

export const importanceConfig = {
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

function detectLanguage(code: string): string {
  const langPatterns: [RegExp, string][] = [
    [/import\s+React|useState|useEffect|jsx|tsx|\.tsx?\b/, 'typescript'],
    [/\/\/ @ts-nocheck|interface\s+\w+|type\s+\w+/, 'typescript'],
    [/function\s+\w+\s*\(|const\s+\w+\s*=\s*\(|=>\s*{/, 'javascript'],
    [/def\s+\w+\s*\(|import\s+\w+|from\s+\w+\s+import/, 'python'],
    [/public\s+(class|static|void)|System\.out|@Override/, 'java'],
    [/#include|int\s+main|printf|cout/, 'cpp'],
    [/<!DOCTYPE|<html|<div|<span|<body/, 'html'],
    [/{[\s\S]*:[\s\S]*;[\s\S]*}/, 'css'],
    [/SELECT\s+|FROM\s+|WHERE\s+|INSERT\s+/, 'sql'],
    [/^(\s*#|\s*\/\/)/, 'bash'],
  ];
  for (const [pattern, lang] of langPatterns) {
    if (pattern.test(code)) return lang;
  }
  return 'text';
}

export function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="note-code-block my-2">
      <div className="note-code-header">
        <div className="flex items-center gap-2">
          <div className="note-code-dots">
            <span className="note-code-dot note-code-dot-red" />
            <span className="note-code-dot note-code-dot-yellow" />
            <span className="note-code-dot note-code-dot-green" />
          </div>
          <span className="note-code-lang">{language || 'code'}</span>
        </div>
        <button onClick={handleCopy} className="note-code-copy-btn">
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="note-code-content">{code}</pre>
    </div>
  );
}

function renderInlineText(text: string) {
  const inlineCodeRegex = /`([^`]+)`/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = inlineCodeRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={`t${lastIndex}`}>{text.slice(lastIndex, match.index)}</span>);
    }
    parts.push(
      <code key={`c${match.index}`} className="bg-slate-100 dark:bg-slate-700 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded text-xs font-mono">
        {match[1]}
      </code>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(<span key={`t${lastIndex}`}>{text.slice(lastIndex)}</span>);
  }

  return <>{parts}</>;
}

export function renderNoteText(text: string) {
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(renderInlineText(text.slice(lastIndex, match.index)));
    }
    const lang = match[1] || detectLanguage(match[2]);
    parts.push(
      <CodeBlock key={match.index} code={match[2].trim()} language={lang} />
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(renderInlineText(text.slice(lastIndex)));
  }

  return parts.length > 0 ? parts : renderInlineText(text);
}
