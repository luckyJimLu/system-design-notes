import React, { useState, useEffect, useRef } from 'react';
import { HeadingItem, Language } from '../types';
import { I18N_STRINGS } from '../data/i18n';
import { ListTree, ChevronRight } from 'lucide-react';

interface TableOfContentsProps {
  headings: HeadingItem[];
  language?: Language;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({ headings, language = 'en' }) => {
  const [activeId, setActiveId] = useState<string>('');
  const [isVisible, setIsVisible] = useState(false);
  const railRef = useRef<HTMLElement>(null);
  const hideTimerRef = useRef<number | null>(null);
  const t = I18N_STRINGS[language];

  const showRail = () => {
    if (hideTimerRef.current !== null) window.clearTimeout(hideTimerRef.current);
    setIsVisible(true);
  };

  const hideRailSoon = () => {
    if (hideTimerRef.current !== null) window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => {
      if (!railRef.current?.contains(document.activeElement)) setIsVisible(false);
    }, 280);
  };

  useEffect(() => () => {
    if (hideTimerRef.current !== null) window.clearTimeout(hideTimerRef.current);
  }, []);

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the first visible heading
        const visible = entries.find(entry => entry.isIntersecting);
        if (visible) {
          setActiveId(visible.target.id);
        }
      },
      {
        rootMargin: '-80px 0px -60% 0px',
        threshold: 0.1
      }
    );

    headings.forEach(heading => {
      const el = document.getElementById(heading.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) {
    return null;
  }

  const handleScrollTo = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.getElementById(id);
    if (target) {
      const topOffset = 80;
      const elementPosition = target.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - topOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setActiveId(id);
    }
  };

  return (
    <>
      <button
        type="button"
        onMouseEnter={showRail}
        onFocus={showRail}
        onClick={showRail}
        className="fixed right-0 top-1/2 z-30 hidden h-20 w-3 -translate-y-1/2 items-center justify-center rounded-l-md border border-r-0 border-neutral-200 bg-white/90 text-neutral-400 shadow-sm transition-colors hover:text-neutral-900 focus-visible:flex xl:flex"
        aria-label={language === 'zh' ? '显示本章目录' : 'Show table of contents'}
        title={language === 'zh' ? '显示本章目录' : 'Show table of contents'}
      >
        <ChevronRight className="h-3.5 w-3.5 rotate-180" aria-hidden="true" />
      </button>

      <nav
        ref={railRef}
        aria-label={t.chapter.onThisPage}
        aria-hidden={!isVisible}
        onMouseEnter={showRail}
        onMouseLeave={hideRailSoon}
        onFocus={showRail}
        onBlur={event => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) hideRailSoon();
        }}
        className={`fixed right-0 top-20 z-20 hidden w-56 rounded-l-lg border border-r-0 border-neutral-200 bg-white/95 py-2 pl-3 shadow-lg backdrop-blur-sm transition-transform duration-200 xl:block ${
          isVisible ? 'translate-x-0' : 'translate-x-[calc(100%-0.75rem)]'
        }`}
      >
      <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
        <ListTree className="w-3.5 h-3.5 text-neutral-400" aria-hidden="true" />
        <span>{t.chapter.onThisPage}</span>
      </div>

      <div className="max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 space-y-0.5 text-xs">
        {headings.map((heading) => {
          const isActive = activeId === heading.id;
          const isH3 = heading.level === 3;

          return (
            <a
              key={heading.id}
              href={`#${heading.id}`}
              onClick={(e) => handleScrollTo(heading.id, e)}
              className={`group flex items-start gap-1.5 py-1 px-2 rounded-md transition-colors ${
                isH3 ? 'pl-4 text-neutral-500' : 'text-neutral-700'
              } ${
                isActive
                  ? 'bg-neutral-100 text-neutral-900 font-semibold'
                  : 'hover:bg-neutral-50 hover:text-neutral-900'
              }`}
            >
              <ChevronRight
                className={`w-3 h-3 mt-0.5 shrink-0 transition-transform ${
                  isActive ? 'rotate-90 text-neutral-900' : 'text-neutral-400 group-hover:text-neutral-600'
                }`}
              />
              <span className="line-clamp-2 leading-relaxed">{heading.title}</span>
            </a>
          );
        })}
      </div>
      </nav>
    </>
  );
};
