import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Chapter, Language } from '../types';
import { I18N_STRINGS } from '../data/i18n';
import { truncateTitle } from '../utils/title';
import { BOOKS, BOOK_ORDER, BookKey, getBookIdForChapter, getBookForChapter } from '../data/books';
import {
  CheckCircle2,
  Bookmark,
  Layers,
  FileText,
  ChevronLeft,
  ChevronRight,
  X,
  BookOpen,
} from 'lucide-react';

export type SidebarTab = 'all' | BookKey | 'saved';

interface SidebarProps {
  chapters: Chapter[];
  currentChapterId: string;
  onSelectChapter: (id: string) => void;
  bookmarks: Set<string>;
  completed: Set<string>;
  onToggleBookmark: (id: string) => void;
  onToggleCompleted: (id: string) => void;
  onOpenResources: () => void;
  isCurrentViewResources: boolean;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  language: Language;
  isCollapsed?: boolean;
  onToggleCollapsed?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  chapters,
  currentChapterId,
  onSelectChapter,
  bookmarks,
  completed,
  onToggleBookmark,
  onToggleCompleted,
  onOpenResources,
  isCurrentViewResources,
  isOpenMobile,
  onCloseMobile,
  language,
  isCollapsed = false,
  onToggleCollapsed,
}) => {
  const [activeTab, setActiveTab] = useState<SidebarTab>('all');
  const tabListRef = useRef<HTMLDivElement>(null);
  const t = I18N_STRINGS[language];

  // Count chapters for each book
  const bookCounts = useMemo(() => {
    const counts: Record<string, number> = { all: chapters.length, saved: bookmarks.size };
    for (const b of BOOK_ORDER) {
      counts[b] = 0;
    }
    for (const ch of chapters) {
      const bId = getBookIdForChapter(ch);
      counts[bId] = (counts[bId] || 0) + 1;
    }
    return counts;
  }, [chapters, bookmarks.size]);

  // Synchronize activeTab when current chapter changes to another book (if not in 'all' or 'saved')
  useEffect(() => {
    if (currentChapterId && activeTab !== 'all' && activeTab !== 'saved') {
      const ch = chapters.find(c => c.id === currentChapterId);
      if (ch) {
        const bId = getBookIdForChapter(ch);
        if (bId !== activeTab) {
          setActiveTab(bId);
        }
      }
    }
  }, [currentChapterId, chapters]);

  // Ensure active tab is visible in scroll container
  useEffect(() => {
    if (tabListRef.current) {
      const activeEl = tabListRef.current.querySelector<HTMLElement>('[aria-selected="true"]');
      if (activeEl && typeof activeEl.scrollIntoView === 'function') {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
    }
  }, [activeTab]);

  // Filter chapters based on active tab
  const filteredChapters = useMemo(() => {
    if (activeTab === 'saved') {
      return chapters.filter(c => bookmarks.has(c.id));
    }
    if (activeTab === 'all') {
      return chapters;
    }
    return chapters.filter(c => getBookIdForChapter(c) === activeTab);
  }, [chapters, activeTab, bookmarks]);

  // Group chapters by book for 'all' tab
  const chaptersByBook = useMemo(() => {
    const map = new Map<BookKey, Chapter[]>();
    for (const b of BOOK_ORDER) {
      map.set(b, []);
    }
    for (const ch of chapters) {
      const bId = getBookIdForChapter(ch);
      const list = map.get(bId) || [];
      list.push(ch);
      map.set(bId, list);
    }
    return map;
  }, [chapters]);

  const completedCount = completed.size;
  const progressPercent = chapters.length === 0
    ? 0
    : Math.min(100, Math.round((completedCount / chapters.length) * 100));

  const tabItems: { id: SidebarTab; label: string; count: number; icon?: typeof Bookmark }[] = [
    { id: 'all', label: t.tabs.all, count: chapters.length },
    { id: 'vol1', label: t.tabs.vol1, count: bookCounts['vol1'] || 0 },
    { id: 'vol2', label: t.tabs.vol2, count: bookCounts['vol2'] || 0 },
    { id: 'boost-asio', label: t.tabs.boostAsio, count: bookCounts['boost-asio'] || 0 },
    { id: 'cpp-concurrency', label: t.tabs.cppConcurrency, count: bookCounts['cpp-concurrency'] || 0 },
    { id: 'cpp-arch', label: t.tabs.cppArch, count: bookCounts['cpp-arch'] || 0 },
    { id: 'embedded', label: t.tabs.embedded, count: bookCounts['embedded'] || 0 },
    { id: 'tools', label: t.tabs.developerTools, count: bookCounts['tools'] || 0 },
    { id: 'saved', label: t.tabs.saved, count: bookmarks.size, icon: Bookmark },
  ];

  const handleTabKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const currentIndex = tabItems.findIndex(tab => tab.id === activeTab);
      const nextIndex = e.key === 'ArrowRight'
        ? (currentIndex + 1) % tabItems.length
        : (currentIndex - 1 + tabItems.length) % tabItems.length;
      setActiveTab(tabItems[nextIndex].id);
    }
  };

  const renderChapterItem = (ch: Chapter) => {
    const isActive = !isCurrentViewResources && currentChapterId === ch.id;
    const isCompleted = completed.has(ch.id);
    const isBookmarked = bookmarks.has(ch.id);
    const fullTitle = language === 'zh' ? (ch.titleZh || ch.title) : ch.title;
    const chTitle = truncateTitle(fullTitle);
    const book = getBookForChapter(ch);
    const bookBadge = language === 'zh' ? book.badgeZh : book.badgeEn;

    if (isCollapsed) {
      return (
        <div key={ch.id} className="relative flex justify-center py-1">
          <button
            type="button"
            aria-current={isActive ? 'page' : undefined}
            onClick={() => {
              onSelectChapter(ch.id);
              if (isOpenMobile) onCloseMobile();
            }}
            title={`${bookBadge} · ${ch.number}. ${fullTitle}`}
            className={`w-8 h-8 rounded-md flex items-center justify-center font-mono text-xs font-semibold transition-all relative group focus-visible:ring-2 focus-visible:ring-neutral-900 ${
              isActive
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            {ch.number}
            {isBookmarked && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500" />
            )}
            {!isBookmarked && isCompleted && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>
        </div>
      );
    }

    return (
      <div
        key={ch.id}
        id={`sidebar-chapter-${ch.id}`}
        className={`group relative flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors text-xs ${
          isActive
            ? 'bg-neutral-100 text-neutral-900 font-medium'
            : 'hover:bg-neutral-50 text-neutral-700'
        }`}
      >
        <button
          type="button"
          aria-current={isActive ? 'page' : undefined}
          onClick={() => {
            onSelectChapter(ch.id);
            if (isOpenMobile) onCloseMobile();
          }}
          className="flex items-center gap-2 min-w-0 pr-2 flex-1 text-left focus-visible:outline-none"
        >
          <span
            className={`shrink-0 w-5 h-5 rounded flex items-center justify-center font-mono text-[10px] font-semibold transition-colors ${
              isActive
                ? 'bg-neutral-900 text-white'
                : 'bg-neutral-100 text-neutral-600 group-hover:bg-neutral-200'
            }`}
          >
            {ch.number}
          </span>

          <span className="truncate leading-normal" title={fullTitle}>
            {chTitle}
          </span>
        </button>

        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              onToggleBookmark(ch.id);
            }}
            className={`p-1 rounded transition-colors ${
              isBookmarked
                ? 'text-amber-600'
                : 'text-neutral-300 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:text-neutral-700'
            }`}
            aria-label={isBookmarked ? (language === 'zh' ? '取消收藏' : 'Remove Bookmark') : (language === 'zh' ? '收藏章节' : 'Bookmark Chapter')}
            title={isBookmarked ? (language === 'zh' ? '取消收藏' : 'Remove Bookmark') : (language === 'zh' ? '收藏章节' : 'Bookmark Chapter')}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>

          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              onToggleCompleted(ch.id);
            }}
            className={`p-1 rounded transition-colors ${
              isCompleted
                ? 'text-emerald-600'
                : 'text-neutral-300 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:text-neutral-700'
            }`}
            aria-label={isCompleted ? (language === 'zh' ? '标记未读' : 'Mark as Incomplete') : (language === 'zh' ? '标记已读' : 'Mark as Read')}
            title={isCompleted ? (language === 'zh' ? '标记未读' : 'Mark as Incomplete') : (language === 'zh' ? '标记已读' : 'Mark as Read')}
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${isCompleted ? 'fill-emerald-100' : ''}`} />
          </button>
        </div>
      </div>
    );
  };

  const activeBook = activeTab in BOOKS ? BOOKS[activeTab as BookKey] : null;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-neutral-900/40 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="left-navigation-rail"
        aria-label={t.appTitle}
        className={`fixed top-0 bottom-0 left-0 z-40 bg-white border-r border-neutral-200 flex flex-col transition-all duration-200 ease-in-out ${
          isOpenMobile
            ? 'translate-x-0 w-72 sm:w-80 shadow-xl'
            : isCollapsed
              ? '-translate-x-full lg:translate-x-0 lg:w-14'
              : '-translate-x-full lg:translate-x-0 lg:w-72'
        }`}
      >
        {/* Brand Header */}
        <div className="p-3 sm:p-4 border-b border-neutral-200/90 flex items-center justify-between bg-white h-14">
          <div className={`flex items-center gap-2.5 overflow-hidden ${isCollapsed ? 'lg:justify-center lg:w-full' : ''}`}>
            <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold text-xs tracking-wider shrink-0">
              <Layers className="w-4 h-4 text-white" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <h1 className="text-sm font-semibold text-neutral-900 leading-tight truncate">
                  {t.appTitle}
                </h1>
                <p className="text-[11px] text-neutral-500 font-medium truncate">{t.appSubtitle}</p>
              </div>
            )}
          </div>

          {/* Desktop collapse toggle button */}
          {onToggleCollapsed && !isCollapsed && (
            <button
              type="button"
              onClick={onToggleCollapsed}
              className="hidden lg:flex p-1.5 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors focus-visible:ring-2 focus-visible:ring-neutral-900"
              aria-label={language === 'zh' ? '折叠导航栏' : 'Collapse navigation'}
              title={language === 'zh' ? '折叠导航栏' : 'Collapse navigation'}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {/* Desktop expand button when collapsed */}
          {onToggleCollapsed && isCollapsed && (
            <button
              type="button"
              onClick={onToggleCollapsed}
              className="hidden lg:flex p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors focus-visible:ring-2 focus-visible:ring-neutral-900 absolute right-2 top-3.5"
              aria-label={language === 'zh' ? '展开导航栏' : 'Expand navigation'}
              title={language === 'zh' ? '展开导航栏' : 'Expand navigation'}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {/* Mobile close button */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 lg:hidden focus-visible:ring-2 focus-visible:ring-neutral-900"
            aria-label="Close navigation menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Reading Progress Indicator */}
        {!isCollapsed && (
          <div className="px-4 py-2 bg-white border-b border-neutral-100">
            <div className="flex items-center justify-between text-[11px] text-neutral-500 mb-1.5">
              <span>{t.readingProgress}</span>
              <span className="font-semibold text-neutral-900 font-mono">
                {completedCount}/{chapters.length} ({progressPercent}%)
              </span>
            </div>
            <div className="w-full h-1 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-neutral-900 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Book Tabs List */}
        {!isCollapsed && (
          <div className="p-2 border-b border-neutral-200/80 bg-neutral-50/60">
            <div
              ref={tabListRef}
              role="tablist"
              aria-label={language === 'zh' ? '书籍分类与标签切换' : 'Book and category tabs'}
              onKeyDown={handleTabKeyDown}
              className="flex gap-1 p-0.5 bg-neutral-200/60 rounded-lg text-xs font-medium overflow-x-auto scrollbar-none"
            >
              {tabItems.map(tab => {
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setActiveTab(tab.id)}
                    className={`shrink-0 px-2 py-1 rounded-md transition-all text-center flex items-center gap-1.5 whitespace-nowrap ${
                      isSelected
                        ? 'bg-white text-neutral-900 font-semibold shadow-2xs'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                    title={`${tab.label} (${tab.count})`}
                  >
                    {tab.icon && <tab.icon className={`w-3 h-3 ${isSelected ? 'fill-current' : ''}`} />}
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] font-mono px-1 rounded-full ${
                        isSelected
                          ? 'bg-neutral-100 text-neutral-800'
                          : 'bg-neutral-300/50 text-neutral-600'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Chapter List Area */}
        <div className={`flex-1 overflow-y-auto space-y-0.5 ${isCollapsed ? 'p-1.5' : 'p-2'}`}>
          {/* Active Book Header Info (when a specific book is selected) */}
          {!isCollapsed && activeBook && activeTab !== 'all' && activeTab !== 'saved' && (
            <div className="p-2.5 mb-2 rounded-lg bg-neutral-50/90 border border-neutral-200/70">
              <div className="flex items-center justify-between gap-1.5 mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <BookOpen className="w-3.5 h-3.5 text-neutral-700 shrink-0" />
                  <span className="font-semibold text-xs text-neutral-900 truncate">
                    {language === 'zh' ? activeBook.titleZh : activeBook.titleEn}
                  </span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white text-neutral-600 border border-neutral-200/80 shrink-0">
                  {filteredChapters.length} {language === 'zh' ? '篇' : 'chs'}
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 leading-relaxed line-clamp-2">
                {language === 'zh' ? activeBook.descriptionZh : activeBook.descriptionEn}
              </p>
            </div>
          )}

          {/* Empty State */}
          {filteredChapters.length === 0 ? (
            !isCollapsed ? (
              <div className="py-12 text-center text-xs text-neutral-400">
                {activeTab === 'saved'
                  ? t.sidebar.noSaved
                  : t.sidebar.noMatches}
              </div>
            ) : null
          ) : activeTab === 'all' && !isCollapsed ? (
            /* Grouped Book View for 'all' tab */
            BOOK_ORDER.map(bKey => {
              const bookChapters = chaptersByBook.get(bKey) || [];
              if (bookChapters.length === 0) return null;
              const book = BOOKS[bKey];
              const bookTitle = language === 'zh' ? book.titleZh : book.titleEn;
              return (
                <div key={bKey} className="pt-2 first:pt-0">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setActiveTab(bKey)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setActiveTab(bKey);
                      }
                    }}
                    className="flex items-center justify-between px-2 py-1 mb-1 rounded text-[11px] font-semibold text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/80 cursor-pointer transition-colors group"
                    title={language === 'zh' ? `点击切换到《${bookTitle}》标签` : `Switch to ${bookTitle} tab`}
                  >
                    <span className="truncate flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 group-hover:bg-neutral-900 transition-colors" />
                      {bookTitle}
                    </span>
                    <span className="font-mono text-[10px] text-neutral-400 group-hover:text-neutral-700 shrink-0 ml-1.5">
                      {bookChapters.length} {language === 'zh' ? '篇' : 'chs'}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {bookChapters.map(renderChapterItem)}
                  </div>
                </div>
              );
            })
          ) : (
            /* Flat filtered list for specific book, saved tab, or collapsed mode */
            filteredChapters.map(renderChapterItem)
          )}
        </div>

        {/* Secondary navigation */}
        <div className={`border-t border-neutral-200 bg-neutral-50/50 ${isCollapsed ? 'p-2 flex justify-center' : 'p-3'}`}>
          <button
            id="sidebar-resources-btn"
            type="button"
            onClick={() => {
              onOpenResources();
              if (isOpenMobile) onCloseMobile();
            }}
            title={t.sidebar.resourcesBtn}
            className={`flex items-center rounded-md transition-colors border group focus-visible:ring-2 focus-visible:ring-neutral-900 ${
              isCollapsed
                ? 'w-9 h-9 justify-center p-0'
                : 'w-full justify-between px-3 py-2 text-xs font-medium'
            } ${
              isCurrentViewResources
                ? 'bg-neutral-900 text-white border-neutral-900'
                : 'text-neutral-800 bg-white border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            <span className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2'}`}>
              <FileText className={`w-3.5 h-3.5 ${isCurrentViewResources ? 'text-white' : 'text-neutral-700'}`} />
              {!isCollapsed && <span>{t.sidebar.resourcesBtn}</span>}
            </span>
            {!isCollapsed && (
              <span className={`text-[10px] ${isCurrentViewResources ? 'text-neutral-300' : 'text-neutral-400'}`}>
                {t.sidebar.resourcesCount}
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
