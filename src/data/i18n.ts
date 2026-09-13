import { Language } from '../types';

export interface UIStrings {
  appTitle: string;
  appSubtitle: string;
  searchPlaceholder: string;
  searchKbd: string;
  readingProgress: string;
  tabs: {
    all: string;
    vol1: string;
    vol2: string;
    modem: string;
    saved: string;
  };
  sidebar: {
    noSaved: string;
    noMatches: string;
    cheatSheetBtn: string;
    cheatSheetDesc: string;
    resourcesBtn: string;
    resourcesCount: string;
  };
  navbar: {
    cheatSheet: string;
    search: string;
    fontSizeSmall: string;
    fontSizeNormal: string;
    fontSizeLarge: string;
    langToggle: string;
    resourcesTitle: string;
  };
  chapter: {
    vol1: string;
    vol2: string;
    modem: string;
    chapterPrefix: string;
    minRead: string;
    bookmark: string;
    bookmarked: string;
    markRead: string;
    completed: string;
    summaryHeading: string;
    prevChapter: string;
    nextChapter: string;
    copy: string;
    copied: string;
    editFlowchart: string;
    saveFlowchart: string;
    cancelFlowchart: string;
    resetFlowchart: string;
    flowchartEditorHint: string;
    invalidFlowchart: string;
    expandDiagram: string;
    onThisPage: string;
  };
  searchModal: {
    inputPlaceholder: string;
    noResults: string;
    navigateTip: string;
    selectTip: string;
    footerTitle: string;
    vol1Badge: string;
    vol2Badge: string;
    modemBadge: string;
  };
  cheatSheet: {
    badge: string;
    title: string;
    tabs: {
      latency: string;
      power: string;
      availability: string;
      framework: string;
    };
    latencyTakeaway: string;
    latencyColOp: string;
    latencyColTime: string;
    latencyColNotes: string;
    powerIntro: string;
    powerColPow: string;
    powerColExact: string;
    powerColApprox: string;
    availIntro: string;
    availColTier: string;
    availColDay: string;
    availColYear: string;
    frameworkIntro: string;
    closeBtn: string;
    source: string;
  };
  resources: {
    backBtn: string;
    badge: string;
    title: string;
    description: string;
    searchPlaceholder: string;
    allTopics: string;
    types: {
      all: string;
      paper: string;
      blog: string;
      code: string;
      video: string;
    };
    readSource: string;
    noResults: string;
  };
}

export const I18N_STRINGS: Record<Language, UIStrings> = {
  en: {
    appTitle: 'System Design Notes',
    appSubtitle: 'Alex Xu Vol 1 & 2 • Architecture',
    searchPlaceholder: 'Quick search topics...',
    searchKbd: '⌘K',
    readingProgress: 'Reading Progress',
    tabs: {
      all: 'All',
      vol1: 'Vol 1 (15)',
      vol2: 'Vol 2 (13)',
      modem: 'Embedded / RTOS',
      saved: 'Saved'
    },
    sidebar: {
      noSaved: 'No chapters bookmarked yet. Click the bookmark icon on any chapter to save it here.',
      noMatches: 'No chapters match this filter.',
      cheatSheetBtn: 'System Design Cheat Sheet',
      cheatSheetDesc: 'Quick view',
      resourcesBtn: 'Seminal Papers & Blogs',
      resourcesCount: '19 sources'
    },
    navbar: {
      cheatSheet: 'Cheat Sheet',
      search: 'Search',
      fontSizeSmall: 'A-',
      fontSizeNormal: 'A',
      fontSizeLarge: 'A+',
      langToggle: '中文',
      resourcesTitle: 'Seminal Papers & Architecture Blogs'
    },
    chapter: {
      vol1: 'Volume 1',
      vol2: 'Volume 2',
      modem: 'Embedded & RTOS Architecture',
      chapterPrefix: 'Chapter',
      minRead: 'min read',
      bookmark: 'Bookmark',
      bookmarked: 'Bookmarked',
      markRead: 'Mark as Read',
      completed: 'Completed',
      summaryHeading: 'Chapter Summary & Key Concepts',
      prevChapter: 'Previous Chapter',
      nextChapter: 'Next Chapter',
      copy: 'Copy',
      copied: 'Copied',
      editFlowchart: 'Edit',
      saveFlowchart: 'Save',
      cancelFlowchart: 'Cancel',
      resetFlowchart: 'Reset',
      flowchartEditorHint: 'Edit the arrow-separated steps. The preview updates as you type.',
      invalidFlowchart: 'Add at least two steps connected by →, ->, or ↓ to preview the flowchart.',
      expandDiagram: 'Expand Diagram',
      onThisPage: 'On this page'
    },
    searchModal: {
      inputPlaceholder: "Search all 37 chapters, topics, tags (e.g. 'rate limiter', 'RTOS', 'ring buffer', 'lwIP')...",
      noResults: 'No matching chapters or architecture concepts found for',
      navigateTip: 'Navigate',
      selectTip: 'Select',
      footerTitle: 'System Design & Embedded Systems Reference',
      vol1Badge: 'Vol 1',
      vol2Badge: 'Vol 2',
      modemBadge: 'Embedded / RTOS'
    },
    cheatSheet: {
      badge: 'System Design Quick Reference',
      title: 'Back of the Envelope & Interview Cheat Sheet',
      tabs: {
        latency: 'Latency Numbers (Jeff Dean)',
        power: 'Powers of Two & Storage',
        availability: 'Availability & SLA (9s)',
        framework: '4-Step Interview Strategy'
      },
      latencyTakeaway: 'Key Takeaway: Memory is fast, but disks and networks are slow. By caching in RAM and minimizing cross-datacenter round trips, you gain orders of magnitude in throughput.',
      latencyColOp: 'Operation',
      latencyColTime: 'Time',
      latencyColNotes: 'Human Scale / Notes',
      powerIntro: 'In system design interviews, round numbers to the nearest power of 10 or power of 2 for rapid calculations: 2^10 ≈ 10^3 (1 KB) | 2^20 ≈ 10^6 (1 MB) | 2^30 ≈ 10^9 (1 GB).',
      powerColPow: 'Power of Two',
      powerColExact: 'Exact Value',
      powerColApprox: 'Approximation & Units',
      availIntro: 'High availability is measured in percentages called "nines". Service level agreements (SLAs) define uptime guarantees between service providers and customers.',
      availColTier: 'Availability Tier',
      availColDay: 'Downtime per Day',
      availColYear: 'Downtime per Year',
      frameworkIntro: 'System design interviews test collaboration, communication, and engineering trade-offs. Never jump straight to drawing databases or microservices without scoping!',
      closeBtn: 'Close Reference',
      source: 'Source: System Design Interview by Alex Xu'
    },
    resources: {
      backBtn: 'Back to Chapters',
      badge: 'Curated Engineering Reading List',
      title: 'Seminal Distributed Systems Papers & Engineering Blogs',
      description: 'The real-world foundational systems behind high-scale internet architectures. These papers and engineering blogs are referenced throughout System Design Interview Vol 1 & 2.',
      searchPlaceholder: 'Search papers, companies, topics...',
      allTopics: 'All Topics',
      types: {
        all: 'All',
        paper: 'Paper',
        blog: 'Blog',
        code: 'Code',
        video: 'Video'
      },
      readSource: 'Read Source',
      noResults: 'No resources found matching your search.'
    }
  },
  zh: {
    appTitle: '系统设计面试精粹',
    appSubtitle: 'Alex Xu 卷1与卷2 • 架构笔记',
    searchPlaceholder: '快捷搜索章节、技术栈 (⌘K)...',
    searchKbd: '⌘K',
    readingProgress: '阅读与复习进度',
    tabs: {
      all: '全部',
      vol1: '第一卷 (15)',
      vol2: '第二卷 (13)',
      modem: '嵌入式',
      saved: '收藏夹'
    },
    sidebar: {
      noSaved: '暂无收藏章节。点击章节右上角的书签图标即可收藏。',
      noMatches: '没有匹配该筛选条件的章节。',
      cheatSheetBtn: '系统设计速查手册',
      cheatSheetDesc: '常数与估算',
      resourcesBtn: '经典分布式论文与博客',
      resourcesCount: '19篇精选'
    },
    navbar: {
      cheatSheet: '速查手册',
      search: '搜索',
      fontSizeSmall: '小号字',
      fontSizeNormal: '默认',
      fontSizeLarge: '大号字',
      langToggle: 'English',
      resourcesTitle: '经典分布式系统论文与大厂工程博客'
    },
    chapter: {
      vol1: '第一卷',
      vol2: '第二卷',
      modem: '嵌入式 / RTOS 与通信架构',
      chapterPrefix: '第',
      minRead: '预计阅读',
      bookmark: '收藏',
      bookmarked: '已收藏',
      markRead: '标记已读',
      completed: '已读完',
      summaryHeading: '本章核心架构要点与知识点精析',
      prevChapter: '上一章',
      nextChapter: '下一章',
      copy: '复制代码',
      copied: '已复制',
      editFlowchart: '编辑',
      saveFlowchart: '保存',
      cancelFlowchart: '取消',
      resetFlowchart: '重置',
      flowchartEditorHint: '编辑由箭头连接的步骤，预览会随输入实时更新。',
      invalidFlowchart: '请至少输入两个由 →、-> 或 ↓ 连接的步骤，才能生成流程图。',
      expandDiagram: '点击放大架构图',
      onThisPage: '本章大纲目录'
    },
    searchModal: {
      inputPlaceholder: "搜索全部 37 个章节、架构概念、技术标签 (如 '限流器', 'RTOS', '环形缓冲', '双网卡', 'lwIP')...",
      noResults: '未找到相关章节或架构概念：',
      navigateTip: '上下移动',
      selectTip: '回车进入',
      footerTitle: '系统设计与嵌入式系统知识库',
      vol1Badge: '第1卷',
      vol2Badge: '第2卷',
      modemBadge: '嵌入式 / RTOS'
    },
    cheatSheet: {
      badge: '系统设计面试必备常数',
      title: '粗略估算 (Back of the Envelope) 与面试速查表',
      tabs: {
        latency: '延时数据常数 (Jeff Dean)',
        power: '2的幂次方与容量换算',
        availability: '高可用性与 SLA (几个9)',
        framework: '4步面试法与沟通技巧'
      },
      latencyTakeaway: '核心结论：内存访问极快，磁盘与跨机房网络访问极慢。通过 RAM 缓存与减少跨数据中心往返，系统吞吐量可提升数个数量级。',
      latencyColOp: '操作类型',
      latencyColTime: '耗时',
      latencyColNotes: '直观对比 / 备注',
      powerIntro: '在系统设计面试中，将数值近似为 10 的幂或 2 的幂以迅速计算：2^10 ≈ 10^3 (1 KB) | 2^20 ≈ 10^6 (1 MB) | 2^30 ≈ 10^9 (1 GB)。',
      powerColPow: '2的幂次',
      powerColExact: '精确字节数',
      powerColApprox: '近似量级与单位',
      availIntro: '系统高可用性通常用“几个9”来衡量。服务等级协议 (SLA) 规定了服务提供商向用户承诺的最大允许故障停机时间。',
      availColTier: '可用性级别 (SLA)',
      availColDay: '每日允许停机',
      availColYear: '每年允许停机',
      frameworkIntro: '系统设计面试考察的是合作、沟通与技术权衡 (Trade-offs)。切忌一上来就画复杂的微服务架构图，必须严格按照 4 步法循序渐进！',
      closeBtn: '关闭速查表',
      source: '参考来源：Alex Xu《System Design Interview》'
    },
    resources: {
      backBtn: '返回章节目录',
      badge: '大厂分布式必读文献',
      title: '经典分布式系统论文与技术博客精选',
      description: '现代互联网超大规模架构背后的经典奠基之作，收录了 Alex Xu 系统设计全书中引用的 Google、Amazon、Facebook、Twitter 与 Netflix 核心架构论文。',
      searchPlaceholder: '搜索论文名、公司、技术领域...',
      allTopics: '所有主题分类',
      types: {
        all: '全部类型',
        paper: '学术论文',
        blog: '工程博客',
        code: '开源代码',
        video: '技术演讲'
      },
      readSource: '阅读原文',
      noResults: '没有找到匹配的参考文献。'
    }
  }
};

// Bilingual Latency and framework data
export const LATENCY_NUMBERS_BILINGUAL = [
  {
    opEn: 'L1 cache reference',
    opZh: 'L1 级高速缓存访问',
    time: '0.5 ns',
    notesEn: 'Fastest CPU cache',
    notesZh: 'CPU 内部最快缓存'
  },
  {
    opEn: 'Branch mispredict',
    opZh: 'CPU 分支预测失败',
    time: '5 ns',
    notesEn: 'Pipeline stall penalty',
    notesZh: '指令流水线清空惩罚'
  },
  {
    opEn: 'L2 cache reference',
    opZh: 'L2 级高速缓存访问',
    time: '7 ns',
    notesEn: '14x L1 cache time',
    notesZh: '约为 L1 缓存的 14 倍'
  },
  {
    opEn: 'Mutex lock/unlock',
    opZh: '互斥锁 (Mutex) 加锁/解锁',
    time: '17 ns',
    notesEn: 'OS sync primitive',
    notesZh: '轻量级原子同步操作'
  },
  {
    opEn: 'Main memory reference',
    opZh: '主内存 DRAM 访问',
    time: '100 ns',
    notesEn: '20x slower than L2, 200x than L1',
    notesZh: '比 L2 慢 20 倍，比 L1 慢 200 倍'
  },
  {
    opEn: 'Compress 1KB with Zippy/Snappy',
    opZh: '使用 Snappy 压缩 1KB 数据',
    time: '2,000 ns (2 µs)',
    notesEn: 'Fast CPU compression',
    notesZh: '高吞吐量快速压缩'
  },
  {
    opEn: 'Send 1 KB over 1 Gbps network',
    opZh: '在 1 Gbps 网络上传输 1KB 数据',
    time: '10,000 ns (10 µs)',
    notesEn: 'Local network link latency',
    notesZh: '机房内千兆局域网传输'
  },
  {
    opEn: 'Read 4 KB randomly from SSD',
    opZh: 'SSD 固态硬盘随机读取 4KB',
    time: '16,000 ns (16 µs)',
    notesEn: 'Fast random read (NVMe/SATA)',
    notesZh: '比机械硬盘寻道快百倍'
  },
  {
    opEn: 'Read 1 MB sequentially from memory',
    opZh: '从主内存顺序读取 1MB 数据',
    time: '3,000 ns (3 µs)',
    notesEn: 'Memory throughput ~300GB/s',
    notesZh: '极高连续读取带宽'
  },
  {
    opEn: 'Round trip within same datacenter',
    opZh: '同数据中心内网络往返 (RTT)',
    time: '500,000 ns (0.5 ms)',
    notesEn: 'Intra-datacenter network trip',
    notesZh: '机房内部网络往返标准基线'
  },
  {
    opEn: 'Read 1 MB sequentially from SSD',
    opZh: 'SSD 固态硬盘顺序读取 1MB',
    time: '1,000,000 ns (1 ms)',
    notesEn: '1GB/sec read speed',
    notesZh: '常规 SSD 连续读取速度'
  },
  {
    opEn: 'Disk seek (magnetic HDD)',
    opZh: '机械硬盘磁头寻道 (HDD Seek)',
    time: '2,000,000 ns (2 ms)',
    notesEn: 'Mechanical arm movement',
    notesZh: '物理机械臂移动延迟'
  },
  {
    opEn: 'Read 1 MB sequentially from HDD',
    opZh: '从机械硬盘顺序读取 1MB',
    time: '20,000,000 ns (20 ms)',
    notesEn: 'HDD throughput ~50MB/s',
    notesZh: '机械磁盘连续盘片读取'
  },
  {
    opEn: 'Packet roundtrip CA to Netherlands',
    opZh: '跨国数据包往返 (加州至欧洲荷兰)',
    time: '150,000,000 ns (150 ms)',
    notesEn: 'Trans-Atlantic speed of light',
    notesZh: '跨洋海底光缆物理光速限制'
  }
];

export const FOUR_STEP_FRAMEWORK_BILINGUAL = [
  {
    step: 1,
    titleEn: 'Understand the Problem and Establish Design Scope',
    titleZh: '深入理解问题并明确系统范围与指标',
    durationEn: '3 - 10 minutes',
    durationZh: '3 - 10 分钟',
    focusEn:
      'Ask clarifying questions. Understand user requirements, traffic volume (DAU, QPS), latency expectations, mobile vs web clients, and core non-functional requirements.',
    focusZh:
      '主动提出澄清问题。梳理核心用例 (Use Cases)、日活用户 (DAU)、读写 QPS 峰值、数据存储年增量、延迟容忍度以及高可用性 (SLA) 目标。'
  },
  {
    step: 2,
    titleEn: 'Propose High-Level Design and Get Buy-in',
    titleZh: '提出高层宏观设计并达成共识',
    durationEn: '10 - 15 minutes',
    durationZh: '10 - 15 分钟',
    focusEn:
      'Draw high-level block diagram (Clients, Load Balancer, Web Servers, Database, Cache, CDN, Message Queues). Walk through common use case flows with the interviewer.',
    focusZh:
      '绘制系统核心模块框图 (客户端、负载均衡器、无状态服务集群、数据库、Redis缓存、CDN及异步消息队列)。结合具体业务流程步进说明，确保面试官认可大方向。'
  },
  {
    step: 3,
    titleEn: 'Design Deep Dive',
    titleZh: '核心瓶颈与关键模块深度下潜',
    durationEn: '10 - 25 minutes',
    durationZh: '10 - 25 分钟',
    focusEn:
      'Investigate 2-3 core bottlenecks or interviewer-specified components (e.g. data schema, cache consistency, replication, sharding, fault tolerance, algorithms).',
    focusZh:
      '针对面试官关心的 2-3 个核心难点深入剖析：如数据库分库分表算法、缓存失效与击穿应对策略、分布式锁、强一致性 vs 最终一致性权衡、算法选型等。'
  },
  {
    step: 4,
    titleEn: 'Wrap Up and Discuss Failure Modes',
    titleZh: '总结设计、容灾边界与未来演进',
    durationEn: '3 - 5 minutes',
    durationZh: '3 - 5 分钟',
    focusEn:
      'Summarize the architecture, point out failure scenarios (e.g. server crash, network partition), operational metrics, monitoring, and next-stage scaling.',
    focusZh:
      '梳理完整系统链路，指出系统薄弱点 (单点故障 SPoF、网络分区、机房灾备)、可观测性 (Prometheus 指标/告警) 以及在 10 倍用户规模下的演化方向。'
  }
];
