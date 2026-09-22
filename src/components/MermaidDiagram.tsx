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

interface DiagramSize {
  width: number;
  height: number;
}

const DEFAULT_DIAGRAM_SIZE: DiagramSize = { width: 800, height: 450 };

function prepareSvg(svgSource: string, titleId: string, descId: string, language: 'zh' | 'en') {
  // Mermaid sanitizes labels in strict mode. This second boundary strips
  // executable markup while preserving XHTML used for visible node labels.
  const documentNode = new DOMParser().parseFromString(svgSource, 'text/html');
  const svg = documentNode.querySelector('svg');

  if (!svg) {
    throw new Error(language === 'zh' ? 'Mermaid 未生成有效的 SVG' : 'Mermaid did not produce a valid SVG');
  }

  svg.querySelectorAll('script, iframe, object, embed, link, meta').forEach(node => node.remove());
  svg.querySelectorAll('*').forEach(element => {
    for (const attribute of [...element.attributes]) {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim().toLowerCase();
      if (name.startsWith('on') || ((name === 'href' || name === 'xlink:href') && value.startsWith('javascript:'))) {
        element.removeAttribute(attribute.name);
      }
    }
  });

  const viewBox = (svg.getAttribute('viewBox') || '')
    .split(/[\s,]+/)
    .map(Number);
  const widthAttribute = Number.parseFloat(svg.getAttribute('width') || '');
  const heightAttribute = Number.parseFloat(svg.getAttribute('height') || '');
  const width = viewBox.length === 4 && viewBox[2] > 0
    ? viewBox[2]
    : Number.isFinite(widthAttribute) && widthAttribute > 0
      ? widthAttribute
      : DEFAULT_DIAGRAM_SIZE.width;
  const height = viewBox.length === 4 && viewBox[3] > 0
    ? viewBox[3]
    : Number.isFinite(heightAttribute) && heightAttribute > 0
      ? heightAttribute
      : DEFAULT_DIAGRAM_SIZE.height;

  if (!svg.hasAttribute('viewBox')) {
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  }

  svg.removeAttribute('style');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  // Mermaid's generated SVG can contain labels outside the node geometry.
  // Keep the root overflow visible so a browser does not clip those labels
  // after the SVG is placed in a scrollable stage.
  svg.setAttribute('overflow', 'visible');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-labelledby', `${titleId} ${descId}`);

  svg.querySelectorAll(':scope > title, :scope > desc').forEach(node => node.remove());
  const title = documentNode.createElementNS('http://www.w3.org/2000/svg', 'title');
  title.id = titleId;
  title.textContent = language === 'zh' ? '文档流程图' : 'Document diagram';
  const description = documentNode.createElementNS('http://www.w3.org/2000/svg', 'desc');
  description.id = descId;
  description.textContent = language === 'zh'
    ? '根据当前文档中的 Mermaid 源码生成，可缩放并全屏查看。'
    : 'Generated from the Mermaid source in this document, with zoom and fullscreen controls.';
  svg.insertBefore(description, svg.firstChild);
  svg.insertBefore(title, svg.firstChild);

  return {
    svg: svg.outerHTML,
    size: { width, height },
  };
}

const RenderedSvg: React.FC<{ svgHtml: string; className?: string }> = ({ svgHtml, className }) => {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const documentNode = new DOMParser().parseFromString(svgHtml, 'text/html');
    const svg = documentNode.querySelector('svg');
    if (!rootRef.current || !svg) return;
    rootRef.current.replaceChildren(svg);
    return () => rootRef.current?.replaceChildren();
  }, [svgHtml]);

  return <div ref={rootRef} className={className} />;
};

// Track mermaid initialization
let mermaidInitialized = false;
let mermaidRenderQueue: Promise<void> = Promise.resolve();
let mermaidRenderSequence = 0;

async function getMermaid() {
  const mermaidModule = await import('mermaid');
  const mermaid = mermaidModule.default;
  if (!mermaidInitialized) {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      theme: 'neutral',
      themeVariables: {
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        fontSize: '14px',
        primaryColor: '#ffffff',
        primaryTextColor: '#172033',
        primaryBorderColor: '#64748b',
        lineColor: '#64748b',
        secondaryColor: '#f8fafc',
        tertiaryColor: '#eff6ff',
        nodeBorder: '#64748b',
        mainBkg: '#ffffff',
        clusterBkg: '#f8fafc',
        clusterBorder: '#cbd5e1',
        edgeLabelBackground: '#ffffff',
        stateLabelColor: '#172033',
        stateBkg: '#ffffff',
        labelColor: '#172033',
        noteBkgColor: '#fffbeb',
        noteBorderColor: '#d97706',
        noteTextColor: '#78350f',
        actorBkg: '#ffffff',
        actorBorder: '#64748b',
        actorTextColor: '#172033',
        signalColor: '#475569',
        signalTextColor: '#334155',
      },
      flowchart: {
        htmlLabels: true,
        curve: 'basis',
        nodeSpacing: 48,
        rankSpacing: 56,
        padding: 16,
        useMaxWidth: false,
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

async function renderMermaid(id: string, code: string) {
  const task = mermaidRenderQueue.then(async () => {
    const mermaid = await getMermaid();
    return mermaid.render(id, code);
  });
  mermaidRenderQueue = task.then(() => undefined, () => undefined);
  return task;
}

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ code, language = 'zh' }) => {
  const rawId = useId().replace(/:/g, '');
  const containerId = `mermaid-${rawId}`;
  const [svgHtml, setSvgHtml] = useState<string>('');
  const [diagramSize, setDiagramSize] = useState<DiagramSize>(DEFAULT_DIAGRAM_SIZE);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'diagram' | 'code'>('diagram');
  const [copied, setCopied] = useState<boolean>(false);
  const [scale, setScale] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const startPanRef = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number }>({
    x: 0,
    y: 0,
    scrollLeft: 0,
    scrollTop: 0,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);
  const fullscreenModalRef = useRef<HTMLDivElement>(null);
  const fullscreenCloseRef = useRef<HTMLButtonElement>(null);
  const previousFullscreenFocusRef = useRef<HTMLElement | null>(null);
  const renderRequestRef = useRef<number>(0);

  const cleanCode = code.trim();

  // Render diagram via mermaid
  const renderDiagram = useCallback(async () => {
    const requestId = ++renderRequestRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const uniqueRenderId = `diagram-${rawId}-${++mermaidRenderSequence}`;
      // Clean and validate code string
      const { svg } = await renderMermaid(uniqueRenderId, cleanCode);
      if (requestId !== renderRequestRef.current) return;
      const prepared = prepareSvg(
        svg,
        `${uniqueRenderId}-title`,
        `${uniqueRenderId}-description`,
        language,
      );
      setSvgHtml(prepared.svg);
      setDiagramSize(prepared.size);
    } catch (err: unknown) {
      if (requestId !== renderRequestRef.current) return;
      console.warn('Mermaid rendering failed:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg);
    } finally {
      if (requestId === renderRequestRef.current) {
        setIsLoading(false);
      }
    }
  }, [cleanCode, language, rawId]);

  useEffect(() => {
    renderDiagram();
    return () => {
      renderRequestRef.current += 1;
    };
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
  const handleZoomIn = () => setScale(prev => Math.min(Number((prev + 0.2).toFixed(1)), 3.0));
  const handleZoomOut = () => setScale(prev => Math.max(Number((prev - 0.2).toFixed(1)), 0.4));
  const handleResetZoom = () => {
    setScale(1);
    window.requestAnimationFrame(() => {
      containerRef.current?.scrollTo({ left: 0, top: 0 });
      fullscreenContainerRef.current?.scrollTo({ left: 0, top: 0 });
    });
  };

  // Pan handlers for fullscreen
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isFullscreen) return;
    const container = fullscreenContainerRef.current;
    if (!container || e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsPanning(true);
    startPanRef.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: container.scrollLeft,
      scrollTop: container.scrollTop,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPanning || !isFullscreen) return;
    const container = fullscreenContainerRef.current;
    if (!container) return;
    container.scrollLeft = startPanRef.current.scrollLeft - (e.clientX - startPanRef.current.x);
    container.scrollTop = startPanRef.current.scrollTop - (e.clientY - startPanRef.current.y);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setIsPanning(false);
  };

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
        className="my-7 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xs"
      >
        {/* Header Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 select-none">
          {/* View Mode Switcher */}
          <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5 text-xs font-medium" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'diagram'}
              onClick={() => setViewMode('diagram')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-all ${
                viewMode === 'diagram'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
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
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
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
                  disabled={scale <= 0.4}
                  aria-label={t.zoomOut}
                  title={t.zoomOut}
                  className="mermaid-tool-button"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="min-w-10 px-1 text-center font-mono text-[11px] text-slate-500 select-none">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  disabled={scale >= 3}
                  aria-label={t.zoomIn}
                  title={t.zoomIn}
                  className="mermaid-tool-button"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleResetZoom}
                  aria-label={t.reset}
                  title={t.reset}
                  className="mermaid-tool-button"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <div className="mx-0.5 h-4 w-px bg-slate-200" />
                <button
                  type="button"
                  onClick={handleDownloadSvg}
                  aria-label={t.downloadSvg}
                  title={t.downloadSvg}
                  className="mermaid-tool-button"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsFullscreen(true)}
                  aria-label={t.fullscreen}
                  title={t.fullscreen}
                  className="mermaid-tool-button"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
                <div className="mx-0.5 h-4 w-px bg-slate-200" />
              </>
            )}

            <button
              type="button"
              onClick={handleCopyCode}
              aria-label={t.copyCode}
              title={t.copyCode}
              className="mermaid-tool-button flex items-center gap-1 text-xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden text-[11px] font-medium text-emerald-600 sm:inline">{t.copied}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden text-[11px] sm:inline">{t.copyCode}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content Area */}
        {viewMode === 'diagram' ? (
          <div
            ref={containerRef}
            className="mermaid-inline-viewport relative min-h-40 overflow-auto bg-[#fcfcfb] p-3 sm:p-5"
          >
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
                <div className="flex w-max min-w-full justify-center">
                  <div
                    className="mermaid-inline-stage shrink-0 transition-[width] duration-150"
                    style={{
                      // Preserve the diagram's working width. Shrinking a
                      // 2,000px flowchart to the reading column makes labels
                      // appear clipped or unreadable; the viewport already
                      // provides horizontal scrolling for wide diagrams.
                      width: `max(100%, ${Math.ceil(diagramSize.width * scale)}px)`,
                      height: `max(100%, ${Math.ceil(diagramSize.height * scale)}px)`,
                    }}
                  >
                    <RenderedSvg svgHtml={svgHtml} className="h-full w-full" />
                  </div>
                </div>
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
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 bg-neutral-900/95 px-3 py-3 sm:px-6 select-none">
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
                disabled={scale <= 0.4}
                aria-label={t.zoomOut}
                title={t.zoomOut}
                className="mermaid-fullscreen-tool"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono px-2 py-0.5 bg-neutral-800 rounded text-neutral-300">
                {Math.round(scale * 100)}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={scale >= 3}
                aria-label={t.zoomIn}
                title={t.zoomIn}
                className="mermaid-fullscreen-tool"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                aria-label={t.reset}
                title={t.reset}
                className="mermaid-fullscreen-tool"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-neutral-700 mx-1" />
              <button
                type="button"
                onClick={handleDownloadSvg}
                aria-label={t.downloadSvg}
                title={t.downloadSvg}
                className="mermaid-fullscreen-tool"
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
                className="mermaid-fullscreen-tool"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Fullscreen Canvas */}
          <div
            ref={fullscreenContainerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className={`mermaid-fullscreen-viewport flex-1 overflow-auto bg-[#fcfcfb] ${
              isPanning ? 'cursor-grabbing select-none' : 'cursor-grab'
            }`}
          >
            <div
              className="mermaid-fullscreen-stage flex items-center justify-center p-4 sm:p-8"
              style={{
                width: `max(100%, ${Math.ceil(diagramSize.width * scale)}px)`,
                height: `max(100%, ${Math.ceil(diagramSize.height * scale)}px)`,
                minWidth: '100%',
                minHeight: '100%',
              }}
            >
              <RenderedSvg svgHtml={svgHtml} className="h-full w-full" />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
