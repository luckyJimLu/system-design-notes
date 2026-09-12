import { ALL_CHAPTERS, extractHeadings, resolveImageUrl } from '../data/chaptersData';
import type { ContentCatalog } from './types';

/**
 * Content adapter used by the application shell.
 *
 * The legacy glob/metadata loader remains the source implementation for now,
 * but UI code no longer needs to know where documents came from. The adapter
 * can later be replaced by a front-matter/content-package loader without
 * changing navigation, search, or rendering components.
 */
export const contentCatalog: ContentCatalog = {
  documents: ALL_CHAPTERS,
  getById: (id) => ALL_CHAPTERS.find((document) => document.id === id),
};

export { extractHeadings, resolveImageUrl };
