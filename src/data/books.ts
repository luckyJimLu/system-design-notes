import { Chapter } from '../types';

export interface BookDefinition {
  id: string;
  titleEn: string;
  titleZh: string;
  shortTitleEn: string;
  shortTitleZh: string;
  badgeEn: string;
  badgeZh: string;
  descriptionEn: string;
  descriptionZh: string;
  chapterRange: string;
}

export const BOOKS: Record<string, BookDefinition> = {
  vol1: {
    id: 'vol1',
    titleEn: 'System Design Interview – An Insider’s Guide (Vol 1)',
    titleZh: '系统设计面试精粹 · 第一卷',
    shortTitleEn: 'Vol 1',
    shortTitleZh: '第一卷',
    badgeEn: 'Vol 1',
    badgeZh: '卷1',
    descriptionEn: 'Foundational distributed systems architectures by Alex Xu (Chapters 1–15).',
    descriptionZh: 'Alex Xu 经典分布式系统架构基础与核心模式（01-15章）。',
    chapterRange: '01–15',
  },
  vol2: {
    id: 'vol2',
    titleEn: 'System Design Interview – An Insider’s Guide (Vol 2)',
    titleZh: '系统设计面试精粹 · 第二卷',
    shortTitleEn: 'Vol 2',
    shortTitleZh: '第二卷',
    badgeEn: 'Vol 2',
    badgeZh: '卷2',
    descriptionEn: 'Advanced large-scale real-world system designs by Alex Xu (Chapters 16–28).',
    descriptionZh: 'Alex Xu 进阶超大规模工业级系统实战设计（16-28章）。',
    chapterRange: '16–28',
  },
  'boost-asio': {
    id: 'boost-asio',
    titleEn: 'Boost.Asio C++ Network Programming Cookbook',
    titleZh: 'Boost.Asio C++ 网络编程实战手册',
    shortTitleEn: 'Boost.Asio',
    shortTitleZh: 'Boost.Asio',
    badgeEn: 'Boost.Asio',
    badgeZh: 'Boost.Asio',
    descriptionEn: 'Asynchronous I/O, active/passive sockets, HTTP, and SSL/TLS in C++ (Chapters 35–40).',
    descriptionZh: '高性能异步 I/O、套接字通信、HTTP 与 SSL/TLS 安全网络实战（35-40章）。',
    chapterRange: '35–40',
  },
  'cpp-concurrency': {
    id: 'cpp-concurrency',
    titleEn: 'C++ Concurrency in Action (2nd Edition)',
    titleZh: 'C++ 并发编程实战（第二版）',
    shortTitleEn: 'C++ Concurrency',
    shortTitleZh: 'C++ 并发',
    badgeEn: 'Concurrency',
    badgeZh: 'C++ 并发',
    descriptionEn: 'Thread management, memory model, lock-free data structures & parallel algorithms (Chapters 41–55).',
    descriptionZh: 'Anthony Williams 权威力作：线程管理、内存模型、无锁数据结构与并行算法（41-55章）。',
    chapterRange: '41–55',
  },
  'cpp-arch': {
    id: 'cpp-arch',
    titleEn: 'C++ Modern System Architecture',
    titleZh: 'C++ 现代系统架构与 Asio 剖析',
    shortTitleEn: 'C++ Arch',
    shortTitleZh: 'C++ 架构',
    badgeEn: 'C++ Arch',
    badgeZh: 'C++ 架构',
    descriptionEn: 'C++20 execution domains, architectural patterns, and Asio runtime internals (Chapters 33–34).',
    descriptionZh: 'C++20 现代架构模式、执行域与 Asio 底层运行机制剖析（33-34章）。',
    chapterRange: '33–34',
  },
  embedded: {
    id: 'embedded',
    titleEn: 'Embedded Systems & RTOS Architecture',
    titleZh: '嵌入式系统与 RTOS 通信架构',
    shortTitleEn: 'Embedded',
    shortTitleZh: '嵌入式',
    badgeEn: 'Embedded',
    badgeZh: '嵌入式',
    descriptionEn: 'Embedded firmware, RTOS scheduling, lwIP networking, and hardware interfaces (Chapters 29–30, 32).',
    descriptionZh: '嵌入式实时操作系统 (RTOS)、固件协议栈与双网口架构设计（29-30, 32章）。',
    chapterRange: '29–30, 32',
  },
  tools: {
    id: 'tools',
    titleEn: 'Developer Tools & Workflows',
    titleZh: '开发工具与工程实践',
    shortTitleEn: 'Tools',
    shortTitleZh: '开发工具',
    badgeEn: 'Tools',
    badgeZh: '开发工具',
    descriptionEn: 'Engineering tooling, local workflows, and deployment guides (Chapter 31).',
    descriptionZh: '开发环境配置、工程工具链与自动化发布指南（31章）。',
    chapterRange: '31',
  },
};

export const BOOK_ORDER = [
  'vol1',
  'vol2',
  'boost-asio',
  'cpp-concurrency',
  'cpp-arch',
  'embedded',
  'tools',
] as const;

export type BookKey = typeof BOOK_ORDER[number];

export function getBookIdForChapter(chapter: Partial<Chapter>): BookKey {
  if (chapter.bookId && chapter.bookId in BOOKS) {
    return chapter.bookId as BookKey;
  }

  const num = chapter.number ?? 0;
  if (num >= 1 && num <= 15) return 'vol1';
  if (num >= 16 && num <= 28) return 'vol2';
  if (num >= 35 && num <= 40) return 'boost-asio';
  if (num >= 41 && num <= 55) return 'cpp-concurrency';
  if (num === 33 || num === 34) return 'cpp-arch';
  if (num === 31) return 'tools';
  if (num === 29 || num === 30 || num === 32) return 'embedded';

  const folder = (chapter.folderName || '').toLowerCase();
  const id = (chapter.id || '').toLowerCase();

  if (folder.includes('boost.asio') || id.includes('boost-asio')) return 'boost-asio';
  if (folder.includes('concurrency') || id.includes('cpp-concurrency')) return 'cpp-concurrency';
  if (folder.includes('cpp system architecture') || folder.includes('boost asio deep dive') || id.includes('cpp-system')) return 'cpp-arch';
  if (folder.includes('development tools') || chapter.category === 'developer-tools') return 'tools';
  if (folder.includes('embedded') || chapter.category === 'embedded-systems' || id.startsWith('embedded-')) return 'embedded';

  if (chapter.volume === 1) return 'vol1';
  if (chapter.volume === 2) return 'vol2';

  return 'vol1';
}

export function getBookForChapter(chapter: Partial<Chapter>): BookDefinition {
  const bookId = getBookIdForChapter(chapter);
  return BOOKS[bookId] || BOOKS.vol1;
}
