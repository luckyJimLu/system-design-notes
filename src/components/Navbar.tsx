import React, { useEffect, useState } from 'react';
import { Menu, Search, Sparkles, Languages } from 'lucide-react';
import { Chapter, Language } from '../types';
import { I18N_STRINGS } from '../data/i18n';

interface NavbarProps {
  onToggleMobileSidebar: () => void;
  onOpenSearch: () => void;
  onOpenCheatSheet: () => void;
  currentChapter?: Chapter;
  isResourcesView: boolean;
  fontSize: 'sm' | 'base' | 'lg';
  onChangeFontSize: (size: 'sm' | 'base' | 'lg') => void;
  language: Language;
  onToggleLanguage: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleMobileSidebar,
  onOpenSearch,
  onOpenCheatSheet,
  currentChapter,
  isResourcesView,
  fontSize,
  onChangeFontSize,
  language,
  onToggleLanguage
}) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const t = I18N_STRINGS[language];

  // Track page scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100));
        setScrollProgress(progress);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const displayTitle = currentChapter
    ? language === 'zh'
      ? currentChapter.titleZh || currentChapter.title
      : currentChapter.title
    : '';

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-200">
      {/* Scroll Progress Bar at very top */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-neutral-100">
        <div
          className="h-full bg-blue-600 transition-all duration-75"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <div className="flex items-center justify-between px-3 sm:px-6 h-14">
        {/* Left Side: Mobile Menu toggle + Chapter Title */}
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          <button
            id="mobile-menu-toggle"
            type="button"
            onClick={onToggleMobileSidebar}
            className="p-1.5 -ml-1 text-neutral-600 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 lg:hidden"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 truncate">
            {isResourcesView ? (
              <span className="text-sm font-semibold text-neutral-900 truncate">
                {t.navbar.resourcesTitle}
              </span>
            ) : currentChapter ? (
              <span className="text-sm font-semibold text-neutral-900 truncate">
                {currentChapter.volume !== 0 && (
                  <span className="text-neutral-500 font-normal mr-1.5">
                    {language === 'zh' ? `第${currentChapter.number}章:` : `Ch ${currentChapter.number}:`}
                  </span>
                )}
                {displayTitle}
              </span>
            ) : null}
          </div>
        </div>

        {/* Right Side Tools */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Language Switcher Button */}
          <button
            id="navbar-lang-toggle"
            type="button"
            onClick={onToggleLanguage}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-800"
            title={language === 'zh' ? 'Switch to English' : '切换到中文'}
          >
            <Languages className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-mono text-[11px]">{language === 'zh' ? '中 / EN' : 'EN / 中'}</span>
          </button>

          {/* Font Size Selector */}
          <div className="hidden sm:flex items-center bg-neutral-100 p-0.5 rounded-lg border border-neutral-200">
            <button
              type="button"
              onClick={() => onChangeFontSize('sm')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                fontSize === 'sm' ? 'bg-white text-neutral-900 font-bold shadow-2xs' : 'text-neutral-500 hover:text-neutral-800'
              }`}
              title={t.navbar.fontSizeSmall}
            >
              A-
            </button>
            <button
              type="button"
              onClick={() => onChangeFontSize('base')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                fontSize === 'base' ? 'bg-white text-neutral-900 font-bold shadow-2xs' : 'text-neutral-500 hover:text-neutral-800'
              }`}
              title={t.navbar.fontSizeNormal}
            >
              A
            </button>
            <button
              type="button"
              onClick={() => onChangeFontSize('lg')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                fontSize === 'lg' ? 'bg-white text-neutral-900 font-bold shadow-2xs' : 'text-neutral-500 hover:text-neutral-800'
              }`}
              title={t.navbar.fontSizeLarge}
            >
              A+
            </button>
          </div>

          {/* Quick Reference Button */}
          <button
            id="navbar-cheatsheet-btn"
            type="button"
            onClick={onOpenCheatSheet}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200/80 rounded-lg transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden md:inline">{t.navbar.cheatSheet}</span>
          </button>

          {/* Search Trigger */}
          <button
            id="navbar-search-btn"
            type="button"
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 text-xs text-neutral-500 bg-neutral-100 hover:bg-neutral-200/80 rounded-lg transition-colors border border-neutral-200/60"
            title={`${t.navbar.search} (⌘K)`}
          >
            <Search className="w-3.5 h-3.5 text-neutral-500" />
            <span className="hidden sm:inline">{t.navbar.search}</span>
            <kbd className="hidden lg:inline-block px-1 py-0.2 text-[10px] font-mono text-neutral-400 bg-white rounded border border-neutral-200">
              ⌘K
            </kbd>
          </button>
        </div>
      </div>
    </header>
  );
};
