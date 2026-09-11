import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Chapter, Language } from '../types';
import { resolveImageUrl } from '../data/chaptersData';
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
  language
}) => {
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const t = I18N_STRINGS[language];

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
      <header className="pb-6 mb-8 border-b border-neutral-200">
        {/* Meta badges & Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                chapter.volume === 1
                  ? 'bg-blue-100 text-blue-800'
                  : chapter.volume === 2
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-purple-100 text-purple-800'
              }`}
            >
              {chapter.volume === 1
                ? t.chapter.vol1
                : chapter.volume === 2
                ? t.chapter.vol2
                : t.chapter.modem}
            </span>

            {chapter.volume !== 0 && (
              <span className="text-xs font-semibold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                {language === 'zh' ? `第 ${chapter.number} 章` : `Chapter ${chapter.number}`}
              </span>
            )}

            <span className="flex items-center gap-1 text-xs text-neutral-500">
              <Clock className="w-3.5 h-3.5" />
              {language === 'zh'
                ? `${t.chapter.minRead} ${chapter.estimatedReadTimeMinutes} 分钟`
                : `${chapter.estimatedReadTimeMinutes} ${t.chapter.minRead}`}
            </span>
          </div>

          {/* Reader Action buttons */}
          <div className="flex items-center gap-2">
            <button
              id={`bookmark-btn-${chapter.id}`}
              type="button"
              onClick={() => onToggleBookmark(chapter.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                isBookmarked
                  ? 'bg-amber-50 text-amber-700 border-amber-300'
                  : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
              }`}
              title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Chapter'}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-500 text-amber-500' : ''}`} />
              <span>{isBookmarked ? t.chapter.bookmarked : t.chapter.bookmark}</span>
            </button>

            <button
              id={`complete-btn-${chapter.id}`}
              type="button"
              onClick={() => onToggleCompleted(chapter.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                isCompleted
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
              }`}
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
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-neutral-900 tracking-tight leading-tight">
          {chapter.volume !== 0 && (
            <span className="text-blue-600 block text-sm font-semibold uppercase tracking-wider mb-1">
              {language === 'zh' ? `第 ${chapter.number} 章` : `Chapter ${chapter.number}`}
            </span>
          )}
          {currentTitle}
        </h1>

        {/* Subtitle in other language if viewing Chinese */}
        {language === 'zh' && chapter.titleZh && (
          <p className="text-xs font-mono text-neutral-400 mt-1">
            English: {chapter.title}
          </p>
        )}

        {/* Executive Summary Card */}
        {currentDesc && (
          <div className="mt-4 p-4 rounded-xl bg-neutral-100/70 border border-neutral-200/80 text-xs sm:text-sm text-neutral-700 leading-relaxed">
            <span className="font-semibold text-neutral-900 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              {t.chapter.summaryHeading}
            </span>
            <p className="mt-1">{currentDesc}</p>

            {currentTags.length > 0 && (
              <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                {currentTags.map(tag => (
                  <span
                    key={tag}
                    className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-white border border-neutral-200 text-neutral-600 shadow-2xs"
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
                <h1 id={id} className="text-2xl sm:text-3xl font-bold mt-8 mb-4 scroll-mt-20 text-neutral-900">
                  {children}
                </h1>
              );
            },
            // Heading 2
            h2: ({ children }) => {
              const text = String(children);
              const id = slugify(text);
              return (
                <h2 id={id} className="text-xl sm:text-2xl font-bold mt-10 mb-4 pb-2 border-b border-neutral-200 scroll-mt-20 text-neutral-900 flex items-center justify-between group">
                  <span>{children}</span>
                  <a
                    href={`#${id}`}
                    className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-blue-600 text-sm font-normal transition-opacity pl-2"
                    aria-hidden="true"
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
              return <ul className="list-disc pl-6 mb-4 space-y-1 text-neutral-800">{children}</ul>;
            },
            // Ordered List
            ol: ({ children }) => {
              return <ol className="list-decimal pl-6 mb-4 space-y-1 text-neutral-800">{children}</ol>;
            },
            // Table
            table: ({ children }) => {
              return (
                <div className="overflow-x-auto my-6 border border-neutral-200 rounded-lg shadow-2xs">
                  <table className="w-full text-left text-sm border-collapse bg-white">
                    {children}
                  </table>
                </div>
              );
            },
            thead: ({ children }) => {
              return <thead className="bg-neutral-100 text-neutral-800 font-semibold border-b border-neutral-200">{children}</thead>;
            },
            th: ({ children }) => {
              return <th className="py-2.5 px-3.5 border-b border-neutral-200 text-xs font-semibold uppercase tracking-wider">{children}</th>;
            },
            td: ({ children }) => {
              return <td className="py-2.5 px-3.5 border-b border-neutral-100 text-xs sm:text-sm">{children}</td>;
            },
            // Blockquote
            blockquote: ({ children }) => {
              return (
                <blockquote className="border-l-4 border-blue-500 bg-blue-50/40 py-2.5 px-4 my-4 rounded-r-lg text-neutral-700 italic text-sm">
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
                    className="text-blue-600 hover:text-blue-800 underline underline-offset-2 inline-flex items-center gap-0.5 font-medium"
                  >
                    <span>{children}</span>
                    <ExternalLink className="w-3 h-3 inline-block shrink-0 opacity-70" />
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
                      className="text-blue-600 hover:text-blue-800 font-medium underline inline"
                    >
                      {children}
                    </button>
                  );
                }
              }

              return (
                <a href={href} className="text-blue-600 hover:text-blue-800 underline">
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

                return (
                  <div className="my-5 rounded-lg overflow-hidden border border-neutral-700 bg-neutral-900 text-neutral-100 shadow-md">
                    <div className="flex items-center justify-between px-3.5 py-2 bg-neutral-950 border-b border-neutral-800 text-xs text-neutral-400">
                      <span className="font-mono uppercase tracking-wider text-[11px] font-semibold text-neutral-400">
                        {lang}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(codeString, codeId)}
                        className="flex items-center gap-1 text-[11px] hover:text-neutral-200 text-neutral-400 transition-colors"
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
                    <pre className="p-4 overflow-x-auto text-xs font-mono leading-relaxed bg-neutral-900 m-0">
                      <code>{children}</code>
                    </pre>
                  </div>
                );
              }

              return (
                <code className="font-mono text-xs bg-neutral-100 border border-neutral-200 text-blue-700 px-1.5 py-0.5 rounded font-semibold">
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
                    className="group relative cursor-pointer overflow-hidden rounded-xl border border-neutral-200 bg-white p-2.5 sm:p-4 shadow-sm hover:border-blue-400 hover:shadow-md transition-all max-w-full"
                    onClick={() => onOpenLightbox(resolvedSrc, alt)}
                    title={t.chapter.expandDiagram}
                  >
                    <img
                      src={resolvedSrc}
                      alt={alt || 'System Architecture Diagram'}
                      className="max-h-[500px] w-auto object-contain mx-auto transition-transform duration-200 group-hover:scale-[1.01]"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-neutral-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <span className="bg-neutral-900/80 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg backdrop-blur-xs">
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
          {chapter.markdown}
        </ReactMarkdown>
      </div>

      {/* Bottom Chapter Navigation */}
      <footer className="mt-14 pt-8 border-t border-neutral-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {prevChapter ? (
          <button
            id="prev-chapter-btn"
            type="button"
            onClick={() => onSelectChapter(prevChapter.id)}
            className="flex-1 p-4 rounded-xl border border-neutral-200 hover:border-blue-300 hover:bg-neutral-50 text-left transition-all group"
          >
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
              <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-1" />
              {t.chapter.prevChapter}
            </span>
            <span className="block text-sm font-bold text-neutral-900 mt-1 line-clamp-1 group-hover:text-blue-600">
              {prevChapter.volume !== 0 ? (language === 'zh' ? `第${prevChapter.number}章: ` : `Ch ${prevChapter.number}: `) : ''}
              {language === 'zh' ? (prevChapter.titleZh || prevChapter.title) : prevChapter.title}
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
            className="flex-1 p-4 rounded-xl border border-neutral-200 hover:border-blue-300 hover:bg-neutral-50 text-right transition-all group"
          >
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center justify-end gap-1">
              {t.chapter.nextChapter}
              <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
            </span>
            <span className="block text-sm font-bold text-neutral-900 mt-1 line-clamp-1 group-hover:text-blue-600">
              {nextChapter.volume !== 0 ? (language === 'zh' ? `第${nextChapter.number}章: ` : `Ch ${nextChapter.number}: `) : ''}
              {language === 'zh' ? (nextChapter.titleZh || nextChapter.title) : nextChapter.title}
            </span>
          </button>
        ) : (
          <div className="flex-1" />
        )}
      </footer>
    </article>
  );
};
