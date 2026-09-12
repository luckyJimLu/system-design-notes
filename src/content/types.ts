import type { Chapter, HeadingItem } from '../types';

/** Stable boundary between content sources and the WebUI shell. */
export type ContentDocument = Chapter;
export type ContentHeading = HeadingItem;

export interface ContentCatalog {
  documents: ContentDocument[];
  getById(id: string): ContentDocument | undefined;
}
