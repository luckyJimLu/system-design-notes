import { ALL_CHAPTERS, extractHeadings, resolveImageUrl } from '../data/chaptersData';
import type { ContentCatalog } from './types';
import { loadImportedContent } from './loader';
import type { ContentDiagnostic } from './diagnostics';

export const contentDiagnostics: ContentDiagnostic[] = [];

function loadDocumentsSafely() {
  try {
    return loadImportedContent();
  } catch (error) {
    contentDiagnostics.push({
      level: 'error',
      code: 'LOAD_FAILED',
      message: error instanceof Error ? error.message : 'Imported content could not be loaded.',
    });
    return [];
  }
}

/**
 * Content adapter used by the application shell.
 *
 * The legacy glob/metadata loader remains the source implementation for now,
 * but UI code no longer needs to know where documents came from. The adapter
 * can later be replaced by a front-matter/content-package loader without
 * changing navigation, search, or rendering components.
 */
export const contentCatalog: ContentCatalog = {
  documents: [...ALL_CHAPTERS, ...loadDocumentsSafely()],
  getById: (id) => contentCatalog.documents.find((document) => document.id === id),
};

export { extractHeadings, resolveImageUrl };
