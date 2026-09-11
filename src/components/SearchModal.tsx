import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import { Chapter, Language } from '../types';
import { I18N_STRINGS } from '../data/i18n';

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
  const t = I18N_STRINGS[language];

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
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

      // Content search in markdown
      const contentLower = chapter.markdown.toLowerCase();
      const index = contentLower.indexOf(q);
      if (index !== -1) {
        const start = Math.max(0, index - 40);
        const end = Math.min(contentLower.length, index + 110);
        let snippet = chapter.markdown.slice(start, end).replace(/\n+/g, ' ');
        if (start > 0) snippet = '...' + snippet;
        if (end < contentLower.length) snippet = snippet + '...';

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
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-neutral-900/60 backdrop-blur-sm animate-in fade-in duration-100"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="search-modal-container"
        className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[80vh]"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-neutral-200 bg-neutral-50/50">
          <Search className="w-5 h-5 text-neutral-400 shrink-0" />
          <input
            ref={inputRef}
            id="search-input"
            type="text"
            placeholder={
              language === 'zh'
                ? '搜索全部28个章节、系统设计主题、标签 (例如：限流、哈希、布隆过滤器、消息队列)...'
                : 'Search all 28 chapters, topics, tags (e.g. rate limiter, kafka, quadtree)...'
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
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-neutral-400 bg-neutral-200 rounded border border-neutral-300">
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
              const chTitle = language === 'zh' ? (ch.titleZh || ch.title) : ch.title;
              const displayTags = (language === 'zh' && ch.tagsZh?.length) ? ch.tagsZh : ch.tags;

              return (
                <div
                  key={ch.id}
                  id={`search-item-${ch.id}`}
                  onClick={() => {
                    onSelectChapter(ch.id);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors flex items-start gap-3 ${
                    isSelected ? 'bg-blue-50/80 text-neutral-900' : 'hover:bg-neutral-50'
                  }`}
                >
                  <div
                    className={`shrink-0 w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold ${
                      ch.volume === 1
                        ? 'bg-blue-100 text-blue-800'
                        : ch.volume === 2
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {ch.volume === 0 ? (ch.id.includes('rtos') ? 'RT' : 'EM') : ch.number}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-neutral-900 truncate">
                        {ch.volume !== 0 ? (language === 'zh' ? `第 ${ch.number} 章: ` : `Chapter ${ch.number}: `) : ''}
                        {chTitle}
                      </h4>
                      <span className="text-[10px] uppercase font-medium px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 shrink-0">
                        {ch.volume === 1 ? 'Vol 1' : ch.volume === 2 ? 'Vol 2' : (ch.id.includes('rtos') ? 'RTOS' : 'Embedded')}
                      </span>
                    </div>

                    {language === 'zh' && ch.titleZh && (
                      <p className="text-[11px] font-mono text-neutral-400 truncate">
                        {ch.title}
                      </p>
                    )}

                    <p className="text-xs text-neutral-500 mt-1 line-clamp-2 leading-relaxed">
                      {item.snippet}
                    </p>

                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {displayTags.slice(0, 4).map(tag => (
                        <span
                          key={tag}
                          className="text-[10px] px-1.5 py-0.2 bg-neutral-100 text-neutral-600 rounded font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <ArrowRight
                    className={`w-4 h-4 mt-2 shrink-0 transition-opacity ${
                      isSelected ? 'text-blue-600 opacity-100' : 'opacity-0'
                    }`}
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white rounded border text-[10px]">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white rounded border text-[10px]">↓</kbd>
              {language === 'zh' ? '导航' : 'Navigate'}
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white rounded border text-[10px]">↵</kbd>
              {language === 'zh' ? '选择打开' : 'Select'}
            </span>
          </div>
          <span className="text-neutral-400">
            {language === 'zh' ? '系统设计笔记 • 快速索引' : 'System Design Notes Reference'}
          </span>
        </div>
      </div>
    </div>
  );
};
