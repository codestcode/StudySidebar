import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, Globe, FileText, Check, RotateCcw, UploadCloud, AlertTriangle, Upload } from 'lucide-react';
import { fetchPageContent, type PageContext } from '../utils/page';
import { api } from '../utils/api';

interface ContextLoaderProps {
  onContextLoaded: (context: PageContext) => void;
  onError: (error: string) => void;
  compact?: boolean;
}

export function ContextLoader({ onContextLoaded, onError, compact = false }: ContextLoaderProps) {
  const [loading, setLoading] = useState(true);
  const [context, setContext] = useState<PageContext | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadContext = useCallback(async () => {
    setLoading(true);
    onError('');
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tab = tabs[0];
      if (!tab) throw new Error('No active tab found');
      
      const newContext = await fetchPageContent(tab);
      setContext(newContext);
      onContextLoaded(newContext);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to read page content');
    } finally {
      setLoading(false);
    }
  }, [onContextLoaded, onError]);

  useEffect(() => {
    loadContext();
  }, [loadContext]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      onError('Only PDF files are supported.');
      return;
    }

    await processPdf(file);
  };

  const processPdf = async (file: File) => {
    setUploading(true);
    onError('');
    try {
      const result = await api.extractPdfText(file);
      const newContext: PageContext = {
        content: result.text,
        title: file.name,
        url: 'local://pdf',
        source: 'pdf'
      };
      setContext(newContext);
      onContextLoaded(newContext);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to extract text from PDF');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      onError('Only PDF files are supported.');
      return;
    }
    processPdf(file);
    e.target.value = '';
  };

  if (loading || uploading) {
    return (
      <div className={`flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 ${compact ? 'mb-2' : 'mb-4'}`}>
        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 font-nunito">
            {uploading ? 'Extracting PDF text...' : 'Reading page content...'}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-nunito">
            {uploading ? 'Parsing document' : 'Extracting text from the current tab'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={handleFileSelect}
      />
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex items-center gap-3 p-4 rounded-2xl border transition-colors ${
          isDragging 
            ? 'bg-blue-50/80 dark:bg-blue-900/20 border-blue-400 border-dashed' 
            : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
        } ${compact ? 'mb-2' : 'mb-4'}`}
      >
        {isDragging ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl z-10 border-2 border-dashed border-blue-500">
            <p className="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
              <UploadCloud className="w-5 h-5" />
              Drop PDF to load context
            </p>
          </div>
        ) : null}

        {context ? (
          compact ? (
            <div className="flex items-center gap-2 w-full">
              <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-nunito flex-1 truncate">
                {context.title}
              </span>
              <button
                type="button"
                onClick={loadContext}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-[11px] text-slate-600 dark:text-slate-300 font-medium transition-colors flex-shrink-0"
                title="Reload from current tab"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          ) : (
        <>
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
            {context.source === 'pdf' ? (
              <FileText className="w-4 h-4 text-white" />
            ) : context.source === 'youtube' ? (
              <Globe className="w-4 h-4 text-white" />
            ) : (
              <Check className="w-4 h-4 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 font-nunito">
              {context.source === 'pdf' ? 'PDF Loaded' : context.source === 'youtube' ? 'YouTube Transcript Loaded' : 'Page content loaded'}
            </p>
            <p className="text-xs text-emerald-500 dark:text-emerald-400 font-nunito truncate">
              {context.title} — {context.content.length.toLocaleString()} chars
            </p>
          </div>
          <button
            type="button"
            onClick={loadContext}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-800 hover:bg-emerald-200 dark:hover:bg-emerald-700 text-xs text-emerald-700 dark:text-emerald-300 font-medium transition-colors flex-shrink-0"
            title="Reload from current tab"
          >
            <RotateCcw className="w-3 h-3" />
            Refresh
          </button>
        </>
        )
      ) : (
        <div className="flex flex-col gap-3 w-full">
          <div className="flex items-center gap-3 w-full">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 flex-1">
              No context loaded. Drag a PDF here or upload from your computer.
            </p>
            <button
              type="button"
              onClick={loadContext}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-xs text-slate-700 dark:text-slate-300 font-medium transition-colors flex-shrink-0"
            >
              <RotateCcw className="w-3 h-3" />
              Retry
            </button>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-xs text-blue-600 dark:text-blue-400 font-medium transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload PDF from computer
          </button>
        </div>
      )}
      </div>
    </>
  );
}
