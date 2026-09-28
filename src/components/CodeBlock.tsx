import React, { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { HighlightedCode } from './HighlightedCode';

interface CodeBlockProps {
  lang: string;
  codeString: string;
  preClassName: string;
  copyLabel: string;
  copiedLabel: string;
}

/**
 * Code block with a copy button.
 *
 * The copied feedback is component-local state, so it cannot desync across
 * re-renders (the previous implementation compared a Math.random() id
 * generated inside the render function, which never matched).
 */
export const CodeBlock: React.FC<CodeBlockProps> = ({
  lang,
  codeString,
  preClassName,
  copyLabel,
  copiedLabel,
}) => {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString).catch(() => {
      // Clipboard API may be unavailable (e.g. non-secure context);
      // still show the copied feedback.
    });
    setCopied(true);
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-5 rounded-lg overflow-hidden border border-neutral-800 bg-neutral-950 text-neutral-100 shadow-sm">
      <div className="flex items-center justify-between px-3.5 py-2 bg-neutral-900 border-b border-neutral-800 text-xs text-neutral-400">
        <span className="font-mono uppercase tracking-wider text-[11px] font-semibold text-neutral-400">
          {lang}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] hover:text-neutral-100 text-neutral-400 transition-colors focus-visible:ring-1 focus-visible:ring-neutral-400 rounded px-1"
          aria-label="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">{copiedLabel}</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>{copyLabel}</span>
            </>
          )}
        </button>
      </div>
      <pre className={preClassName}>
        <HighlightedCode code={codeString} language={lang} />
      </pre>
    </div>
  );
};
