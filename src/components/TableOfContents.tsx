import React, { useState, useEffect } from 'react';
import { HeadingItem, Language } from '../types';
import { I18N_STRINGS } from '../data/i18n';
import { ListTree, ChevronRight } from 'lucide-react';

interface TableOfContentsProps {
  headings: HeadingItem[];
  language?: Language;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({ headings, language = 'en' }) => {
  const [activeId, setActiveId] = useState<string>('');
  const t = I18N_STRINGS[language];

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
    <nav
      aria-label={t.chapter.onThisPage}
      className="w-56 shrink-0 hidden xl:block sticky top-20 self-start pl-3 py-2"
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
  );
};
