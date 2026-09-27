import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Check, Copy, Code, Eye, ExternalLink, RefreshCw } from 'lucide-react';
import plantumlEncoder from 'plantuml-encoder';

interface PlantUmlDiagramProps {
  code: string;
  language?: 'zh' | 'en';
}

function cleanPlantUml(code: string): string {
  const value = code.trim();
  if (/^@start(?:uml|mindmap|wbs|gantt|json|yaml)\b/i.test(value)) return value;
  return `@startuml\n${value}\n@enduml`;
}

function getPlantUmlServers(): string[] {
  const configuredServers = String(import.meta.env.VITE_PLANTUML_SERVER || '')
    .split(',')
    .map(server => server.trim())
    .filter(Boolean);

  const servers = configuredServers.length > 0
    ? configuredServers
    : ['https://www.plantuml.com/plantuml'];

  return [...new Set(servers.map(server => server.replace(/\/$/, '')))];
}

export function isPlantUmlSource(code: string): boolean {
  return /^\s*@start(?:uml|mindmap|wbs|gantt|json|yaml)\b/i.test(code);
}

export const PlantUmlDiagram: React.FC<PlantUmlDiagramProps> = ({ code, language = 'zh' }) => {
  const [viewMode, setViewMode] = useState<'diagram' | 'code'>('diagram');
  const [failedServers, setFailedServers] = useState<Set<string>>(() => new Set());
  const [retryKey, setRetryKey] = useState(0);
  const [copied, setCopied] = useState(false);
  const cleanCode = useMemo(() => cleanPlantUml(code), [code]);
  const encoded = useMemo(() => plantumlEncoder.encode(cleanCode), [cleanCode]);
  const servers = useMemo(() => getPlantUmlServers(), []);
  const activeServer = servers.find(server => !failedServers.has(server)) || servers[0];
  const allServersFailed = failedServers.size >= servers.length;
  const cacheParam = retryKey > 0 ? `?retry=${retryKey}` : '';
  const imageUrl = `${activeServer}/svg/${encoded}${cacheParam}`;

  useEffect(() => {
    setFailedServers(new Set());
    setRetryKey(0);
  }, [encoded]);

  const labels = {
    diagram: language === 'zh' ? '流程图' : 'Diagram',
    source: language === 'zh' ? '源码' : 'Source',
    copy: language === 'zh' ? '复制 PlantUML 源码' : 'Copy PlantUML source',
    copied: language === 'zh' ? '已复制' : 'Copied',
    failed: language === 'zh' ? 'PlantUML 图形加载失败' : 'PlantUML diagram failed to load',
    retry: language === 'zh' ? '重试' : 'Retry',
    server: language === 'zh' ? '渲染服务' : 'Renderer',
    fallback: language === 'zh' ? '正在尝试备用渲染服务' : 'Trying another renderer',
    failedHint: language === 'zh'
      ? '所有 PlantUML 渲染服务均未返回有效 SVG。可切换到“源码”复制内容，或检查 VITE_PLANTUML_SERVER。'
      : 'No configured PlantUML renderer returned a valid SVG. Switch to Source to copy the text, or check VITE_PLANTUML_SERVER.',
  };

  const handleRetry = () => {
    setFailedServers(new Set());
    setRetryKey(value => value + 1);
  };

  const handleImageError = () => {
    setFailedServers(previous => {
      const next = new Set(previous);
      next.add(activeServer);
      return next;
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cleanCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard access is optional; the source view remains available.
    }
  };

  return (
    <div className="my-7 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 select-none">
        <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5 text-xs font-medium" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'diagram'}
            onClick={() => setViewMode('diagram')}
            className={`flex items-center gap-1.5 rounded px-2.5 py-1 transition-all ${viewMode === 'diagram' ? 'bg-slate-900 font-semibold text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>{labels.diagram}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'code'}
            onClick={() => setViewMode('code')}
            className={`flex items-center gap-1.5 rounded px-2.5 py-1 transition-all ${viewMode === 'code' ? 'bg-slate-900 font-semibold text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
          >
            <Code className="h-3.5 w-3.5" />
            <span>{labels.source}</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleCopy}
            className="flex min-h-7 items-center gap-1 rounded-md px-2 py-1 text-[11px] text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900"
            aria-label={copied ? labels.copied : labels.copy}
            title={copied ? labels.copied : labels.copy}
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{copied ? labels.copied : labels.copy}</span>
          </button>
          <a
            href={imageUrl}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-7 items-center gap-1 rounded-md px-2 py-1 text-[11px] text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900"
            aria-label={`${labels.server}: ${activeServer}`}
            title={`${labels.server}: ${activeServer}`}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">SVG</span>
          </a>
        </div>
      </div>

      {viewMode === 'code' ? (
        <pre className="m-0 overflow-x-auto bg-neutral-950 p-4 text-xs leading-relaxed text-neutral-200"><code>{cleanCode}</code></pre>
      ) : allServersFailed ? (
        <div className="bg-amber-50/70 p-4 text-xs text-amber-900">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="h-4 w-4" />
            <span>{labels.failed}</span>
            <button type="button" onClick={handleRetry} className="ml-auto underline hover:text-amber-950">
              {labels.retry}
            </button>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-amber-800">{labels.failedHint}</p>
          <pre className="mt-3 max-h-72 overflow-auto rounded-md bg-white/70 p-3 font-mono text-[11px] leading-relaxed text-amber-950"><code>{cleanCode}</code></pre>
        </div>
      ) : (
        <div className="plantuml-viewport overflow-auto bg-[#fcfcfb] p-3 sm:p-5" aria-busy={failedServers.size > 0}>
          {failedServers.size > 0 && (
            <div className="mb-3 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
              <RefreshCw className="h-3.5 w-3.5" />
              <span>{labels.fallback}</span>
            </div>
          )}
          <img
            key={`${activeServer}-${retryKey}`}
            src={imageUrl}
            alt={language === 'zh' ? 'PlantUML 流程图' : 'PlantUML diagram'}
            className="plantuml-image block h-auto max-w-none"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={handleImageError}
          />
        </div>
      )}
    </div>
  );
};
