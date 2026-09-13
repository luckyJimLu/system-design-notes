import React, { useState } from 'react';
import { Chapter, Language } from '../types';
import { I18N_STRINGS } from '../data/i18n';
import { truncateTitle } from '../utils/title';
import {
  CheckCircle2,
  Bookmark,
  Layers,
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
  onOpenResources,
  isCurrentViewResources,
  isOpenMobile,
  onCloseMobile,
  language
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'vol1' | 'vol2' | 'modem' | 'saved'>('all');
  const t = I18N_STRINGS[language];

  // Filter chapters based on active tab
  const filteredChapters = chapters.filter(c => {
    if (activeTab === 'vol1' && c.volume !== 1) return false;
    if (activeTab === 'vol2' && c.volume !== 2) return false;
    if (activeTab === 'modem' && c.volume !== 0) return false;
    if (activeTab === 'saved' && !bookmarks.has(c.id)) return false;
    return true;
  });

  const completedCount = completed.size;
  const progressPercent = Math.round((completedCount / chapters.length) * 100);

  const vol1Count = chapters.filter(c => c.volume === 1).length;
  const vol2Count = chapters.filter(c => c.volume === 2).length;
  const modemCount = chapters.filter(c => c.volume === 0).length;

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
        aria-label={t.appTitle}
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 sm:w-80 bg-white border-r border-neutral-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 shadow-xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-neutral-200/90 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold text-xs tracking-wider">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-neutral-900 leading-tight">
                {t.appTitle}
              </h1>
              <p className="text-[11px] text-neutral-500 font-medium">{t.appSubtitle}</p>
            </div>
          </div>

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

        {/* Volume & Section Segmented Tabs */}
        <div className="p-2 border-b border-neutral-200/80 bg-neutral-50/60">
          <div className="grid grid-cols-5 gap-1 p-0.5 bg-neutral-200/60 rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`py-1 rounded-md transition-all text-center ${
                activeTab === 'all'
                  ? 'bg-white text-neutral-900 font-semibold shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
              title={`${t.tabs.all} (${chapters.length})`}
            >
              <span className="truncate">{t.tabs.all}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('vol1')}
              className={`py-1 rounded-md transition-all text-center ${
                activeTab === 'vol1'
                  ? 'bg-white text-neutral-900 font-semibold shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
              title={`${t.tabs.vol1} (${vol1Count})`}
            >
              <span>{t.tabs.vol1}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('vol2')}
              className={`py-1 rounded-md transition-all text-center ${
                activeTab === 'vol2'
                  ? 'bg-white text-neutral-900 font-semibold shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
              title={`${t.tabs.vol2} (${vol2Count})`}
            >
              <span>{t.tabs.vol2}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('modem')}
              className={`py-1 rounded-md transition-all text-center ${
                activeTab === 'modem'
                  ? 'bg-white text-neutral-900 font-semibold shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
              title={`${t.tabs.modem} (${modemCount})`}
            >
              <span>{t.tabs.modem}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('saved')}
              className={`py-1 rounded-md transition-all flex items-center justify-center gap-1 ${
                activeTab === 'saved'
                  ? 'bg-white text-neutral-900 font-semibold shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
              title={`${t.tabs.saved} (${bookmarks.size})`}
            >
              <Bookmark className="w-3 h-3 fill-current" />
              <span>{bookmarks.size}</span>
            </button>
          </div>
        </div>

        {/* Chapter List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {filteredChapters.length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-400">
              {activeTab === 'saved'
                ? t.sidebar.noSaved
                : t.sidebar.noMatches}
            </div>
          ) : (
            filteredChapters.map(ch => {
              const isActive = !isCurrentViewResources && currentChapterId === ch.id;
              const isCompleted = completed.has(ch.id);
              const isBookmarked = bookmarks.has(ch.id);
              const fullTitle = language === 'zh' ? (ch.titleZh || ch.title) : ch.title;
              const chTitle = truncateTitle(fullTitle);

              return (
                <div
                  key={ch.id}
                  id={`sidebar-chapter-${ch.id}`}
                  className={`group relative flex items-center justify-between px-2.5 py-1.5 rounded-md cursor-pointer transition-colors text-xs focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:outline-none ${
                    isActive
                      ? 'bg-neutral-100 text-neutral-900 font-medium'
                      : 'hover:bg-neutral-50 text-neutral-700'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelectChapter(ch.id);
                      if (isOpenMobile) onCloseMobile();
                    }}
                    className="flex items-center gap-2.5 min-w-0 pr-2 flex-1 text-left focus-visible:outline-none"
                  >
                    {/* Compact Chapter Indicator */}
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

                  {/* Read / Bookmark Status Controls */}
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
                          : 'text-neutral-300 opacity-0 group-hover:opacity-100 hover:text-neutral-700'
                      }`}
                      aria-label={isBookmarked ? 'Remove Bookmark' : 'Bookmark Chapter'}
                      title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Chapter'}
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
                          : 'text-neutral-300 opacity-0 group-hover:opacity-100 hover:text-neutral-700'
                      }`}
                      aria-label={isCompleted ? 'Mark as Incomplete' : 'Mark as Read'}
                      title={isCompleted ? 'Mark as Incomplete' : 'Mark as Read'}
                    >
                      <CheckCircle2 className={`w-3.5 h-3.5 ${isCompleted ? 'fill-emerald-100' : ''}`} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Secondary navigation */}
        <div className="p-3 border-t border-neutral-200 bg-neutral-50/50">
          <button
            id="sidebar-resources-btn"
            type="button"
            onClick={() => {
              onOpenResources();
              if (isOpenMobile) onCloseMobile();
            }}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-colors border group focus-visible:ring-2 focus-visible:ring-neutral-900 ${
              isCurrentViewResources
                ? 'bg-neutral-900 text-white border-neutral-900'
                : 'text-neutral-800 bg-white border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            <span className="flex items-center gap-2">
              <FileText className={`w-3.5 h-3.5 ${isCurrentViewResources ? 'text-white' : 'text-neutral-700'}`} />
              <span>{t.sidebar.resourcesBtn}</span>
            </span>
            <span className={`text-[10px] ${isCurrentViewResources ? 'text-neutral-300' : 'text-neutral-400'}`}>
              {t.sidebar.resourcesCount}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};
