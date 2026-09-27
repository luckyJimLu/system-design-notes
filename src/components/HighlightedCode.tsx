import React, { useMemo } from 'react';
import hljs from 'highlight.js/lib/core';
import c from 'highlight.js/lib/languages/c';
import cpp from 'highlight.js/lib/languages/cpp';
import 'highlight.js/styles/github-dark.css';

hljs.registerLanguage('c', c);
hljs.registerLanguage('cpp', cpp);

export function HighlightedCode({ code, language }: { code: string; language: string }) {
  const html = useMemo(() => hljs.getLanguage(language)
    ? hljs.highlight(code, { language, ignoreIllegals: true }).value
    : null, [code, language]);

  return html === null ? <code>{code}</code> : (
    <code className={`language-${language}`} dangerouslySetInnerHTML={{ __html: html }} />
  );
}
