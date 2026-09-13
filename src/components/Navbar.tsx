import React, { useEffect, useState } from 'react';
import { Menu, Search, Sparkles, Languages } from 'lucide-react';
import { Chapter, Language } from '../types';
import { I18N_STRINGS } from '../data/i18n';
import { truncateTitle } from '../utils/title';

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
      ? truncateTitle(currentChapter.titleZh || currentChapter.title)
      : truncateTitle(currentChapter.title)
    : '';

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-neutral-200">
      {/* Scroll Progress Bar at very top */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-neutral-100" aria-hidden="true">
        <div
          className="h-full bg-neutral-900 transition-all duration-75"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <div className="flex items-center justify-between px-3 sm:px-6 h-13">
        {/* Left Side: Mobile Menu toggle + Chapter Title */}
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          <button
            id="mobile-menu-toggle"
            type="button"
            onClick={onToggleMobileSidebar}
            className="p-1.5 -ml-1 text-neutral-600 hover:text-neutral-900 rounded-md hover:bg-neutral-100 lg:hidden focus-visible:ring-2 focus-visible:ring-neutral-900"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 truncate">
            {isResourcesView ? (
              <span className="text-xs sm:text-sm font-semibold text-neutral-900 truncate">
                {t.navbar.resourcesTitle}
              </span>
            ) : currentChapter ? (
              <div className="flex items-center gap-1.5 text-xs sm:text-sm truncate">
                {currentChapter.volume !== 0 && (
                  <span className="font-mono text-neutral-400 text-xs shrink-0 font-medium">
                    {language === 'zh' ? `第${currentChapter.number}章` : `Ch ${currentChapter.number}`}
                    <span className="mx-1.5 text-neutral-300">/</span>
                  </span>
                )}
                <span
                  className="font-medium text-neutral-900 truncate"
                  title={language === 'zh' ? currentChapter.titleZh || currentChapter.title : currentChapter.title}
                >
                  {displayTitle}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Right Side Tools */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Language Switcher Button (Single Entry Point) */}
          <button
            id="navbar-lang-toggle"
            type="button"
            onClick={onToggleLanguage}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 transition-colors shadow-2xs focus-visible:ring-2 focus-visible:ring-neutral-900"
            title={language === 'zh' ? '切换为 English' : '切换为 中文'}
            aria-label={language === 'zh' ? '切换为 English' : '切换为 中文'}
          >
            <Languages className="w-3.5 h-3.5 text-neutral-500" />
            <span className="font-mono text-[11px] font-semibold">{language === 'zh' ? '中 / EN' : 'EN / 中'}</span>
          </button>

          {/* Font Size Selector */}
          <div
            className="flex items-center bg-neutral-100 p-0.5 rounded-md border border-neutral-200/80"
            role="group"
            aria-label="Font size controls"
          >
            <button
              id="navbar-font-sm"
              type="button"
              onClick={() => onChangeFontSize('sm')}
              className={`px-1.5 sm:px-2 py-0.5 text-xs font-mono rounded cursor-pointer transition-all ${
                fontSize === 'sm'
                  ? 'bg-white text-neutral-900 font-bold shadow-2xs border border-neutral-200/80'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
              title={t.navbar.fontSizeSmall}
              aria-label={t.navbar.fontSizeSmall}
              aria-pressed={fontSize === 'sm'}
            >
              A-
            </button>
            <button
              id="navbar-font-base"
              type="button"
              onClick={() => onChangeFontSize('base')}
              className={`px-1.5 sm:px-2 py-0.5 text-xs font-mono rounded cursor-pointer transition-all ${
                fontSize === 'base'
                  ? 'bg-white text-neutral-900 font-bold shadow-2xs border border-neutral-200/80'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
              title={t.navbar.fontSizeNormal}
              aria-label={t.navbar.fontSizeNormal}
              aria-pressed={fontSize === 'base'}
            >
              A
            </button>
            <button
              id="navbar-font-lg"
              type="button"
              onClick={() => onChangeFontSize('lg')}
              className={`px-1.5 sm:px-2 py-0.5 text-xs font-mono rounded cursor-pointer transition-all ${
                fontSize === 'lg'
                  ? 'bg-white text-neutral-900 font-bold shadow-2xs border border-neutral-200/80'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
              title={t.navbar.fontSizeLarge}
              aria-label={t.navbar.fontSizeLarge}
              aria-pressed={fontSize === 'lg'}
            >
              A+
            </button>
          </div>

          {/* Quick Reference Button */}
          <button
            id="navbar-cheatsheet-btn"
            type="button"
            onClick={onOpenCheatSheet}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-neutral-700 bg-white hover:bg-neutral-50 rounded-md border border-neutral-200 shadow-2xs transition-colors focus-visible:ring-2 focus-visible:ring-neutral-900"
            title={t.navbar.cheatSheet}
            aria-label={t.navbar.cheatSheet}
          >
            <Sparkles className="w-3.5 h-3.5 text-neutral-600" />
            <span className="hidden md:inline">{t.navbar.cheatSheet}</span>
          </button>

          {/* Search Trigger */}
          <button
            id="navbar-search-btn"
            type="button"
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-2.5 py-1 text-xs text-neutral-500 bg-white hover:bg-neutral-50 rounded-md transition-colors border border-neutral-200 shadow-2xs focus-visible:ring-2 focus-visible:ring-neutral-900"
            title={`${t.navbar.search} (⌘K)`}
            aria-label={`${t.navbar.search} (⌘K)`}
          >
            <Search className="w-3.5 h-3.5 text-neutral-400" />
            <span className="hidden sm:inline text-neutral-600">{t.navbar.search}</span>
            <kbd className="hidden lg:inline-block px-1 py-0.2 text-[10px] font-mono text-neutral-400 bg-neutral-100 rounded border border-neutral-200">
              ⌘K
            </kbd>
          </button>
        </div>
      </div>
    </header>
  );
};
