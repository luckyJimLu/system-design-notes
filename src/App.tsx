import React, { useState, useEffect, useMemo } from 'react';
import { contentCatalog, extractHeadings } from './content/catalog';
import { Chapter, Language } from './types';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { ChapterViewer } from './components/ChapterViewer';
import { TableOfContents } from './components/TableOfContents';
import { ImageLightboxModal } from './components/ImageLightboxModal';
import { SearchModal } from './components/SearchModal';
import { CheatSheetModal } from './components/CheatSheetModal';
import { ResourcesView } from './components/ResourcesView';

const ALL_CHAPTERS = contentCatalog.documents;

function resolveChapterIdFromHash(rawId: string): string | null {
  if (ALL_CHAPTERS.some(c => c.id === rawId)) return rawId;
  // Support content prefix aliases
  if (ALL_CHAPTERS.some(c => c.id === `content-${rawId}`)) return `content-${rawId}`;
  if (rawId.startsWith('content-') && ALL_CHAPTERS.some(c => c.id === rawId.replace(/^content-/, ''))) {
    return rawId.replace(/^content-/, '');
  }
  // Support numeric chapter aliases: e.g. "1" -> "chapter-1", "37" -> chapter with number 37
  if (/^\d+$/.test(rawId)) {
    const num = parseInt(rawId, 10);
    const byId = ALL_CHAPTERS.find(c => c.id === `chapter-${num}`);
    if (byId) return byId.id;
    const byNum = ALL_CHAPTERS.find(c => c.number === num);
    if (byNum) return byNum.id;
  }
  const matchCh = rawId.match(/^chapter-(\d+)$/);
  if (matchCh) {
    const num = parseInt(matchCh[1], 10);
    const byNum = ALL_CHAPTERS.find(c => c.number === num);
    if (byNum) return byNum.id;
  }
  if (rawId.startsWith('modem-')) {
    const alt = rawId.replace(/^modem-/, 'embedded-');
    if (ALL_CHAPTERS.some(c => c.id === alt)) return alt;
  }
  if (rawId.startsWith('embedded-')) {
    const alt = rawId.replace(/^embedded-/, 'modem-');
    if (ALL_CHAPTERS.some(c => c.id === alt)) return alt;
  }
  return null;
}

export default function App() {
  const [currentChapterId, setCurrentChapterId] = useState<string>(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#/chapter/')) {
      const id = hash.replace('#/chapter/', '');
      const resolved = resolveChapterIdFromHash(id);
      if (resolved) return resolved;
    }
    return ALL_CHAPTERS[0]?.id || 'chapter-1';
  });

  const [isResourcesView, setIsResourcesView] = useState<boolean>(() => {
    return window.location.hash === '#/resources';
  });

  // Language state (defaults to 'zh' with easy toggle to 'en')
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('sys_design_lang');
      if (saved === 'zh' || saved === 'en') return saved;
    } catch {}
    return 'zh';
  });

  const handleToggleLanguage = () => {
    setLanguage(prev => {
      const next = prev === 'en' ? 'zh' : 'en';
      try {
        localStorage.setItem('sys_design_lang', next);
      } catch {}
      return next;
    });
  };

  // Reading progress and bookmark state with localStorage
  const [bookmarks, setBookmarks] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('sys_design_bookmarks');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [completed, setCompleted] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('sys_design_completed');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>(() => {
    try {
      return (localStorage.getItem('sys_design_font_size') as 'sm' | 'base' | 'lg') || 'base';
    } catch {
      return 'base';
    }
  });

  // Modal and drawer states
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCheatSheetOpen, setIsCheatSheetOpen] = useState(false);
  const [isOpenMobileSidebar, setIsOpenMobileSidebar] = useState(false);
  const [lightboxData, setLightboxData] = useState<{ src: string; alt?: string } | null>(null);

  // Sync active chapter to URL hash
  useEffect(() => {
    if (isResourcesView) {
      window.location.hash = '#/resources';
    } else {
      window.location.hash = `#/chapter/${currentChapterId}`;
    }
  }, [currentChapterId, isResourcesView]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#/resources') {
        setIsResourcesView(true);
      } else if (hash.startsWith('#/chapter/')) {
        const id = hash.replace('#/chapter/', '');
        const resolved = resolveChapterIdFromHash(id);
        if (resolved) {
          setCurrentChapterId(resolved);
          setIsResourcesView(false);
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Save bookmarks
  const handleToggleBookmark = (id: string) => {
    setBookmarks(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem('sys_design_bookmarks', JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  // Save completed chapters
  const handleToggleCompleted = (id: string) => {
    setCompleted(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem('sys_design_completed', JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  const handleChangeFontSize = (size: 'sm' | 'base' | 'lg') => {
    setFontSize(size);
    try {
      localStorage.setItem('sys_design_font_size', size);
    } catch {}
  };

  const handleSelectChapter = (id: string) => {
    setCurrentChapterId(id);
    setIsResourcesView(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleOpenResources = () => {
    setIsResourcesView(true);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  // Current active chapter
  const currentChapter = useMemo(() => {
    return ALL_CHAPTERS.find(c => c.id === currentChapterId) || ALL_CHAPTERS[0];
  }, [currentChapterId]);

  // Extract headings for Table of Contents based on active language
  const headings = useMemo(() => {
    if (!currentChapter || isResourcesView) return [];
    const activeMarkdown = language === 'zh'
      ? (currentChapter.markdownZh || currentChapter.markdown)
      : (currentChapter.markdownEn || currentChapter.markdown);
    return extractHeadings(activeMarkdown);
  }, [currentChapter, language, isResourcesView]);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col font-sans">
      {/* Left Navigation Sidebar */}
      <Sidebar
        chapters={ALL_CHAPTERS}
        currentChapterId={currentChapterId}
        onSelectChapter={handleSelectChapter}
        bookmarks={bookmarks}
        completed={completed}
        onToggleBookmark={handleToggleBookmark}
        onToggleCompleted={handleToggleCompleted}
        onOpenCheatSheet={() => setIsCheatSheetOpen(true)}
        onOpenResources={handleOpenResources}
        isCurrentViewResources={isResourcesView}
        isOpenMobile={isOpenMobileSidebar}
        onCloseMobile={() => setIsOpenMobileSidebar(false)}
        language={language}
      />

      {/* Main Content Area */}
      <div className="lg:pl-72 sm:lg:pl-80 flex-1 flex flex-col min-w-0">
        {/* Sticky Header Navbar */}
        <Navbar
          onToggleMobileSidebar={() => setIsOpenMobileSidebar(prev => !prev)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenCheatSheet={() => setIsCheatSheetOpen(true)}
          currentChapter={currentChapter}
          isResourcesView={isResourcesView}
          fontSize={fontSize}
          onChangeFontSize={handleChangeFontSize}
          language={language}
          onToggleLanguage={handleToggleLanguage}
        />

        {/* Reading Canvas + Table of Contents Layout */}
        <main className="flex-1 flex justify-center w-full px-2 sm:px-4 lg:px-8 py-4">
          <div className="w-full flex justify-center">
            {isResourcesView ? (
              <div className="w-full">
                <ResourcesView
                  onBackToChapters={() => setIsResourcesView(false)}
                  language={language}
                />
              </div>
            ) : currentChapter ? (
              <div className="w-full flex justify-center gap-8">
                {/* Center Chapter Content */}
                <div className="flex-1 min-w-0 max-w-4xl">
                  <ChapterViewer
                    chapter={currentChapter}
                    isBookmarked={bookmarks.has(currentChapter.id)}
                    isCompleted={completed.has(currentChapter.id)}
                    onToggleBookmark={handleToggleBookmark}
                    onToggleCompleted={handleToggleCompleted}
                    onOpenLightbox={(src, alt) => setLightboxData({ src, alt })}
                    onSelectChapter={handleSelectChapter}
                    allChapters={ALL_CHAPTERS}
                    fontSize={fontSize}
                    language={language}
                  />
                </div>

                {/* Right Sticky Table of Contents */}
                {headings.length > 0 && (
                  <TableOfContents
                    headings={headings}
                    language={language}
                  />
                )}
              </div>
            ) : null}
          </div>
        </main>
      </div>

      {/* Modals */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        chapters={ALL_CHAPTERS}
        onSelectChapter={handleSelectChapter}
        language={language}
      />

      <CheatSheetModal
        isOpen={isCheatSheetOpen}
        onClose={() => setIsCheatSheetOpen(false)}
        language={language}
      />

      {lightboxData && (
        <ImageLightboxModal
          src={lightboxData.src}
          alt={lightboxData.alt}
          chapterTitle={language === 'zh' ? (currentChapter?.titleZh || currentChapter?.title) : currentChapter?.title}
          onClose={() => setLightboxData(null)}
          language={language}
        />
      )}
    </div>
  );
}
