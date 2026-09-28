import { isValidElement } from 'react';
import type { ReactNode } from 'react';

/**
 * Recursively extract plain text from React children.
 * Avoids String(children) which yields "[object Object]" for rich children
 * (e.g. headings containing <strong> or <code>).
 */
export function extractTextFromChildren(children: ReactNode): string {
  if (children === null || children === undefined || typeof children === 'boolean') {
    return '';
  }
  if (typeof children === 'string' || typeof children === 'number') {
    return String(children);
  }
  if (Array.isArray(children)) {
    return children.map(extractTextFromChildren).join('');
  }
  if (isValidElement(children)) {
    const props = children.props as { children?: ReactNode };
    return extractTextFromChildren(props.children);
  }
  return '';
}

export interface SlugOptions {
  /** Prefix for the fallback slug when the title produces an empty slug. Default 'heading'. */
  fallbackPrefix?: string;
  /** Index used in the fallback slug (`heading-N`). Default 0. */
  fallbackIndex?: number;
  /**
   * Set of ids already used in the same document. When provided, duplicate
   * slugs are suffixed with -2, -3, ... and the final id is recorded.
   */
  seenIds?: Set<string>;
}

/**
 * Slugify a heading title, CJK-aware.
 *
 * - Keeps CJK (and other unicode) letters/numbers via unicode property escapes.
 * - Lowercases, strips punctuation, collapses whitespace to '-'.
 * - Falls back to `heading-N` when nothing remains.
 * - Dedups within the same document when `seenIds` is provided.
 *
 * Both the rendered heading ids (ChapterViewer) and the TOC extraction
 * (extractHeadings) must use this function so anchor navigation stays in sync.
 */
export function slugify(text: string, options: SlugOptions = {}): string {
  const { fallbackPrefix = 'heading', fallbackIndex = 0, seenIds } = options;

  let slug = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-');

  if (!slug) {
    slug = `${fallbackPrefix}-${fallbackIndex}`;
  }

  if (seenIds) {
    let unique = slug;
    let counter = 2;
    while (seenIds.has(unique)) {
      unique = `${slug}-${counter++}`;
    }
    seenIds.add(unique);
    return unique;
  }

  return slug;
}

/**
 * FNV-1a hash of a string, returned as a base-36 token.
 * Used for stable per-content ids (e.g. code blocks) without Math.random().
 */
export function hashString(input: string): string {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}
