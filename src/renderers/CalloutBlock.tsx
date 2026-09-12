import React from 'react';
import type { BlockProps } from './registry';

const toneClass = {
  info: 'border-blue-300 bg-blue-50 text-blue-950',
  warning: 'border-amber-300 bg-amber-50 text-amber-950',
  danger: 'border-red-300 bg-red-50 text-red-950',
  success: 'border-emerald-300 bg-emerald-50 text-emerald-950',
} as const;

export const CalloutBlock: React.FC<BlockProps> = ({ attributes, children }) => {
  const type = attributes.type && attributes.type in toneClass ? attributes.type as keyof typeof toneClass : 'info';
  return (
    <aside className={`my-5 rounded-r-lg border-l-4 px-4 py-3 text-sm leading-relaxed ${toneClass[type]}`}>
      {attributes.title && <strong className="mb-1 block text-xs uppercase tracking-wide">{attributes.title}</strong>}
      <div>{children}</div>
    </aside>
  );
};
