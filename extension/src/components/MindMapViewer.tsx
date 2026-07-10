import React, { useEffect, useRef, useState, useCallback } from 'react';
import mermaid from 'mermaid';
import { Loader2, ZoomIn, ZoomOut, RotateCcw, Maximize2 } from 'lucide-react';

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
});

interface MindMapViewerProps {
  syntax: string;
}

export function MindMapViewer({ syntax }: MindMapViewerProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const svgWrapperRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const posStart = useRef({ x: 0, y: 0 });
  const [svgLoaded, setSvgLoaded] = useState(false);

  const MIN_SCALE = 0.1;
  const MAX_SCALE = 8;

  const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const rect = outerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    setScale(prev => {
      const newScale = clamp(prev + delta * prev, MIN_SCALE, MAX_SCALE);
      const ratio = newScale / prev;
      setPosition(pos => ({
        x: mouseX - (mouseX - pos.x) * ratio,
        y: mouseY - (mouseY - pos.y) * ratio,
      }));
      return newScale;
    });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    posStart.current = { ...position };
  }, [position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: posStart.current.x + (e.clientX - dragStart.current.x),
      y: posStart.current.y + (e.clientY - dragStart.current.y),
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  const lastTouchDist = useRef(0);

  const handleTouchStartFn = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      posStart.current = { ...position };
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist.current = Math.sqrt(dx * dx + dy * dy);
    }
  }, [position]);

  const handleTouchMoveFn = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      setPosition({
        x: posStart.current.x + (e.touches[0].clientX - dragStart.current.x),
        y: posStart.current.y + (e.touches[0].clientY - dragStart.current.y),
      });
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (lastTouchDist.current > 0) {
        const ratio = dist / lastTouchDist.current;
        setScale(prev => clamp(prev * ratio, MIN_SCALE, MAX_SCALE));
      }
      lastTouchDist.current = dist;
    }
  }, [isDragging]);

  const handleTouchEndFn = useCallback(() => setIsDragging(false), []);

  const zoomIn = () => setScale(prev => clamp(prev * 1.3, MIN_SCALE, MAX_SCALE));
  const zoomOut = () => setScale(prev => clamp(prev / 1.3, MIN_SCALE, MAX_SCALE));

  const fitToContainer = useCallback(() => {
    if (!outerRef.current || !svgWrapperRef.current) return;
    const outer = outerRef.current.getBoundingClientRect();
    const svg = svgWrapperRef.current.querySelector('svg');
    if (!svg) return;
    const svgRect = svg.getBoundingClientRect();
    if (svgRect.width === 0 || svgRect.height === 0) return;
    const scaleX = (outer.width - 40) / svgRect.width;
    const scaleY = (outer.height - 40) / svgRect.height;
    const fitScale = clamp(Math.min(scaleX, scaleY), MIN_SCALE, MAX_SCALE);
    setScale(fitScale);
    setPosition({ x: 0, y: 0 });
  }, []);

  const resetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  useEffect(() => {
    let isMounted = true;

    const renderMindMap = async () => {
      if (!svgWrapperRef.current || !syntax) return;

      try {
        setLoading(true);
        setError(null);
        setSvgLoaded(false);

        svgWrapperRef.current.innerHTML = '';

        const id = `mermaid-${Date.now()}`;
        const { svg } = await mermaid.render(id, syntax);

        if (isMounted) {
          svgWrapperRef.current.innerHTML = svg;
          const renderedSvg = svgWrapperRef.current.querySelector('svg');
          if (renderedSvg) {
            renderedSvg.style.width = '100%';
            renderedSvg.style.height = '100%';
            renderedSvg.style.maxWidth = 'none';
            renderedSvg.style.maxHeight = 'none';
          }
          setLoading(false);
          setSvgLoaded(true);
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
    return () => { isMounted = false; };
  }, [syntax]);

  useEffect(() => {
    if (svgLoaded) {
      const timer = setTimeout(fitToContainer, 50);
      return () => clearTimeout(timer);
    }
  }, [svgLoaded, fitToContainer]);

  if (!syntax) {
    return <div className="text-center text-slate-500 py-8 text-sm">No mind map data available.</div>;
  }

  return (
    <div
      ref={outerRef}
      className="relative w-full h-full min-h-[350px] bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden select-none"
      style={{ cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none' }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStartFn}
      onTouchMove={handleTouchMoveFn}
      onTouchEnd={handleTouchEndFn}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-20">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      )}

      <div className="absolute top-2 right-2 z-20 flex items-center gap-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg p-1">
        <button onClick={zoomIn} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors" title="Zoom in">
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 min-w-[36px] text-center">
          {Math.round(scale * 100)}%
        </span>
        <button onClick={zoomOut} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors" title="Zoom out">
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-4 bg-slate-200 dark:bg-slate-600" />
        <button onClick={fitToContainer} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors" title="Fit to container">
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
        <button onClick={resetView} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors" title="Reset view">
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {error ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-red-500 text-sm text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="font-semibold mb-1">Failed to render diagram</p>
            <code className="text-xs bg-red-100 dark:bg-red-900/40 px-2 py-1 rounded block max-w-full overflow-x-auto">
              {error}
            </code>
          </div>
        </div>
      ) : (
        <div
          ref={svgWrapperRef}
          className="absolute inset-0 origin-top-left"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.12s ease-out',
            width: '100%',
            height: '100%',
          }}
        />
      )}
    </div>
  );
}
