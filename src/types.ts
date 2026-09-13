export type Language = 'en' | 'zh';

export type DocumentSourceType = 'legacy' | 'local' | 'github' | 'imported';

export interface DocumentSource {
  type: DocumentSourceType;
  path: string;
}

export interface Chapter {
  id: string;
  folderName: string;
  fileName: string;
  number: number;
  title: string;
  titleZh?: string;
  volume: 1 | 2 | 0; // 1 = Vol 1, 2 = Vol 2, 0 = Modemlog/Embedded/Other
  category: 'core' | 'distributed-storage' | 'real-time-apps' | 'infrastructure' | 'specialized' | 'embedded-systems';
  description: string;
  descriptionZh?: string;
  tags: string[];
  tagsZh?: string[];
  markdown: string;
  markdownZh?: string;
  markdownEn?: string;
  estimatedReadTimeMinutes: number;
  /** Stable content provenance used by loaders and diagnostics. */
  source?: DocumentSource;
}

export function getChapterMarkdown(chapter: Chapter, language: Language): string {
  if (language === 'zh') {
    return chapter.markdownZh || chapter.markdown;
  }
  return chapter.markdownEn || chapter.markdown;
}

export interface HeadingItem {
  id: string;
  title: string;
  level: number;
}

export interface SearchResult {
  chapterId: string;
  chapterTitle: string;
  chapterNumber: number;
  matches: {
    sectionTitle?: string;
    snippet: string;
  }[];
}
