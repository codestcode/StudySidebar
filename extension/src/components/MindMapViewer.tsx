import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Loader2 } from 'lucide-react';

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
});

interface MindMapViewerProps {
  syntax: string;
}

export function MindMapViewer({ syntax }: MindMapViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const renderMindMap = async () => {
      if (!containerRef.current || !syntax) return;
      
      try {
        setLoading(true);
        setError(null);
        
        containerRef.current.innerHTML = '';
        
        const id = `mermaid-${Date.now()}`;
        const { svg } = await mermaid.render(id, syntax);
        
        if (isMounted) {
          containerRef.current.innerHTML = svg;
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Mermaid render error:', err);
          setError(err.message || 'Failed to render mind map');
          setLoading(false);
        }
      }
    };

    renderMindMap();

    return () => {
      isMounted = false;
    };
  }, [syntax]);

  if (!syntax) {
    return <div className="text-center text-slate-500 py-8 text-sm">No mind map data available.</div>;
  }

  return (
    <div className="relative w-full h-full min-h-[300px] bg-slate-50 dark:bg-slate-900 rounded-xl overflow-auto border border-slate-200 dark:border-slate-700 flex items-center justify-center p-4">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      )}
      
      {error ? (
        <div className="text-red-500 text-sm text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p className="font-semibold mb-1">Failed to render diagram</p>
          <code className="text-xs bg-red-100 dark:bg-red-900/40 px-2 py-1 rounded block max-w-full overflow-x-auto">
            {error}
          </code>
        </div>
      ) : (
        <div 
          ref={containerRef}
          className="mermaid-container w-full h-full flex items-center justify-center [&>svg]:max-w-full [&>svg]:h-auto [&>svg]:max-h-full"
        />
      )}
    </div>
  );
}
