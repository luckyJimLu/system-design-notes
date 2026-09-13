import { ALL_CHAPTERS, extractHeadings, resolveImageUrl } from '../data/chaptersData';
import { loadImportedContentWithDiagnostics } from './loader';
import type { ContentCatalog } from './types';

/**
 * Content adapter used by the application shell.
 *
 * The catalog is the only content boundary consumed by the application shell.
 * Legacy documents remain available while front-matter documents are migrated
 * into `content/`.
 */
const importedContent = loadImportedContentWithDiagnostics();
const catalogDocuments = [...ALL_CHAPTERS, ...importedContent.documents]
  .map((document) => document.source ? document : { ...document, source: { type: 'legacy' as const, path: `${document.folderName}/${document.fileName}` } })
  .sort((a, b) => a.number - b.number || a.id.localeCompare(b.id));

export const contentCatalog: ContentCatalog = {
  documents: catalogDocuments,
  getById: (id) => contentCatalog.documents.find((document) => document.id === id),
};

export { extractHeadings, resolveImageUrl };

export const contentDiagnostics = importedContent.diagnostics;
