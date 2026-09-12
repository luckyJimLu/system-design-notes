import type { Chapter } from '../types';

export interface ParsedFrontMatter {
  data: Record<string, string | number | string[]>;
  body: string;
}

/** Small dependency-free parser for the supported content metadata subset. */
export function parseFrontMatter(source: string): ParsedFrontMatter {
  if (!source.startsWith('---')) return { data: {}, body: source };
  const end = source.indexOf('\n---', 3);
  if (end < 0) return { data: {}, body: source };

  const data: ParsedFrontMatter['data'] = {};
  for (const line of source.slice(4, end).split(/\r?\n/)) {
    const match = line.match(/^([\w-]+):\s*(.*)$/);
    if (!match) continue;
    const [, key, raw] = match;
    const value = raw.trim();
    if (value.startsWith('[') && value.endsWith(']')) {
      data[key] = value.slice(1, -1).split(',').map(item => item.trim()).filter(Boolean);
    } else if (/^\d+$/.test(value)) {
      data[key] = Number(value);
    } else {
      data[key] = value.replace(/^['"]|['"]$/g, '');
    }
  }
  return { data, body: source.slice(end + 4).replace(/^\r?\n/, '') };
}

export function contentId(data: ParsedFrontMatter['data'], fallback: string): string {
  const value = data.id;
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

export function contentTitle(data: ParsedFrontMatter['data'], fallback: string): string {
  const value = data.title;
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

/** Validate the fields that affect navigation before a document is published. */
export function validateContentMetadata(data: ParsedFrontMatter['data']): string[] {
  const errors: string[] = [];
  if (data.id !== undefined && typeof data.id !== 'string') errors.push('id must be a string');
  if (data.order !== undefined && typeof data.order !== 'number') errors.push('order must be a number');
  if (data.tags !== undefined && !Array.isArray(data.tags)) errors.push('tags must be a list');
  return errors;
}

export type ContentChapter = Chapter;
