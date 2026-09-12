import React, { useId } from 'react';
import { Copy, Check } from 'lucide-react';

interface TextFlowchartProps {
  source: string;
  onCopy: () => void;
  copied: boolean;
  copyLabel: string;
  copiedLabel: string;
}

interface FlowLayout {
  steps: string[];
  direction: 'horizontal' | 'vertical';
}

const FLOW_TOKEN = /(?:-{1,3}>|→|⇒|↓|⬇)/g;

function parseFlow(source: string): FlowLayout | null {
  const lines = source
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  if (lines.length < 2 || !FLOW_TOKEN.test(source)) return null;
  FLOW_TOKEN.lastIndex = 0;

  const steps: string[] = [];
  for (const line of lines) {
    const parts = line
      .split(FLOW_TOKEN)
      .map(part => part.trim())
      .filter(part => part && !/^[|/\\-]+$/.test(part));
    steps.push(...parts);
  }

  const uniqueSteps = steps.filter((step, index) => step !== steps[index - 1]);
  if (uniqueSteps.length < 2) return null;

  return {
    steps: uniqueSteps,
    direction: uniqueSteps.length <= 4 && !lines.some(line => /↓|⬇/.test(line))
      ? 'horizontal'
      : 'vertical',
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
}) => {
  const diagramId = useId().replace(/:/g, '');
  const layout = parseFlow(source);
  if (!layout) return null;

  const nodeWidth = 216;
  const nodeHeight = 64;
  const gap = 40;
  const padding = 24;
  const isHorizontal = layout.direction === 'horizontal';
  const width = isHorizontal
    ? padding * 2 + layout.steps.length * nodeWidth + (layout.steps.length - 1) * gap
    : nodeWidth + padding * 2;
  const height = isHorizontal
    ? nodeHeight + 112
    : padding * 2 + layout.steps.length * nodeHeight + (layout.steps.length - 1) * gap + 48;
  const nodeX = isHorizontal ? padding : padding;

  return (
    <div className="my-6 overflow-hidden rounded-xl border border-neutral-200/90 bg-white shadow-2xs">
      <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-3.5 py-2">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
          flowchart
        </span>
        <button
          type="button"
          onClick={onCopy}
          className="flex items-center gap-1 rounded px-1 text-[11px] text-neutral-500 transition-colors hover:text-neutral-900 focus-visible:ring-1 focus-visible:ring-neutral-400"
          aria-label={copied ? copiedLabel : copyLabel}
        >
          {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
          <span className={copied ? 'text-emerald-700' : undefined}>{copied ? copiedLabel : copyLabel}</span>
        </button>
      </div>

      <div className="flowchart-scroll overflow-x-auto px-2 py-3 sm:px-4 sm:py-4">
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

          {layout.steps.slice(0, -1).map((_, index) => {
            const fromX = isHorizontal ? nodeX + index * (nodeWidth + gap) + nodeWidth : nodeX + nodeWidth / 2;
            const fromY = isHorizontal ? 56 + nodeHeight / 2 : padding + index * (nodeHeight + gap) + nodeHeight;
            const toX = isHorizontal ? nodeX + (index + 1) * (nodeWidth + gap) : nodeX + nodeWidth / 2;
            const toY = isHorizontal ? fromY : padding + (index + 1) * (nodeHeight + gap);

            return (
              <path
                key={`connector-${index}`}
                d={isHorizontal ? `M ${fromX} ${fromY} H ${toX}` : `M ${fromX} ${fromY} V ${toY}`}
                fill="none"
                stroke="#64748b"
                strokeWidth="1.5"
                markerEnd={`url(#${diagramId}-arrow)`}
              />
            );
          })}

          {layout.steps.map((step, index) => {
            const x = nodeX;
            const y = isHorizontal ? 56 : padding + index * (nodeHeight + gap);
            const lines = wrapLabel(step);
            const isEndpoint = index === 0 || index === layout.steps.length - 1;

            return (
              <g key={`${step}-${index}`}>
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
          })}
        </svg>
      </div>
    </div>
  );
};
