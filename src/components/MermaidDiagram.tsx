import React, { useEffect, useRef, useState, useCallback, useId } from 'react';
import {
  Copy,
  Check,
  Code,
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Download,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface MermaidDiagramProps {
  code: string;
  language?: 'zh' | 'en';
}

// Track mermaid initialization
let mermaidInitialized = false;

async function getMermaid() {
  const mermaidModule = await import('mermaid');
  const mermaid = mermaidModule.default;
  if (!mermaidInitialized) {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'loose',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      theme: 'neutral',
      themeVariables: {
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        fontSize: '13px',
        primaryColor: '#ffffff',
        primaryTextColor: '#171717',
        primaryBorderColor: '#a3a3a3',
        lineColor: '#525252',
        secondaryColor: '#fafafa',
        tertiaryColor: '#f5f5f5',
        nodeBorder: '#737373',
        mainBkg: '#ffffff',
        clusterBkg: '#fafafa',
        clusterBorder: '#d4d4d4',
        edgeLabelBackground: '#ffffff',
        stateLabelColor: '#171717',
        stateBkg: '#ffffff',
        labelColor: '#171717',
      },
      flowchart: {
        htmlLabels: true,
        curve: 'basis',
        nodeSpacing: 40,
        rankSpacing: 45,
        padding: 15,
      },
      sequence: {
        diagramMarginX: 20,
        diagramMarginY: 20,
        actorMargin: 50,
        width: 140,
        height: 44,
        boxMargin: 10,
        boxTextMargin: 5,
        noteMargin: 10,
        messageMargin: 30,
        mirrorActors: false,
        bottomMarginAdj: 1,
        useMaxWidth: true,
        showSequenceNumbers: true,
      },
      state: {
        sizeUnit: 20,
        padding: 12,
        dividerMargin: 10,
      },
    });
    mermaidInitialized = true;
  }
  return mermaid;
}

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ code, language = 'zh' }) => {
  const rawId = useId().replace(/:/g, '');
  const containerId = `mermaid-${rawId}`;
  const [svgHtml, setSvgHtml] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'diagram' | 'code'>('diagram');
  const [copied, setCopied] = useState<boolean>(false);
  const [scale, setScale] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panPosition, setPanPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const startPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);
  const fullscreenModalRef = useRef<HTMLDivElement>(null);
  const fullscreenCloseRef = useRef<HTMLButtonElement>(null);
  const previousFullscreenFocusRef = useRef<HTMLElement | null>(null);

  const cleanCode = code.trim();

  // Render diagram via mermaid
  const renderDiagram = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const mermaid = await getMermaid();
      const uniqueRenderId = `diagram-${rawId}-${Date.now()}`;
      // Clean and validate code string
      const { svg } = await mermaid.render(uniqueRenderId, cleanCode);
      setSvgHtml(svg);
    } catch (err: unknown) {
      console.warn('Mermaid rendering failed:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  }, [cleanCode, rawId]);

  useEffect(() => {
    renderDiagram();
  }, [renderDiagram]);

  // Handle copy diagram code
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(cleanCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  // Handle download SVG
  const handleDownloadSvg = () => {
    if (!svgHtml) return;
    const blob = new Blob([svgHtml], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `flowchart-${rawId}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Zoom controls
  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.4));
  const handleResetZoom = () => {
    setScale(1);
    setPanPosition({ x: 0, y: 0 });
  };

  // Pan handlers for fullscreen
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isFullscreen) return;
    setIsPanning(true);
    startPanRef.current = { x: e.clientX - panPosition.x, y: e.clientY - panPosition.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning || !isFullscreen) return;
    setPanPosition({
      x: e.clientX - startPanRef.current.x,
      y: e.clientY - startPanRef.current.y,
    });
  };

  const handleMouseUp = () => setIsPanning(false);

  // Keyboard navigation for fullscreen modal
  useEffect(() => {
    if (isFullscreen) {
      previousFullscreenFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      window.requestAnimationFrame(() => fullscreenCloseRef.current?.focus());
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFullscreen) return;
      if (e.key === 'Escape') {
        setIsFullscreen(false);
        handleResetZoom();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      } else if (e.key === '0') {
        handleResetZoom();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (isFullscreen) {
        previousFullscreenFocusRef.current?.focus();
        previousFullscreenFocusRef.current = null;
      }
    };
  }, [isFullscreen]);

  const handleFullscreenKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    const focusable = fullscreenModalRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable || focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const t = {
    diagramView: language === 'zh' ? '流程图' : 'Diagram',
    codeView: language === 'zh' ? '源码' : 'Source',
    zoomIn: language === 'zh' ? '放大' : 'Zoom In',
    zoomOut: language === 'zh' ? '缩小' : 'Zoom Out',
    reset: language === 'zh' ? '重置' : 'Reset',
    fullscreen: language === 'zh' ? '全屏查看' : 'Fullscreen',
    exitFullscreen: language === 'zh' ? '退出全屏 (Esc)' : 'Exit Fullscreen (Esc)',
    copyCode: language === 'zh' ? '复制 Mermaid 源码' : 'Copy Mermaid Code',
    copied: language === 'zh' ? '已复制' : 'Copied',
    downloadSvg: language === 'zh' ? '导出 SVG' : 'Export SVG',
    rendering: language === 'zh' ? '流程图渲染中...' : 'Rendering diagram...',
    renderError: language === 'zh' ? '流程图语法解析失败' : 'Diagram Parsing Error',
    retry: language === 'zh' ? '重试' : 'Retry',
    dragTip: language === 'zh' ? '按住鼠标左键可拖拽平移' : 'Click and drag to pan',
  };

  return (
    <>
      <div
        id={containerId}
        ref={containerRef}
        className="my-6 rounded-lg border border-neutral-200 bg-white shadow-2xs overflow-hidden flex flex-col transition-all"
      >
        {/* Header Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-neutral-50/90 border-b border-neutral-200 text-xs text-neutral-600 select-none">
          {/* View Mode Switcher */}
          <div className="inline-flex rounded-md bg-neutral-200/70 p-0.5 text-xs font-medium" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'diagram'}
              onClick={() => setViewMode('diagram')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-all ${
                viewMode === 'diagram'
                  ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{t.diagramView}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'code'}
              onClick={() => setViewMode('code')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-all ${
                viewMode === 'code'
                  ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>{t.codeView}</span>
            </button>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-1">
            {viewMode === 'diagram' && !error && !isLoading && (
              <>
                <button
                  type="button"
                  onClick={handleZoomOut}
                  aria-label={t.zoomOut}
                  title={t.zoomOut}
                  className="p-1 rounded text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60 transition-colors focus-visible:ring-1 focus-visible:ring-neutral-900"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono text-neutral-500 px-1 select-none">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  aria-label={t.zoomIn}
                  title={t.zoomIn}
                  className="p-1 rounded text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60 transition-colors focus-visible:ring-1 focus-visible:ring-neutral-900"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleResetZoom}
                  aria-label={t.reset}
                  title={t.reset}
                  className="p-1 rounded text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60 transition-colors focus-visible:ring-1 focus-visible:ring-neutral-900"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <div className="w-px h-3.5 bg-neutral-200 mx-0.5" />
                <button
                  type="button"
                  onClick={handleDownloadSvg}
                  aria-label={t.downloadSvg}
                  title={t.downloadSvg}
                  className="p-1 rounded text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60 transition-colors focus-visible:ring-1 focus-visible:ring-neutral-900"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsFullscreen(true)}
                  aria-label={t.fullscreen}
                  title={t.fullscreen}
                  className="p-1 rounded text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60 transition-colors focus-visible:ring-1 focus-visible:ring-neutral-900"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
                <div className="w-px h-3.5 bg-neutral-200 mx-0.5" />
              </>
            )}

            <button
              type="button"
              onClick={handleCopyCode}
              aria-label={t.copyCode}
              title={t.copyCode}
              className="flex items-center gap-1 p-1 rounded text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60 transition-colors focus-visible:ring-1 focus-visible:ring-neutral-900 text-xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-[11px] text-emerald-600 font-medium">{t.copied}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="text-[11px]">{t.copyCode}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content Area */}
        {viewMode === 'diagram' ? (
          <div className="relative min-h-[160px] p-4 bg-white overflow-hidden flex items-center justify-center">
            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-neutral-400 py-8">
                <RefreshCw className="w-4 h-4 animate-spin text-neutral-500" />
                <span>{t.rendering}</span>
              </div>
            )}

            {error ? (
              <div className="w-full p-4 bg-red-50/70 border border-red-200 rounded-md text-xs text-red-800">
                <div className="flex items-center gap-2 font-semibold mb-1">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{t.renderError}</span>
                  <button
                    type="button"
                    onClick={renderDiagram}
                    className="ml-auto underline hover:text-red-950 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    {t.retry}
                  </button>
                </div>
                <p className="text-[11px] font-mono text-red-600 whitespace-pre-wrap mt-1 overflow-x-auto">
                  {error}
                </p>
                <div className="mt-3 pt-2 border-t border-red-200/60">
                  <pre className="text-[11px] font-mono bg-white p-2 rounded border border-red-200 overflow-x-auto text-neutral-800">
                    {cleanCode}
                  </pre>
                </div>
              </div>
            ) : (
              !isLoading && (
                <div
                  className="w-full overflow-x-auto overflow-y-hidden py-2 flex justify-center items-center transition-transform"
                  style={{
                    transform: `scale(${scale})`,
                    transformOrigin: 'top center',
                  }}
                  dangerouslySetInnerHTML={{ __html: svgHtml }}
                />
              )
            )}
          </div>
        ) : (
          <div className="bg-neutral-950 p-4 overflow-x-auto text-xs font-mono text-neutral-200 leading-relaxed">
            <pre className="m-0">
              <code>{cleanCode}</code>
            </pre>
          </div>
        )}
      </div>

      {/* Fullscreen Lightbox Modal */}
      {isFullscreen && (
        <div
          ref={fullscreenModalRef}
          role="dialog"
          aria-modal="true"
          aria-label={t.diagramView}
          onKeyDown={handleFullscreenKeyDown}
          className="fixed inset-0 z-50 flex flex-col bg-neutral-950/90 backdrop-blur-xs text-neutral-100 animate-in fade-in duration-150"
        >
          {/* Top Controls Bar */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-neutral-800 bg-neutral-900/95 select-none">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                {t.diagramView}
              </span>
              <span className="text-xs text-neutral-500 font-mono hidden sm:inline">
                {t.dragTip}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleZoomOut}
                aria-label={t.zoomOut}
                title={t.zoomOut}
                className="p-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors focus-visible:ring-1 focus-visible:ring-neutral-400"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono px-2 py-0.5 bg-neutral-800 rounded text-neutral-300">
                {Math.round(scale * 100)}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                aria-label={t.zoomIn}
                title={t.zoomIn}
                className="p-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors focus-visible:ring-1 focus-visible:ring-neutral-400"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                aria-label={t.reset}
                title={t.reset}
                className="p-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors focus-visible:ring-1 focus-visible:ring-neutral-400"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-neutral-700 mx-1" />
              <button
                type="button"
                onClick={handleDownloadSvg}
                aria-label={t.downloadSvg}
                title={t.downloadSvg}
                className="p-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors focus-visible:ring-1 focus-visible:ring-neutral-400"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsFullscreen(false);
                  handleResetZoom();
                }}
                ref={fullscreenCloseRef}
                aria-label={t.exitFullscreen}
                title={t.exitFullscreen}
                className="p-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors focus-visible:ring-1 focus-visible:ring-neutral-400"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Fullscreen Canvas */}
          <div
            ref={fullscreenContainerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className={`flex-1 overflow-hidden p-6 flex items-center justify-center bg-white ${
              isPanning ? 'cursor-grabbing select-none' : 'cursor-grab'
            }`}
          >
            <div
              style={{
                transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${scale})`,
                transformOrigin: 'center center',
                transition: isPanning ? 'none' : 'transform 0.1s ease-out',
              }}
              dangerouslySetInnerHTML={{ __html: svgHtml }}
            />
          </div>
        </div>
      )}
    </>
  );
};
