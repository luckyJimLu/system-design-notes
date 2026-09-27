import React, { useMemo, useState } from 'react';
import { AlertCircle, ExternalLink, RotateCcw } from 'lucide-react';
import { plantUmlSlug } from '../utils/plantuml.mjs';
export { isPlantUmlSource } from '../utils/plantuml.mjs';

interface PlantUmlDiagramProps {
  code: string;
  language?: 'zh' | 'en';
}

export const PlantUmlDiagram: React.FC<PlantUmlDiagramProps> = ({ code, language = 'zh' }) => {
  const [failed, setFailed] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const slug = useMemo(() => plantUmlSlug(code), [code]);
  const cacheParam = retryKey > 0 ? `?retry=${retryKey}` : '';
  const imageUrl = `${import.meta.env.BASE_URL}plantuml/${slug}.svg${cacheParam}`;

  const labels = {
    failed: language === 'zh' ? 'PlantUML 图形加载失败' : 'PlantUML diagram failed to load',
    retry: language === 'zh' ? '重试' : 'Retry',
    svg: language === 'zh' ? '静态 SVG' : 'Static SVG',
    failedHint: language === 'zh'
      ? '图片暂时无法加载，请重试或打开 SVG。'
      : 'The image could not be loaded. Retry or open the SVG.',
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
            key={`${slug}-${retryKey}`}
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
