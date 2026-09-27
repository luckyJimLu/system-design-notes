import React, { useMemo, useState } from 'react';
import { AlertCircle, ExternalLink, RotateCcw } from 'lucide-react';
import plantumlEncoder from 'plantuml-encoder';

/**
 * FNV-1a 32-bit hash — must match the slug generation in scripts/render-plantuml.mjs
 * to ensure the browser requests the same filename that was rendered to disk.
 */
function fnv1a(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

interface PlantUmlDiagramProps {
  code: string;
  language?: 'zh' | 'en';
}

function cleanPlantUml(code: string): string {
  const value = code.trim();
  if (/^@start(?:uml|mindmap|wbs|gantt|json|yaml)\b/i.test(value)) return value;
  return `@startuml\n${value}\n@enduml`;
}

export function isPlantUmlSource(code: string): boolean {
  return /^\s*@start(?:uml|mindmap|wbs|gantt|json|yaml)\b/i.test(code);
}

export const PlantUmlDiagram: React.FC<PlantUmlDiagramProps> = ({ code, language = 'zh' }) => {
  const [failed, setFailed] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const cleanCode = useMemo(() => cleanPlantUml(code), [code]);
  const encoded = useMemo(() => plantumlEncoder.encode(cleanCode), [cleanCode]);
  const slug = useMemo(() => fnv1a(encoded), [encoded]);
  const cacheParam = retryKey > 0 ? `?retry=${retryKey}` : '';
  const imageUrl = `${import.meta.env.BASE_URL}plantuml/${slug}.svg${cacheParam}`;

  const labels = {
    failed: language === 'zh' ? 'PlantUML 图形加载失败' : 'PlantUML diagram failed to load',
    retry: language === 'zh' ? '重试' : 'Retry',
    svg: language === 'zh' ? '静态 SVG' : 'Static SVG',
    failedHint: language === 'zh'
      ? '构建产物中没有找到这个 PlantUML SVG。请确认 GitHub Actions 已在构建前执行本地 PlantUML 渲染。'
      : 'The pre-rendered PlantUML SVG was not found in the build output. Make sure GitHub Actions renders PlantUML before building.',
  };

  const handleRetry = () => {
    setFailed(false);
    setRetryKey(value => value + 1);
  };

  return (
    <figure className="my-7 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xs">
      {failed ? (
        <div className="bg-amber-50/70 p-4 text-xs text-amber-900">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="h-4 w-4" />
            <span>{labels.failed}</span>
            <button type="button" onClick={handleRetry} className="ml-auto inline-flex items-center gap-1 underline hover:text-amber-950">
              <RotateCcw className="h-3.5 w-3.5" />
              {labels.retry}
            </button>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-amber-800">{labels.failedHint}</p>
          <a
            href={imageUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold underline"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {labels.svg}
          </a>
        </div>
      ) : (
        <a
          href={imageUrl}
          target="_blank"
          rel="noreferrer"
          className="plantuml-viewport block overflow-auto bg-[#fcfcfb] p-3 sm:p-5"
          aria-label={labels.svg}
          title={labels.svg}
        >
          <img
            key={`${encoded}-${retryKey}`}
            src={imageUrl}
            alt={language === 'zh' ? 'PlantUML 流程图' : 'PlantUML diagram'}
            className="plantuml-image block h-auto max-w-none"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setFailed(true)}
          />
        </a>
      )}
    </figure>
  );
};
