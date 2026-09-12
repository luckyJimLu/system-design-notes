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
  // Keep the legacy glob as the startup source of truth while imported
  // content is diagnosed independently. This prevents an optional content
  // package from blocking the entire WebUI during module initialization.
  documents: ALL_CHAPTERS,
  getById: (id) => contentCatalog.documents.find((document) => document.id === id),
};

export { extractHeadings, resolveImageUrl };
