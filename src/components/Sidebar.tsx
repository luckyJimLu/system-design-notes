import React, { useState } from 'react';
import { Chapter, Language } from '../types';
import { I18N_STRINGS } from '../data/i18n';
import {
  Search,
  CheckCircle2,
  Bookmark,
  Layers,
  Sparkles,
  FileText,
  X,
} from 'lucide-react';

interface SidebarProps {
  chapters: Chapter[];
  currentChapterId: string;
  onSelectChapter: (id: string) => void;
  bookmarks: Set<string>;
  completed: Set<string>;
  onToggleBookmark: (id: string) => void;
  onToggleCompleted: (id: string) => void;
  onOpenSearch: () => void;
  onOpenCheatSheet: () => void;
  onOpenResources: () => void;
  isCurrentViewResources: boolean;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  language: Language;
}

export const Sidebar: React.FC<SidebarProps> = ({
  chapters,
  currentChapterId,
  onSelectChapter,
  bookmarks,
  completed,
  onToggleBookmark,
  onToggleCompleted,
  onOpenSearch,
  onOpenCheatSheet,
  onOpenResources,
  isCurrentViewResources,
  isOpenMobile,
  onCloseMobile,
  language
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'vol1' | 'vol2' | 'modem' | 'saved'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const t = I18N_STRINGS[language];

  // Filter chapters based on active tab & category
  const filteredChapters = chapters.filter(c => {
    if (activeTab === 'vol1' && c.volume !== 1) return false;
    if (activeTab === 'vol2' && c.volume !== 2) return false;
    if (activeTab === 'modem' && c.volume !== 0) return false;
    if (activeTab === 'saved' && !bookmarks.has(c.id)) return false;

    if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;

    return true;
  });

  const completedCount = completed.size;
  const progressPercent = Math.round((completedCount / chapters.length) * 100);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-neutral-900/50 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 sm:w-80 bg-white border-r border-neutral-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-neutral-900 leading-tight">
                {t.appTitle}
              </h1>
              <p className="text-[11px] text-neutral-500">{t.appSubtitle}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Search Trigger */}
        <div className="p-3 border-b border-neutral-100">
          <button
            id="sidebar-search-btn"
            type="button"
            onClick={() => {
              onOpenSearch();
              if (isOpenMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-between px-3 py-2 text-xs text-neutral-500 bg-neutral-100 hover:bg-neutral-200/80 rounded-lg transition-colors group text-left"
          >
            <span className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-600" />
              <span>{t.searchPlaceholder}</span>
            </span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-neutral-400 bg-white rounded border border-neutral-200 shadow-2xs">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Reading Progress Indicator */}
        <div className="px-4 py-2.5 bg-neutral-50 border-b border-neutral-100">
          <div className="flex items-center justify-between text-[11px] text-neutral-600 mb-1.5">
            <span className="font-medium">{t.readingProgress}</span>
            <span className="font-bold text-neutral-900 font-mono">
              {completedCount}/{chapters.length} ({progressPercent}%)
            </span>
          </div>
          <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Volume & Section Tabs */}
        <div className="flex items-center px-2 pt-2 border-b border-neutral-200 bg-white gap-1 text-xs overflow-x-auto select-none">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-2.5 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            {t.tabs.all} ({chapters.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('vol1')}
            className={`px-2.5 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
              activeTab === 'vol1'
                ? 'bg-blue-600 text-white'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            {t.tabs.vol1}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('vol2')}
            className={`px-2.5 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
              activeTab === 'vol2'
                ? 'bg-emerald-700 text-white'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            {t.tabs.vol2}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('modem')}
            className={`px-2.5 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
              activeTab === 'modem'
                ? 'bg-purple-700 text-white'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            {t.tabs.modem} ({chapters.filter(c => c.volume === 0).length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('saved')}
            className={`px-2 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap flex items-center gap-1 ${
              activeTab === 'saved'
                ? 'bg-amber-600 text-white'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
            title={t.tabs.saved}
          >
            <Bookmark className="w-3 h-3 fill-current" />
            <span>({bookmarks.size})</span>
          </button>
        </div>

        {/* Chapter List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredChapters.length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-500">
              {activeTab === 'saved'
                ? t.sidebar.noSaved
                : t.sidebar.noMatches}
            </div>
          ) : (
            filteredChapters.map(ch => {
              const isActive = !isCurrentViewResources && currentChapterId === ch.id;
              const isCompleted = completed.has(ch.id);
              const isBookmarked = bookmarks.has(ch.id);
              const chTitle = language === 'zh' ? (ch.titleZh || ch.title) : ch.title;

              return (
                <div
                  key={ch.id}
                  id={`sidebar-chapter-${ch.id}`}
                  className={`group relative flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                    isActive
                      ? 'bg-blue-50 text-blue-900 font-semibold border-l-3 border-blue-600 shadow-2xs'
                      : 'hover:bg-neutral-100 text-neutral-700'
                  }`}
                  onClick={() => {
                    onSelectChapter(ch.id);
                    if (isOpenMobile) onCloseMobile();
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    {/* Chapter Number Badge */}
                    <span
                      className={`shrink-0 w-6 h-6 rounded flex items-center justify-center font-mono text-[11px] font-bold ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : ch.volume === 1
                          ? 'bg-blue-100 text-blue-800'
                          : ch.volume === 2
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {ch.volume === 0 ? (ch.id.includes('rtos') ? 'RT' : 'EM') : ch.number}
                    </span>

                    <span className="truncate leading-tight">
                      {chTitle}
                    </span>
                  </div>

                  {/* Read / Bookmark Status Buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        onToggleBookmark(ch.id);
                      }}
                      className={`p-1 rounded transition-colors ${
                        isBookmarked
                          ? 'text-amber-500'
                          : 'text-neutral-300 opacity-0 group-hover:opacity-100 hover:text-neutral-600'
                      }`}
                      title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Chapter'}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-500' : ''}`} />
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
                          : 'text-neutral-300 opacity-0 group-hover:opacity-100 hover:text-neutral-600'
                      }`}
                      title={isCompleted ? 'Mark as Incomplete' : 'Mark as Read'}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Quick Tools */}
        <div className="p-3 border-t border-neutral-200 bg-neutral-50/70 space-y-1.5">
          <button
            id="sidebar-cheatsheet-btn"
            type="button"
            onClick={() => {
              onOpenCheatSheet();
              if (isOpenMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-neutral-800 bg-white border border-neutral-200 hover:border-blue-300 hover:bg-blue-50/50 rounded-lg transition-colors shadow-2xs group"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>{t.sidebar.cheatSheetBtn}</span>
            </span>
            <span className="text-[10px] text-neutral-400 group-hover:text-blue-600">{t.sidebar.cheatSheetDesc}</span>
          </button>

          <button
            id="sidebar-resources-btn"
            type="button"
            onClick={() => {
              onOpenResources();
              if (isOpenMobile) onCloseMobile();
            }}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors border shadow-2xs group ${
              isCurrentViewResources
                ? 'bg-blue-600 text-white border-blue-600'
                : 'text-neutral-800 bg-white border-neutral-200 hover:border-blue-300 hover:bg-blue-50/50'
            }`}
          >
            <span className="flex items-center gap-2">
              <FileText className={`w-3.5 h-3.5 ${isCurrentViewResources ? 'text-white' : 'text-emerald-600'}`} />
              <span>{t.sidebar.resourcesBtn}</span>
            </span>
            <span className={`text-[10px] ${isCurrentViewResources ? 'text-blue-100' : 'text-neutral-400'}`}>
              {t.sidebar.resourcesCount}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};
