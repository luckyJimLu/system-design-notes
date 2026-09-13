import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import { Chapter, Language } from '../types';
import { truncateTitle } from '../utils/title';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapters: Chapter[];
  onSelectChapter: (chapterId: string) => void;
  language?: Language;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  chapters,
  onSelectChapter,
  language = 'en'
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
      return () => window.clearTimeout(focusTimer);
    }
    previousFocusRef.current?.focus();
    previousFocusRef.current = null;
  }, [isOpen]);

  // Handle global shortcut key & escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter results
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Return popular / recommended chapters when query is empty
      return chapters.slice(0, 7).map(ch => ({
        chapter: ch,
        matchType: 'featured' as const,
        snippet: (language === 'zh' ? ch.descriptionZh : ch.description) || ch.description
      }));
    }

    const matched: {
      chapter: Chapter;
      matchType: 'title' | 'tag' | 'content';
      snippet: string;
      score: number;
    }[] = [];

    for (const chapter of chapters) {
      const titleEn = chapter.title.toLowerCase();
      const titleZh = (chapter.titleZh || '').toLowerCase();
      const descEn = chapter.description.toLowerCase();
      const descZh = (chapter.descriptionZh || '').toLowerCase();

      const numMatch =
        q === `ch${chapter.number}` ||
        q === `chapter ${chapter.number}` ||
        q === `${chapter.number}` ||
        q === `第${chapter.number}章` ||
        q === `第${chapter.number}`;

      const tagEnMatch = chapter.tags.some(t => t.toLowerCase().includes(q));
      const tagZhMatch = (chapter.tagsZh || []).some(t => t.toLowerCase().includes(q));

      if (numMatch) {
        matched.push({
          chapter,
          matchType: 'title',
          snippet: (language === 'zh' ? chapter.descriptionZh : chapter.description) || chapter.description,
          score: 100
        });
        continue;
      }

      if (titleZh.includes(q) || titleEn.includes(q)) {
        matched.push({
          chapter,
          matchType: 'title',
          snippet: (language === 'zh' ? chapter.descriptionZh : chapter.description) || chapter.description,
          score: 85
        });
        continue;
      }

      if (tagZhMatch || tagEnMatch) {
        const displayTags = (language === 'zh' && chapter.tagsZh?.length) ? chapter.tagsZh : chapter.tags;
        matched.push({
          chapter,
          matchType: 'tag',
          snippet: `${language === 'zh' ? '标签' : 'Tagged with'}: ${displayTags.join(', ')}`,
          score: 65
        });
        continue;
      }

      if (descZh.includes(q) || descEn.includes(q)) {
        matched.push({
          chapter,
          matchType: 'content',
          snippet: (language === 'zh' ? chapter.descriptionZh : chapter.description) || chapter.description,
          score: 55
        });
        continue;
      }

      // Content search across both Chinese and English markdown
      const targetMarkdown = language === 'zh'
        ? (chapter.markdownZh || chapter.markdown)
        : (chapter.markdownEn || chapter.markdown);
      const altMarkdown = language === 'zh'
        ? (chapter.markdownEn || chapter.markdown)
        : (chapter.markdownZh || chapter.markdown);

      let matchedMd = targetMarkdown;
      let index = targetMarkdown.toLowerCase().indexOf(q);

      if (index === -1 && altMarkdown) {
        index = altMarkdown.toLowerCase().indexOf(q);
        matchedMd = altMarkdown;
      }

      if (index !== -1) {
        const start = Math.max(0, index - 40);
        const end = Math.min(matchedMd.length, index + 110);
        let snippet = matchedMd.slice(start, end).replace(/\n+/g, ' ');
        if (start > 0) snippet = '...' + snippet;
        if (end < matchedMd.length) snippet = snippet + '...';

        matched.push({
          chapter,
          matchType: 'content',
          snippet,
          score: 40
        });
      }
    }

    matched.sort((a, b) => b.score - a.score);
    return matched.slice(0, 10);
  }, [query, chapters, language]);

  // Keyboard navigation within results
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, results.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + results.length) % Math.max(1, results.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        onSelectChapter(results[selectedIndex].chapter.id);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="search-modal-backdrop"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-neutral-900/50 backdrop-blur-xs animate-in fade-in duration-100"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        id="search-modal-container"
        role="dialog"
        aria-modal="true"
        aria-label={language === 'zh' ? '全局搜索' : 'Search Chapters'}
        className="w-full max-w-2xl bg-white rounded-xl shadow-xl border border-neutral-200 overflow-hidden flex flex-col max-h-[80vh]"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-200 bg-white">
          <Search className="w-4 h-4 text-neutral-400 shrink-0" />
          <input
            ref={inputRef}
            id="search-input"
            type="text"
            placeholder={
              language === 'zh'
                ? '搜索系统设计章节、架构模式、标签 (例如：限流、哈希、布隆过滤器、消息队列)...'
                : 'Search architecture chapters, system patterns, tags (e.g. rate limiter, kafka)...'
            }
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="flex-1 bg-transparent border-none text-neutral-900 placeholder:text-neutral-400 text-sm focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-neutral-400 hover:text-neutral-600 rounded"
              aria-label="Clear search input"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-neutral-400 bg-neutral-100 rounded border border-neutral-200">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-neutral-100">
          {results.length === 0 ? (
            <div className="py-12 text-center text-neutral-500 text-sm">
              {language === 'zh' ? (
                <>未找到匹配 "{<span className="font-semibold text-neutral-800">{query}</span>}" 的系统架构章节或概念。</>
              ) : (
                <>No matching chapters or architecture concepts found for <span className="font-semibold text-neutral-800">"{query}"</span>.</>
              )}
            </div>
          ) : (
            results.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const ch = item.chapter;
              const fullTitle = language === 'zh' ? (ch.titleZh || ch.title) : ch.title;
              const chTitle = truncateTitle(fullTitle);
              return (
                <div
                  key={ch.id}
                  id={`search-item-${ch.id}`}
                  onClick={() => {
                    onSelectChapter(ch.id);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-2.5 rounded-lg cursor-pointer transition-colors flex items-start gap-3 ${
                    isSelected ? 'bg-neutral-100 text-neutral-900' : 'hover:bg-neutral-50 text-neutral-700'
                  }`}
                >
                  <div
                    className={`shrink-0 w-7 h-7 rounded flex items-center justify-center font-mono text-xs font-semibold ${
                      isSelected ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-700'
                    }`}
                  >
                    {ch.number}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-neutral-900 truncate">
                        {ch.volume !== 0 ? (language === 'zh' ? `第 ${ch.number} 章: ` : `Chapter ${ch.number}: `) : ''}
                        {chTitle}
                      </h4>
                      <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 shrink-0 border border-neutral-200/60">
                        {ch.volume === 1 ? 'Vol 1' : ch.volume === 2 ? 'Vol 2' : (ch.id.includes('rtos') ? 'RTOS' : 'Embedded')}
                      </span>
                    </div>

                    <p className="text-xs text-neutral-500 mt-1 line-clamp-2 leading-relaxed">
                      {item.snippet}
                    </p>
                  </div>

                  <ArrowRight
                    className={`w-4 h-4 mt-2 shrink-0 transition-opacity ${
                      isSelected ? 'text-neutral-900 opacity-100' : 'opacity-0'
                    }`}
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-white rounded border border-neutral-200 text-[10px] font-mono">↑</kbd>
              <kbd className="px-1 py-0.5 bg-white rounded border border-neutral-200 text-[10px] font-mono">↓</kbd>
              <span className="text-[11px]">{language === 'zh' ? '导航' : 'Navigate'}</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-neutral-200 text-[10px] font-mono">↵</kbd>
              <span className="text-[11px]">{language === 'zh' ? '选择' : 'Select'}</span>
            </span>
          </div>
          <span className="text-[11px] text-neutral-400 font-mono">
            {language === 'zh' ? '系统设计快速索引' : 'System Design Index'}
          </span>
        </div>
      </div>
    </div>
  );
};
