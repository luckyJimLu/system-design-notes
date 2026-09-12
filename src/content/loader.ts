import type { Chapter } from '../types';
import { parseFrontMatter, contentId, contentTitle } from './frontmatter';

const contentModules = import.meta.glob<string>('../../content/**/index*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

function localeFromPath(path: string): 'zh' | 'en' {
  return path.endsWith('.en.md') ? 'en' : 'zh';
}

function fallbackTitle(path: string): string {
  const parts = path.split('/');
  const folder = parts[parts.length - 2] || 'document';
  return folder.replace(/^\d+[-_]/, '').replace(/[-_]/g, ' ');
}

export function loadImportedContent(): Chapter[] {
  const groups = new Map<string, Partial<Record<'zh' | 'en', Chapter>>>();

  for (const [path, raw] of Object.entries(contentModules)) {
    const parsed = parseFrontMatter(raw);
    const locale = localeFromPath(path);
    const fallback = fallbackTitle(path);
    const id = contentId(parsed.data, fallback.toLowerCase().replace(/\s+/g, '-'));
    const title = contentTitle(parsed.data, fallback);
    const titleEn = typeof parsed.data.titleEn === 'string' ? parsed.data.titleEn : title;
    const tags = Array.isArray(parsed.data.tags) ? parsed.data.tags : [];
    const number = typeof parsed.data.order === 'number' ? parsed.data.order : 1000;
    const document: Chapter = {
      id: `content-${id}`,
      folderName: path.split('/')[path.split('/').length - 2] || '',
      fileName: path.split('/')[path.split('/').length - 1] || '',
      number,
      title: locale === 'en' ? title : titleEn,
      titleZh: locale === 'zh' ? title : title,
      volume: 0,
      category: 'specialized',
      description: typeof parsed.data.description === 'string' ? parsed.data.description : '',
      descriptionZh: typeof parsed.data.descriptionZh === 'string' ? parsed.data.descriptionZh : '',
      tags,
      tagsZh: tags,
      markdown: parsed.body,
      ...(locale === 'zh' ? { markdownZh: parsed.body } : { markdownEn: parsed.body }),
      estimatedReadTimeMinutes: Math.max(2, Math.round(parsed.body.split(/\s+/).filter(Boolean).length / 200)),
    };
    const key = document.id;
    const pair = groups.get(key) || {};
    pair[locale] = document;
    groups.set(key, pair);
  }

  return [...groups.values()].map(pair => {
    const zh = pair.zh;
    const en = pair.en;
    const base = zh || en!;
    return {
      ...base,
      title: en?.title || base.title,
      titleZh: zh?.titleZh || base.titleZh,
      markdown: zh?.markdown || en?.markdown || '',
      markdownZh: zh?.markdownZh || base.markdownZh,
      markdownEn: en?.markdownEn || base.markdownEn,
    };
  }).sort((a, b) => a.number - b.number);
}
