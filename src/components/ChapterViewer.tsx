import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Chapter, Language } from '../types';
import { resolveImageUrl } from '../content/catalog';
import { isTextFlowchart, TextFlowchart } from '../renderers/TextFlowchart';
import { builtinRendererRegistry } from '../renderers/registry';
import { I18N_STRINGS } from '../data/i18n';
import { truncateTitle } from '../utils/title';
import { MermaidDiagram } from './MermaidDiagram';
import { isPlantUmlSource, PlantUmlDiagram } from './PlantUmlDiagram';
import {
  Bookmark,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  Maximize2,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface ChapterViewerProps {
  chapter: Chapter;
  isBookmarked: boolean;
  isCompleted: boolean;
  onToggleBookmark: (id: string) => void;
  onToggleCompleted: (id: string) => void;
  onOpenLightbox: (src: string, alt?: string) => void;
  onSelectChapter: (id: string) => void;
  allChapters: Chapter[];
  fontSize: 'sm' | 'base' | 'lg';
  language: Language;
}

export const ChapterViewer: React.FC<ChapterViewerProps> = ({
  chapter,
  isBookmarked,
  isCompleted,
  onToggleBookmark,
  onToggleCompleted,
  onOpenLightbox,
  onSelectChapter,
  allChapters,
  fontSize,
  language,
}) => {
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const t = I18N_STRINGS[language];

  // Active markdown content based on current language setting
  const activeMarkdown = useMemo(() => {
    if (language === 'zh') {
      return chapter.markdownZh || chapter.markdown;
    }
    return chapter.markdownEn || chapter.markdown;
  }, [chapter, language]);

  // Dynamic reading time estimate
  const estimatedReadMinutes = useMemo(() => {
    if (language === 'zh') {
      const charCount = activeMarkdown.replace(/\s+/g, '').length;
      return Math.max(2, Math.round(charCount / 350));
    }
    const wordCount = activeMarkdown.split(/\s+/).filter(Boolean).length;
    return Math.max(2, Math.round(wordCount / 200));
  }, [activeMarkdown, language]);

  // Find previous and next chapters
  const currentIndex = allChapters.findIndex(c => c.id === chapter.id);
  const prevChapter = currentIndex > 0 ? allChapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < allChapters.length - 1 ? allChapters[currentIndex + 1] : null;

  const handleCopyCode = (codeText: string, id: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  // Font size configuration mapping
  const fontConfig = {
    sm: {
      p: 'text-sm leading-relaxed mb-3.5 text-neutral-800',
      ul: 'list-disc pl-6 mb-3.5 space-y-1 text-sm leading-relaxed text-neutral-800',
      ol: 'list-decimal pl-6 mb-3.5 space-y-1 text-sm leading-relaxed text-neutral-800',
      li: 'text-sm leading-relaxed',
      h1: 'text-2xl font-bold mt-7 mb-3.5 scroll-mt-20 text-neutral-900 tracking-tight',
      h2: 'text-lg sm:text-xl font-bold mt-8 mb-3.5 pb-2 border-b border-neutral-200/90 scroll-mt-20 text-neutral-900 flex items-center justify-between group',
      h3: 'text-base sm:text-lg font-semibold mt-5 mb-2.5 scroll-mt-20 text-neutral-900',
      table: 'w-full text-left text-xs border-collapse bg-white',
      th: 'py-2 px-3 border-b border-neutral-200 text-[11px] font-semibold uppercase tracking-wider text-neutral-700',
      td: 'py-2 px-3 border-b border-neutral-100 text-xs text-neutral-700',
      blockquote: 'border-l-2 border-neutral-900 bg-neutral-50/70 py-2.5 px-3.5 my-4 rounded-r-md text-neutral-800 text-xs sm:text-sm leading-relaxed',
      inlineCode: 'font-mono text-[11px] sm:text-xs bg-neutral-100 border border-neutral-200/80 text-neutral-800 px-1.5 py-0.5 rounded font-medium',
      preCode: 'p-3.5 overflow-x-auto text-[11px] sm:text-xs font-mono leading-relaxed bg-neutral-950 m-0 text-neutral-200',
    },
    base: {
      p: 'text-base leading-relaxed mb-4 text-neutral-800',
      ul: 'list-disc pl-6 mb-4 space-y-1.5 text-base leading-relaxed text-neutral-800',
      ol: 'list-decimal pl-6 mb-4 space-y-1.5 text-base leading-relaxed text-neutral-800',
      li: 'text-base leading-relaxed',
      h1: 'text-2xl sm:text-3xl font-bold mt-8 mb-4 scroll-mt-20 text-neutral-900 tracking-tight',
      h2: 'text-xl sm:text-2xl font-bold mt-10 mb-4 pb-2 border-b border-neutral-200/90 scroll-mt-20 text-neutral-900 flex items-center justify-between group',
      h3: 'text-lg sm:text-xl font-semibold mt-6 mb-3 scroll-mt-20 text-neutral-900',
      table: 'w-full text-left text-xs sm:text-sm border-collapse bg-white',
      th: 'py-2.5 px-3.5 border-b border-neutral-200 text-xs font-semibold uppercase tracking-wider text-neutral-700',
      td: 'py-2.5 px-3.5 border-b border-neutral-100 text-sm text-neutral-700',
      blockquote: 'border-l-2 border-neutral-900 bg-neutral-50/70 py-3 px-4 my-5 rounded-r-md text-neutral-800 text-sm leading-relaxed',
      inlineCode: 'font-mono text-xs sm:text-sm bg-neutral-100 border border-neutral-200/80 text-neutral-800 px-1.5 py-0.5 rounded font-medium',
      preCode: 'p-4 overflow-x-auto text-xs sm:text-sm font-mono leading-relaxed bg-neutral-950 m-0 text-neutral-200',
    },
    lg: {
      p: 'text-lg sm:text-xl leading-relaxed mb-5 text-neutral-800',
      ul: 'list-disc pl-6 mb-5 space-y-2 text-lg sm:text-xl leading-relaxed text-neutral-800',
      ol: 'list-decimal pl-6 mb-5 space-y-2 text-lg sm:text-xl leading-relaxed text-neutral-800',
      li: 'text-lg sm:text-xl leading-relaxed',
      h1: 'text-3xl sm:text-4xl font-bold mt-10 mb-5 scroll-mt-20 text-neutral-900 tracking-tight',
      h2: 'text-2xl sm:text-3xl font-bold mt-12 mb-5 pb-2.5 border-b border-neutral-200/90 scroll-mt-20 text-neutral-900 flex items-center justify-between group',
      h3: 'text-xl sm:text-2xl font-semibold mt-8 mb-4 scroll-mt-20 text-neutral-900',
      table: 'w-full text-left text-sm sm:text-base border-collapse bg-white',
      th: 'py-3 px-4 border-b border-neutral-200 text-sm font-semibold uppercase tracking-wider text-neutral-700',
      td: 'py-3 px-4 border-b border-neutral-100 text-base text-neutral-700',
      blockquote: 'border-l-2 border-neutral-900 bg-neutral-50/70 py-3.5 px-5 my-6 rounded-r-md text-neutral-800 text-base sm:text-lg leading-relaxed',
      inlineCode: 'font-mono text-sm sm:text-base bg-neutral-100 border border-neutral-200/80 text-neutral-800 px-2 py-0.5 rounded font-medium',
      preCode: 'p-5 overflow-x-auto text-sm sm:text-base font-mono leading-relaxed bg-neutral-950 m-0 text-neutral-200',
    },
  }[fontSize];

  // Helper to slugify heading titles to match TableOfContents
  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
  };

  const fullCurrentTitle = language === 'zh' ? (chapter.titleZh || chapter.title) : chapter.title;
  const currentTitle = truncateTitle(fullCurrentTitle);
  const currentDesc = language === 'zh' ? (chapter.descriptionZh || chapter.description) : chapter.description;
  const currentTags = language === 'zh' ? (chapter.tagsZh || chapter.tags) : chapter.tags;

  return (
    <article className="max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-8">
      {/* Top Chapter Header Banner */}
      <header className="pb-5 mb-7 border-b border-neutral-200/90">
        {/* Meta badges & Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-neutral-100 text-neutral-800 border border-neutral-200/80 font-mono">
              {chapter.volume === 1
                ? t.chapter.vol1
                : chapter.volume === 2
                ? t.chapter.vol2
                : t.chapter.modem}
            </span>

            <span className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium">
              <Clock className="w-3.5 h-3.5 text-neutral-400" />
              {language === 'zh'
                ? `${t.chapter.minRead} ${estimatedReadMinutes} 分钟`
                : `${estimatedReadMinutes} ${t.chapter.minRead}`}
            </span>
          </div>

          {/* Reader Action buttons */}
          <div className="flex items-center gap-1.5">
            <button
              id={`bookmark-btn-${chapter.id}`}
              type="button"
              onClick={() => onToggleBookmark(chapter.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors shadow-2xs focus-visible:ring-2 focus-visible:ring-neutral-900 ${
                isBookmarked
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
              }`}
              aria-label={isBookmarked ? 'Remove Bookmark' : 'Bookmark Chapter'}
              title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Chapter'}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current text-amber-600' : 'text-neutral-400'}`} />
              <span>{isBookmarked ? t.chapter.bookmarked : t.chapter.bookmark}</span>
            </button>

            <button
              id={`complete-btn-${chapter.id}`}
              type="button"
              onClick={() => onToggleCompleted(chapter.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors shadow-2xs focus-visible:ring-2 focus-visible:ring-neutral-900 ${
                isCompleted
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
              }`}
              aria-label={isCompleted ? 'Mark as Incomplete' : 'Mark as Read'}
              title={isCompleted ? 'Mark as Incomplete' : 'Mark as Read'}
            >
              <CheckCircle2
                className={`w-3.5 h-3.5 ${isCompleted ? 'text-emerald-600' : 'text-neutral-400'}`}
              />
              <span>{isCompleted ? t.chapter.completed : t.chapter.markRead}</span>
            </button>
          </div>
        </div>

        {/* Main Title */}
        <h1 className="text-2xl sm:text-3xl lg:text-3.5xl font-bold text-neutral-900 tracking-tight leading-tight" title={fullCurrentTitle}>
          {chapter.volume !== 0 && (
            <span className="text-neutral-500 block text-xs font-mono font-semibold uppercase tracking-wider mb-1">
              {language === 'zh' ? `第 ${chapter.number} 章` : `Chapter ${chapter.number}`}
            </span>
          )}
          {currentTitle}
        </h1>

        {/* Short chapter summary */}
        {currentDesc && (
          <div className="mt-4 text-sm text-neutral-600 leading-relaxed max-w-3xl">
            <span className="font-semibold text-neutral-900">{t.chapter.summaryHeading} · </span>
            <span>{currentDesc}</span>

            {currentTags.length > 0 && (
              <div className="flex items-center gap-2 mt-2 flex-wrap text-xs text-neutral-500">
                {currentTags.map(tag => (
                  <span key={tag}>#{tag}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main Markdown Content Body */}
      <div
        className="reader-content max-w-none text-neutral-800 transition-all duration-150"
        data-font-size={fontSize}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            // Heading 1
            h1: ({ children }) => {
              const text = String(children);
              const id = slugify(text);
              return (
                <h1 id={id} className={fontConfig.h1}>
                  {children}
                </h1>
              );
            },
            // Heading 2
            h2: ({ children }) => {
              const text = String(children);
              const id = slugify(text);
              return (
                <h2 id={id} className={fontConfig.h2}>
                  <span>{children}</span>
                  <a
                    href={`#${id}`}
                    className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-neutral-900 text-sm font-normal transition-opacity pl-2"
                    aria-label={`Link to section ${text}`}
                  >
                    #
                  </a>
                </h2>
              );
            },
            // Heading 3
            h3: ({ children }) => {
              const text = String(children);
              const id = slugify(text);
              return (
                <h3 id={id} className={fontConfig.h3}>
                  {children}
                </h3>
              );
            },
            // Paragraph
            p: ({ children }) => {
              return <p className={fontConfig.p}>{children}</p>;
            },
            // Unordered List
            ul: ({ children }) => {
              return <ul className={fontConfig.ul}>{children}</ul>;
            },
            // Ordered List
            ol: ({ children }) => {
              return <ol className={fontConfig.ol}>{children}</ol>;
            },
            li: ({ children }) => {
              return <li className={fontConfig.li}>{children}</li>;
            },
            // Table
            table: ({ children }) => {
              return (
                <div className="overflow-x-auto my-6 border border-neutral-200 rounded-lg shadow-2xs">
                  <table className={fontConfig.table}>
                    {children}
                  </table>
                </div>
              );
            },
            thead: ({ children }) => {
              return <thead className="bg-neutral-50 text-neutral-900 font-semibold border-b border-neutral-200">{children}</thead>;
            },
            th: ({ children }) => {
              return <th className={fontConfig.th}>{children}</th>;
            },
            td: ({ children }) => {
              return <td className={fontConfig.td}>{children}</td>;
            },
            // Blockquote
            blockquote: ({ children }) => {
              return (
                <blockquote className={fontConfig.blockquote}>
                  {children}
                </blockquote>
              );
            },
            // Links
            a: ({ href, children }) => {
              const isExternal = href?.startsWith('http://') || href?.startsWith('https://');
              if (isExternal) {
                return (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-900 hover:text-blue-700 underline underline-offset-2 inline-flex items-center gap-0.5 font-medium transition-colors"
                  >
                    <span>{children}</span>
                    <ExternalLink className="w-3 h-3 inline-block shrink-0 opacity-60" />
                  </a>
                );
              }

              // Internal chapter link (e.g. "./02. Back Of the Envelope Estimation/")
              const chapterMatch = href?.match(/(?:0(\d)|(\d\d))\./);
              if (chapterMatch) {
                const targetNum = parseInt(chapterMatch[1] || chapterMatch[2], 10);
                const targetChapter = allChapters.find(c => c.number === targetNum);
                if (targetChapter) {
                  return (
                    <button
                      type="button"
                      onClick={() => onSelectChapter(targetChapter.id)}
                      className="text-neutral-900 hover:text-blue-700 font-medium underline inline transition-colors cursor-pointer"
                    >
                      {children}
                    </button>
                  );
                }
              }

              return (
                <a href={href} className="text-neutral-900 hover:text-blue-700 underline transition-colors">
                  {children}
                </a>
              );
            },
            // Code & Codeblocks
            code: ({ node, className, children, ...props }) => {
              const match = /language-(\w+)/.exec(className || '');
              const codeString = String(children).replace(/\n$/, '');
              const isBlock = codeString.includes('\n') || match;

              if (isBlock) {
                const codeId = `code-${Math.random().toString(36).slice(2, 7)}`;
                const lang = match ? match[1].toLowerCase() : 'text';

                if (lang === 'mermaid') {
                  return <MermaidDiagram code={codeString} language={language} />;
                }

                // PlantUML can be authored explicitly with `plantuml`, `puml`
                // or `uml`, and is also detected when a source block contains
                // an @startuml-style header. This keeps legacy documents from
                // falling back to an opaque code block.
                if (['plantuml', 'puml', 'uml'].includes(lang) || isPlantUmlSource(codeString)) {
                  return <PlantUmlDiagram code={codeString} language={language} />;
                }

                if (lang === 'callout') {
                  const attributes: Record<string, string> = {};
                  const lines = codeString.split('\n');
                  const header = lines[0] || '';
                  for (const item of header.matchAll(/([\w-]+)=(?:"([^"]*)"|'([^']*)'|([^\s]+))/g)) {
                    attributes[item[1]] = item[2] || item[3] || item[4] || '';
                  }
                  const body = Object.keys(attributes).length > 0 ? lines.slice(1).join('\n') : codeString;
                  const BlockRenderer = builtinRendererRegistry.getBlock('callout');
                  return BlockRenderer
                    ? <BlockRenderer name="callout" attributes={attributes}>{body}</BlockRenderer>
                    : <code {...props}>{children}</code>;
                }

                if (lang === 'text' && isTextFlowchart(codeString)) {
                  return (
                    <TextFlowchart
                      source={codeString}
                      onCopy={(source) => handleCopyCode(source, codeId)}
                      copied={copiedCodeId === codeId}
                      copyLabel={t.chapter.copy}
                      copiedLabel={t.chapter.copied}
                      editLabel={t.chapter.editFlowchart}
                      saveLabel={t.chapter.saveFlowchart}
                      cancelLabel={t.chapter.cancelFlowchart}
                      resetLabel={t.chapter.resetFlowchart}
                      editorHint={t.chapter.flowchartEditorHint}
                      invalidLabel={t.chapter.invalidFlowchart}
                    />
                  );
                }

                return (
                  <div className="my-5 rounded-lg overflow-hidden border border-neutral-800 bg-neutral-950 text-neutral-100 shadow-sm">
                    <div className="flex items-center justify-between px-3.5 py-2 bg-neutral-900 border-b border-neutral-800 text-xs text-neutral-400">
                      <span className="font-mono uppercase tracking-wider text-[11px] font-semibold text-neutral-400">
                        {lang}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(codeString, codeId)}
                        className="flex items-center gap-1 text-[11px] hover:text-neutral-100 text-neutral-400 transition-colors focus-visible:ring-1 focus-visible:ring-neutral-400 rounded px-1"
                        aria-label="Copy code to clipboard"
                      >
                        {copiedCodeId === codeId ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">{t.chapter.copied}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>{t.chapter.copy}</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className={fontConfig.preCode}>
                      <code>{children}</code>
                    </pre>
                  </div>
                );
              }

              return (
                <code className={fontConfig.inlineCode}>
                  {children}
                </code>
              );
            },
            // Image component
            img: ({ src, alt, width, style }) => {
              const originalSrc = src || '';
              const resolvedSrc = resolveImageUrl(chapter.folderName, originalSrc);

              return (
                <figure className="diagram-figure my-8 flex flex-col items-center">
                  <div
                    className="diagram-frame group relative cursor-pointer rounded-xl border border-neutral-200/90 bg-white p-2 sm:p-3 shadow-2xs hover:border-neutral-400 transition-colors"
                    onClick={() => onOpenLightbox(resolvedSrc, alt)}
                    title={t.chapter.expandDiagram}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onOpenLightbox(resolvedSrc, alt);
                      }
                    }}
                    aria-label={`Enlarge image: ${alt || 'System Architecture Diagram'}`}
                  >
                    <img
                      src={resolvedSrc}
                      alt={alt || 'System Architecture Diagram'}
                      className="diagram-image max-h-[680px] w-auto object-contain mx-auto transition-transform duration-150"
                      loading="lazy"
                      onLoad={(event) => {
                        const image = event.currentTarget;
                        image.dataset.orientation = image.naturalWidth >= image.naturalHeight * 1.35
                          ? 'landscape'
                          : 'portrait';
                      }}
                    />
                    <div className="absolute inset-0 bg-neutral-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <span className="bg-neutral-900/85 text-white text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-sm">
                        <Maximize2 className="w-3.5 h-3.5" />
                        {t.chapter.expandDiagram}
                      </span>
                    </div>
                  </div>

                  {alt && (
                    <figcaption className="text-center text-xs text-neutral-500 mt-3 italic max-w-2xl px-2">
                      {alt}
                    </figcaption>
                  )}
                </figure>
              );
            }
          }}
        >
          {activeMarkdown}
        </ReactMarkdown>
      </div>

      {/* Bottom Chapter Navigation */}
      <footer className="mt-14 pt-8 border-t border-neutral-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {prevChapter ? (
          <button
            id="prev-chapter-btn"
            type="button"
            onClick={() => onSelectChapter(prevChapter.id)}
            className="flex-1 p-4 rounded-lg border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50/60 text-left transition-all group focus-visible:ring-2 focus-visible:ring-neutral-900 shadow-2xs"
          >
            <span className="text-[11px] font-mono font-medium text-neutral-400 uppercase tracking-wider flex items-center gap-1">
              <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-0.5" />
              {t.chapter.prevChapter}
            </span>
            <span className="block text-sm font-semibold text-neutral-900 mt-1 line-clamp-1 group-hover:text-blue-700 transition-colors">
              {prevChapter.volume !== 0 ? (language === 'zh' ? `第${prevChapter.number}章: ` : `Ch ${prevChapter.number}: `) : ''}
              {truncateTitle(language === 'zh' ? (prevChapter.titleZh || prevChapter.title) : prevChapter.title)}
            </span>
          </button>
        ) : (
          <div className="flex-1" />
        )}

        {nextChapter ? (
          <button
            id="next-chapter-btn"
            type="button"
            onClick={() => onSelectChapter(nextChapter.id)}
            className="flex-1 p-4 rounded-lg border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50/60 text-right transition-all group focus-visible:ring-2 focus-visible:ring-neutral-900 shadow-2xs"
          >
            <span className="text-[11px] font-mono font-medium text-neutral-400 uppercase tracking-wider flex items-center justify-end gap-1">
              {t.chapter.nextChapter}
              <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </span>
            <span className="block text-sm font-semibold text-neutral-900 mt-1 line-clamp-1 group-hover:text-blue-700 transition-colors">
              {nextChapter.volume !== 0 ? (language === 'zh' ? `第${nextChapter.number}章: ` : `Ch ${nextChapter.number}: `) : ''}
              {truncateTitle(language === 'zh' ? (nextChapter.titleZh || nextChapter.title) : nextChapter.title)}
            </span>
          </button>
        ) : (
          <div className="flex-1" />
        )}
      </footer>
    </article>
  );
};
