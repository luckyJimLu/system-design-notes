import React, { useEffect, useId, useState } from 'react';
import { Check, Copy, Pencil, RotateCcw, Save, X } from 'lucide-react';

interface TextFlowchartProps {
  source: string;
  onCopy: (source: string) => void;
  copied: boolean;
  copyLabel: string;
  copiedLabel: string;
  editLabel: string;
  saveLabel: string;
  cancelLabel: string;
  resetLabel: string;
  editorHint: string;
  invalidLabel: string;
}

interface FlowLayout {
  paths: string[][];
  direction: 'horizontal' | 'vertical';
}

// Require whitespace around ASCII arrows. Without the boundary, expressions
// such as `netif->input()` and `pbuf->next` are incorrectly split into fake
// flowchart nodes and can produce a broken, oversized SVG.
const FLOW_TOKEN = /(?:\s+-{1,3}>\s+|^\s*-{1,3}>\s*|(?:\s+|^)[→⇒↓⬇](?=\s|$))/gm;

function parseFlow(source: string): FlowLayout | null {
  const lines = source
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  if (lines.length < 2 || !FLOW_TOKEN.test(source)) return null;
  FLOW_TOKEN.lastIndex = 0;

  const paths: string[][] = [];
  for (const line of lines) {
    const parts = line
      .split(FLOW_TOKEN)
      .map(part => part.trim())
      .filter(part => part && !/^[|/\\-]+$/.test(part));
    if (parts.length === 0) continue;

    // A line beginning with an arrow is a continuation of the preceding path.
    // This supports readable wrapped text blocks such as `A -> B` / `-> C`.
    const continuesPreviousPath = /^(?:-{1,3}>|→|⇒|↓|⬇)/.test(line);
    if (continuesPreviousPath && paths.length > 0) {
      paths[paths.length - 1].push(...parts);
    } else {
      paths.push(parts);
    }
  }

  const normalizedPaths = paths
    .map(path => path.filter((step, index) => step !== path[index - 1]))
    .filter(path => path.length >= 2);
  if (normalizedPaths.length === 0) return null;

  return {
    paths: normalizedPaths,
    direction: normalizedPaths.length === 1 && lines.some(line => /↓|⬇/.test(line))
      ? 'vertical'
      : 'horizontal',
  };
}

function wrapLabel(label: string, maxChars = 20): string[] {
  const words = label.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (current && next.length > maxChars) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);

  if (lines.length <= 2) return lines;
  return [lines[0], `${lines.slice(1).join(' ').slice(0, maxChars - 1)}…`];
}

export function isTextFlowchart(source: string): boolean {
  return parseFlow(source) !== null;
}

export const TextFlowchart: React.FC<TextFlowchartProps> = ({
  source,
  onCopy,
  copied,
  copyLabel,
  copiedLabel,
  editLabel,
  saveLabel,
  cancelLabel,
  resetLabel,
  editorHint,
  invalidLabel,
}) => {
  const diagramId = useId().replace(/:/g, '');
  const [currentSource, setCurrentSource] = useState(source);
  const [draft, setDraft] = useState(source);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setCurrentSource(source);
    setDraft(source);
    setIsEditing(false);
  }, [source]);

  const previewSource = isEditing ? draft : currentSource;
  const layout = parseFlow(previewSource);
  if (!layout && !isEditing) return null;

  const startEditing = () => {
    setDraft(currentSource);
    setIsEditing(true);
  };
  const saveDraft = () => {
    if (!parseFlow(draft)) return;
    setCurrentSource(draft);
    setIsEditing(false);
  };
  const cancelEditing = () => {
    setDraft(currentSource);
    setIsEditing(false);
  };

  const nodeWidth = 216;
  const nodeHeight = 64;
  const gap = 40;
  const padding = 24;
  const isHorizontal = layout?.direction === 'horizontal';
  const maxPathLength = layout ? Math.max(...layout.paths.map(path => path.length)) : 0;
  const width = layout
    ? padding * 2 + (isHorizontal ? maxPathLength * nodeWidth + (maxPathLength - 1) * gap : nodeWidth)
    : 0;
  const height = layout
    ? padding * 2 + (isHorizontal
      ? layout.paths.length * nodeHeight + (layout.paths.length - 1) * gap
      : maxPathLength * nodeHeight + (maxPathLength - 1) * gap) + 48
    : 0;
  const nodeX = padding;

  return (
    <div className="my-6 overflow-hidden rounded-xl border border-neutral-200/90 bg-white shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 bg-neutral-50 px-3.5 py-2">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
          flowchart
        </span>
        <div className="flex items-center gap-1">
          {!isEditing ? (
            <>
              <button type="button" onClick={startEditing} className="flex items-center gap-1 rounded px-1.5 py-1 text-[11px] text-neutral-500 transition-colors hover:bg-white hover:text-neutral-900 focus-visible:ring-1 focus-visible:ring-neutral-400" aria-label={editLabel}>
                <Pencil className="h-3 w-3" /><span>{editLabel}</span>
              </button>
              <button type="button" onClick={() => onCopy(currentSource)} className="flex items-center gap-1 rounded px-1.5 py-1 text-[11px] text-neutral-500 transition-colors hover:bg-white hover:text-neutral-900 focus-visible:ring-1 focus-visible:ring-neutral-400" aria-label={copied ? copiedLabel : copyLabel}>
                {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                <span className={copied ? 'text-emerald-700' : undefined}>{copied ? copiedLabel : copyLabel}</span>
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={saveDraft} disabled={!parseFlow(draft)} className="flex items-center gap-1 rounded bg-neutral-900 px-2 py-1 text-[11px] text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-1 focus-visible:ring-neutral-400">
                <Save className="h-3 w-3" /><span>{saveLabel}</span>
              </button>
              <button type="button" onClick={cancelEditing} className="flex items-center gap-1 rounded px-1.5 py-1 text-[11px] text-neutral-500 transition-colors hover:bg-white hover:text-neutral-900 focus-visible:ring-1 focus-visible:ring-neutral-400" aria-label={cancelLabel}>
                <X className="h-3 w-3" /><span>{cancelLabel}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="border-b border-neutral-200 bg-neutral-50/70 px-3.5 py-3">
          <textarea value={draft} onChange={event => setDraft(event.target.value)} className="min-h-24 w-full resize-none rounded-md border border-neutral-300 bg-white px-3 py-2 font-mono text-xs leading-relaxed text-neutral-800 outline-none transition-colors focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10" aria-label={editLabel} spellCheck={false} />
          <div className="mt-2 flex items-start justify-between gap-3 text-[11px] text-neutral-500">
            <span>{editorHint}</span>
            <button type="button" onClick={() => setDraft(source)} className="inline-flex shrink-0 items-center gap-1 hover:text-neutral-900">
              <RotateCcw className="h-3 w-3" /><span>{resetLabel}</span>
            </button>
          </div>
          {!layout && <p className="mt-2 text-[11px] font-medium text-amber-700">{invalidLabel}</p>}
        </div>
      )}

      {layout ? <div className="flowchart-scroll overflow-x-auto px-2 py-3 sm:px-4 sm:py-4">
        <svg
          className="flowchart-svg mx-auto block"
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-labelledby={`${diagramId}-title ${diagramId}-desc`}
        >
          <title id={`${diagramId}-title`}>Text flowchart</title>
          <desc id={`${diagramId}-desc`}>A flowchart generated from the arrows in a text code block.</desc>
          <defs>
            <marker id={`${diagramId}-arrow`} markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#64748b" />
            </marker>
          </defs>

          {layout.paths.map((path, pathIndex) => path.slice(0, -1).map((_, index) => {
            const fromX = isHorizontal ? nodeX + index * (nodeWidth + gap) + nodeWidth : nodeX + nodeWidth / 2;
            const fromY = isHorizontal
              ? padding + pathIndex * (nodeHeight + gap) + nodeHeight / 2
              : padding + index * (nodeHeight + gap) + nodeHeight;
            const toX = isHorizontal ? nodeX + (index + 1) * (nodeWidth + gap) : nodeX + nodeWidth / 2;
            const toY = isHorizontal
              ? fromY
              : padding + (index + 1) * (nodeHeight + gap);

            return (
              <path
                key={`connector-${pathIndex}-${index}`}
                d={isHorizontal ? `M ${fromX} ${fromY} H ${toX}` : `M ${fromX} ${fromY} V ${toY}`}
                fill="none"
                stroke="#64748b"
                strokeWidth="1.5"
                markerEnd={`url(#${diagramId}-arrow)`}
              />
            );
          }))}

          {layout.paths.map((path, pathIndex) => path.map((step, index) => {
            const x = nodeX;
            const y = isHorizontal
              ? padding + pathIndex * (nodeHeight + gap)
              : padding + index * (nodeHeight + gap);
            const lines = wrapLabel(step);
            const isEndpoint = index === 0 || index === path.length - 1;

            return (
              <g key={`${pathIndex}-${step}-${index}`}>
                <rect
                  x={x}
                  y={y}
                  width={nodeWidth}
                  height={nodeHeight}
                  rx="8"
                  fill={isEndpoint ? '#fff7ed' : '#ffffff'}
                  stroke={isEndpoint ? '#ea580c' : '#334155'}
                  strokeWidth={isEndpoint ? '1.4' : '1'}
                />
                <text
                  x={x + nodeWidth / 2}
                  y={y + nodeHeight / 2 - (lines.length - 1) * 8}
                  fill="#1e293b"
                  fontSize="13"
                  fontWeight="600"
                  fontFamily="Noto Sans SC, Noto Sans TC, Geist, sans-serif"
                  textAnchor="middle"
                >
                  {lines.map((line, lineIndex) => (
                    <tspan key={lineIndex} x={x + nodeWidth / 2} dy={lineIndex === 0 ? 0 : 18}>
                      {line}
                    </tspan>
                  ))}
                </text>
              </g>
            );
          }))}
        </svg>
      </div> : <pre className="m-0 overflow-x-auto px-4 py-5 font-mono text-xs leading-relaxed text-neutral-600">{draft}</pre>}
    </div>
  );
};
