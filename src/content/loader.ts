import type { Chapter } from '../types';
import { parseFrontMatter, contentId, contentTitle, validateContentMetadata } from './frontmatter';
import type { ContentDiagnostic } from './diagnostics';

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

export interface ImportedContentResult {
  documents: Chapter[];
  diagnostics: ContentDiagnostic[];
}

export function loadImportedContentWithDiagnostics(): ImportedContentResult {
  const groups = new Map<string, Partial<Record<'zh' | 'en', Chapter>>>();
  const diagnostics: ContentDiagnostic[] = [];

  for (const [path, raw] of Object.entries(contentModules)) {
    const parsed = parseFrontMatter(raw);
    for (const message of validateContentMetadata(parsed.data)) {
      diagnostics.push({ level: 'error', code: 'INVALID_METADATA', message, path });
    }
    const locale = localeFromPath(path);
    const fallback = fallbackTitle(path);
    const id = contentId(parsed.data, fallback.toLowerCase().replace(/\s+/g, '-'));
    if (id === fallback.toLowerCase().replace(/\s+/g, '-')) {
      diagnostics.push({ level: 'warning', code: 'MISSING_ID', message: 'Document has no explicit id; fallback id was generated.', path, id });
    }
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

  const documents = [...groups.values()].map(pair => {
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

  const seen = new Set<string>();
  for (const document of documents) {
    if (seen.has(document.id)) {
      diagnostics.push({ level: 'error', code: 'DUPLICATE_ID', message: `Duplicate content id: ${document.id}`, id: document.id });
    }
    seen.add(document.id);
    if (!document.markdownZh || !document.markdownEn) {
      diagnostics.push({ level: 'warning', code: 'MISSING_LOCALE', message: 'Document is missing a zh or en variant.', id: document.id });
    }
  }
  return { documents, diagnostics };
}

export function loadImportedContent(): Chapter[] {
  return loadImportedContentWithDiagnostics().documents;
}
