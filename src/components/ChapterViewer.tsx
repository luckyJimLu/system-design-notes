import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Chapter, Language } from '../types';
import { resolveImageUrl } from '../content/catalog';
import { CalloutBlock } from '../renderers/CalloutBlock';
import { I18N_STRINGS } from '../data/i18n';
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
  Languages,
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
  onToggleLanguage?: () => void;
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
  onToggleLanguage
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

  const hasBilingual = Boolean(chapter.markdownZh && chapter.markdownEn);

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

  // Font size classes
  const fontClasses = {
    sm: 'prose-sm',
    base: 'prose-base',
    lg: 'prose-lg'
  }[fontSize];

  // Helper to slugify heading titles to match TableOfContents
  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
  };

  const currentTitle = language === 'zh' ? (chapter.titleZh || chapter.title) : chapter.title;
  const currentDesc = language === 'zh' ? (chapter.descriptionZh || chapter.description) : chapter.description;
  const currentTags = language === 'zh' ? (chapter.tagsZh || chapter.tags) : chapter.tags;

  return (
    <article className="max-w-4xl mx-auto py-8 px-4 sm:px-8">
      {/* Top Chapter Header Banner */}
      <header className="pb-6 mb-8 border-b border-neutral-200/90">
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

            {chapter.volume !== 0 && (
              <span className="text-xs font-medium text-neutral-500 bg-neutral-50 px-2 py-0.5 rounded border border-neutral-200/60 font-mono">
                {language === 'zh' ? `第 ${chapter.number} 章` : `Chapter ${chapter.number}`}
              </span>
            )}

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

        {/* Bilingual Quick-Switch Bar */}
        <div className="mb-4 flex items-center justify-between gap-2 p-2 px-3 rounded-lg bg-neutral-50 border border-neutral-200 text-xs text-neutral-600">
          <div className="flex items-center gap-2">
            <Languages className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
            <span className="font-medium text-neutral-700">
              {language === 'zh' ? '文档语言' : 'Document Language'}:
            </span>
            <div className="inline-flex rounded-md bg-neutral-200/70 p-0.5" role="group" aria-label="Document language selector">
              <button
                type="button"
                id="doc-lang-zh"
                onClick={() => {
                  if (language !== 'zh' && onToggleLanguage) onToggleLanguage();
                }}
                className={`px-2 py-0.5 text-xs rounded transition-all font-medium ${
                  language === 'zh'
                    ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
                aria-pressed={language === 'zh'}
              >
                中文
              </button>
              <button
                type="button"
                id="doc-lang-en"
                onClick={() => {
                  if (language !== 'en' && onToggleLanguage) onToggleLanguage();
                }}
                className={`px-2 py-0.5 text-xs rounded transition-all font-medium ${
                  language === 'en'
                    ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
                aria-pressed={language === 'en'}
              >
                English
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
            {hasBilingual ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                {language === 'zh' ? '中英双语就绪' : 'Bilingual Ready'}
              </span>
            ) : null}
          </div>
        </div>

        {/* Main Title */}
        <h1 className="text-2xl sm:text-3xl lg:text-3.5xl font-bold text-neutral-900 tracking-tight leading-tight">
          {chapter.volume !== 0 && (
            <span className="text-neutral-500 block text-xs font-mono font-semibold uppercase tracking-wider mb-1">
              {language === 'zh' ? `第 ${chapter.number} 章` : `Chapter ${chapter.number}`}
            </span>
          )}
          {currentTitle}
        </h1>

        {/* Subtitle in other language */}
        {language === 'zh' && chapter.titleZh && (
          <p className="text-xs font-mono text-neutral-500 mt-1">
            English: {chapter.title}
          </p>
        )}
        {language === 'en' && chapter.titleZh && (
          <p className="text-xs font-mono text-neutral-500 mt-1">
            中文: {chapter.titleZh}
          </p>
        )}

        {/* Executive Summary Card */}
        {currentDesc && (
          <div className="mt-5 p-4 rounded-lg bg-neutral-50 border border-neutral-200/90 text-xs sm:text-sm text-neutral-700 leading-relaxed">
            <span className="font-semibold text-neutral-900 mb-1 flex items-center gap-1.5 text-xs uppercase tracking-wider">
              {t.chapter.summaryHeading}
            </span>
            <p className="mt-1.5 leading-relaxed">{currentDesc}</p>

            {currentTags.length > 0 && (
              <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                {currentTags.map(tag => (
                  <span
                    key={tag}
                    className="text-[11px] font-mono px-2 py-0.5 rounded bg-white border border-neutral-200 text-neutral-600 shadow-2xs"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main Markdown Content Body */}
      <div className={`prose max-w-none text-neutral-800 ${fontClasses}`}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            // Heading 1
            h1: ({ children }) => {
              const text = String(children);
              const id = slugify(text);
              return (
                <h1 id={id} className="text-2xl sm:text-3xl font-bold mt-8 mb-4 scroll-mt-20 text-neutral-900 tracking-tight">
                  {children}
                </h1>
              );
            },
            // Heading 2
            h2: ({ children }) => {
              const text = String(children);
              const id = slugify(text);
              return (
                <h2 id={id} className="text-xl sm:text-2xl font-bold mt-10 mb-4 pb-2 border-b border-neutral-200/90 scroll-mt-20 text-neutral-900 flex items-center justify-between group">
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
                <h3 id={id} className="text-lg sm:text-xl font-semibold mt-6 mb-3 scroll-mt-20 text-neutral-900">
                  {children}
                </h3>
              );
            },
            // Paragraph
            p: ({ children }) => {
              return <p className="leading-relaxed mb-4 text-neutral-800">{children}</p>;
            },
            // Unordered List
            ul: ({ children }) => {
              return <ul className="list-disc pl-6 mb-4 space-y-1.5 text-neutral-800">{children}</ul>;
            },
            // Ordered List
            ol: ({ children }) => {
              return <ol className="list-decimal pl-6 mb-4 space-y-1.5 text-neutral-800">{children}</ol>;
            },
            // Table
            table: ({ children }) => {
              return (
                <div className="overflow-x-auto my-6 border border-neutral-200 rounded-lg shadow-2xs">
                  <table className="w-full text-left text-xs sm:text-sm border-collapse bg-white">
                    {children}
                  </table>
                </div>
              );
            },
            thead: ({ children }) => {
              return <thead className="bg-neutral-50 text-neutral-900 font-semibold border-b border-neutral-200">{children}</thead>;
            },
            th: ({ children }) => {
              return <th className="py-2.5 px-3.5 border-b border-neutral-200 text-xs font-semibold uppercase tracking-wider text-neutral-700">{children}</th>;
            },
            td: ({ children }) => {
              return <td className="py-2.5 px-3.5 border-b border-neutral-100 text-neutral-700">{children}</td>;
            },
            // Blockquote
            blockquote: ({ children }) => {
              return (
                <blockquote className="border-l-2 border-neutral-900 bg-neutral-50/70 py-3 px-4 my-5 rounded-r-md text-neutral-800 text-sm">
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
                const lang = match ? match[1] : 'text';

                if (lang === 'callout') {
                  const attributes: Record<string, string> = {};
                  const lines = codeString.split('\n');
                  const header = lines[0] || '';
                  for (const item of header.matchAll(/([\w-]+)=(?:"([^"]*)"|'([^']*)'|([^\s]+))/g)) {
                    attributes[item[1]] = item[2] || item[3] || item[4] || '';
                  }
                  const body = Object.keys(attributes).length > 0 ? lines.slice(1).join('\n') : codeString;
                  return <CalloutBlock name="callout" attributes={attributes}>{body}</CalloutBlock>;
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
                    <pre className="p-4 overflow-x-auto text-xs font-mono leading-relaxed bg-neutral-950 m-0 text-neutral-200">
                      <code>{children}</code>
                    </pre>
                  </div>
                );
              }

              return (
                <code className="font-mono text-xs bg-neutral-100 border border-neutral-200/80 text-neutral-800 px-1.5 py-0.5 rounded font-medium">
                  {children}
                </code>
              );
            },
            // Image component
            img: ({ src, alt, width, style }) => {
              const originalSrc = src || '';
              const resolvedSrc = resolveImageUrl(chapter.folderName, originalSrc);

              return (
                <figure className="my-6 flex flex-col items-center">
                  <div
                    className="group relative cursor-pointer overflow-hidden rounded-lg border border-neutral-200 bg-white p-2.5 sm:p-4 shadow-2xs hover:border-neutral-400 transition-colors max-w-full"
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
                      className="max-h-[500px] w-auto object-contain mx-auto transition-transform duration-150"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-neutral-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <span className="bg-neutral-900/85 text-white text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-sm">
                        <Maximize2 className="w-3.5 h-3.5" />
                        {t.chapter.expandDiagram}
                      </span>
                    </div>
                  </div>

                  {alt && (
                    <figcaption className="text-center text-xs text-neutral-500 mt-2 italic max-w-md">
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
              {language === 'zh' ? (prevChapter.titleZh || prevChapter.title) : prevChapter.title}
            </span>
          </button>
        ) : (
          <div className="flex-1" />
        )}

        {nextChapter ? (
