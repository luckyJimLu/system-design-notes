import { Chapter, HeadingItem } from '../types';

// Load all markdown files at build time
const markdownModules = import.meta.glob<string>(
  [
    '../../[0-9]*/*.md',
    '../../embedded-systems/**/*.md',
    '../../modemlog/*.md',
    '../../Readme.md'
  ],
  { query: '?raw', import: 'default', eager: true }
) as Record<string, string>;

// Load all image assets so Vite bundles and resolves their URLs automatically
const imageModules = import.meta.glob<string>(
  [
    '../../[0-9]*/**/images/*.png',
    '../../embedded-systems/**/images/*.png',
    '../../modemlog/**/images/*.png'
  ],
  { query: '?url', import: 'default', eager: true }
) as Record<string, string>;

// Fast normalized image lookup map
// Map various lookup keys to the bundled asset URL
const imageLookupMap = new Map<string, string>();

for (const [key, url] of Object.entries(imageModules)) {
  // key is e.g. "../../01. Scaling/images/single-server.png"
  const cleanKey = key.replace(/^\.\.\/\.\.\//, ''); // "01. Scaling/images/single-server.png"
  imageLookupMap.set(cleanKey.toLowerCase(), url);

  const parts = cleanKey.split('/');
  const fileName = parts[parts.length - 1]; // "single-server.png"
  const folder = parts[0]; // "01. Scaling" or "27.  Digital Wallet"

  // Standard folder / file combinations
  imageLookupMap.set(`${folder.toLowerCase()}/${fileName.toLowerCase()}`, url);
  imageLookupMap.set(`${folder.toLowerCase()}/images/${fileName.toLowerCase()}`, url);
  // Folder with normalized single spaces
  const normalizedFolder = folder.replace(/\s+/g, ' ').toLowerCase();
  imageLookupMap.set(`${normalizedFolder}/${fileName.toLowerCase()}`, url);
  imageLookupMap.set(`${normalizedFolder}/images/${fileName.toLowerCase()}`, url);

  // Fallback by fileName alone if unique or first occurrence
  if (!imageLookupMap.has(fileName.toLowerCase())) {
    imageLookupMap.set(fileName.toLowerCase(), url);
  }
}

// Helper to look up an image by chapter folder and relative image path
export function resolveImageUrl(chapterFolder: string, originalSrc: string): string {
  if (!originalSrc) return '';
  if (
    originalSrc.startsWith('http://') ||
    originalSrc.startsWith('https://') ||
    originalSrc.startsWith('data:')
  ) {
    return originalSrc;
  }

  // Extract pure filename
  const cleanSrc = originalSrc.replace(/^\.?\/?images\//, '').replace(/^\.\//, '');
  const fileName = (cleanSrc.split('/').pop() || cleanSrc).toLowerCase();
  const rawFolder = chapterFolder.toLowerCase();
  const normalizedFolder = chapterFolder.replace(/\s+/g, ' ').toLowerCase();

  // Try exact folder/images/filename
  const candidates = [
    `${rawFolder}/images/${fileName}`,
    `${normalizedFolder}/images/${fileName}`,
    `${rawFolder}/${fileName}`,
    `${normalizedFolder}/${fileName}`,
    fileName
  ];

  for (const candidate of candidates) {
    const found = imageLookupMap.get(candidate);
    if (found) return found;
  }

  return originalSrc;
}

// Extract headings from markdown
export function extractHeadings(markdown: string): HeadingItem[] {
  const headings: HeadingItem[] = [];
  const lines = markdown.split('\n');
  const seenIds = new Set<string>();

  for (const line of lines) {
    const match = line.match(/^(#{1,3})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      let title = match[2].trim();
      // Strip markdown links if any e.g. [Title](url) -> Title
      title = title.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
      // Strip html tags
      title = title.replace(/<\/?[^>]+(>|$)/g, '');

      // Generate a clean slug
      let slug = title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');

      if (!slug) slug = `heading-${headings.length}`;
      let uniqueSlug = slug;
      let counter = 1;
      while (seenIds.has(uniqueSlug)) {
        uniqueSlug = `${slug}-${counter++}`;
      }
      seenIds.add(uniqueSlug);

      headings.push({
        id: uniqueSlug,
        title,
        level
      });
    }
  }

  return headings;
}

// Chapter metadata mapping
const chapterMeta: Record<
  number,
  {
    title: string;
    titleZh: string;
    volume: 1 | 2;
    category: Chapter['category'];
    description: string;
    descriptionZh: string;
    tags: string[];
    tagsZh: string[];
  }
> = {
  1: {
    title: 'Scale From Zero To Millions Of Users',
    titleZh: '从零扩展到数百万用户',
    volume: 1,
    category: 'core',
    description:
      'Step-by-step architectural evolution: single server, database tier separation, vertical vs horizontal scaling, load balancers, database replication, caching layer, CDN, stateless web tier, multi-data centers, message queues, logging/metrics, and database sharding.',
    descriptionZh:
      '从单机到亿级高并发的架构演化之路：Web 与数据库解耦、垂直扩展 vs 水平扩展、负载均衡器、主从数据库读写分离与复制、Redis 多级缓存层、CDN 静态加速、无状态 Web 服务、多机房异地多活、异步解耦消息队列以及数据库水平分库分表 (Sharding)。',
    tags: ['Scaling', 'Load Balancer', 'Database Replication', 'Cache', 'CDN', 'Sharding'],
    tagsZh: ['系统扩展', '负载均衡', '主从复制', '多级缓存', 'CDN加速', '分库分表']
  },
  2: {
    title: 'Back Of The Envelope Estimation',
    titleZh: '粗略估算 (Back Of The Envelope)',
    volume: 1,
    category: 'core',
    description:
      'Quantitative estimation framework: Powers of two byte calculations, latency numbers every programmer should know, availability metrics (99% to 99.999%), and estimating Twitter QPS, storage, and server hardware bounds.',
    descriptionZh:
      '系统容量与性能指标量化估算指南：2 的幂次方换算技巧、每个程序员必须掌握的硬件延迟数据 (内存、SSD、网络 RTT)、高可用性 SLA 指标 (几个9)，以及实战估算 Twitter 读写 QPS、存储日增量及服务器集群规模。',
    tags: ['Estimation', 'Latency', 'QPS', 'Hardware Numbers', 'Calculations'],
    tagsZh: ['容量估算', '延时基准', 'QPS并发', '硬件常数', '极速心算']
  },
  3: {
    title: 'A Framework For System Design Interviews',
    titleZh: '系统设计面试应对框架 (4步法)',
    volume: 1,
    category: 'core',
    description:
      'The battle-tested 4-step interview strategy: (1) Understand problem & establish scope, (2) Propose high-level design & gain consensus, (3) Design deep-dive on bottlenecks, (4) Wrap-up & failure modes.',
    descriptionZh:
      '系统设计面试实战通关 4 步法：第1步理解需求与界定设计边界 (明确 DAU 与功能范围)，第2步给出宏观高层设计并与面试官达成共识，第3步核心瓶颈与关键模块深度下潜，第4步复盘容灾、监控与未来扩展方向。',
    tags: ['Interview Framework', 'Scoping', 'Deep Dive', 'Communication'],
    tagsZh: ['面试框架', '需求澄清', '深度剖析', '工程沟通']
  },
  4: {
    title: 'Design A Rate Limiter',
    titleZh: '设计限流器 (Rate Limiter)',
    volume: 1,
    category: 'infrastructure',
    description:
      'Preventing DoS attacks and resource starvation: Token bucket, leaky bucket, fixed window counter, sliding window log, and sliding window counter algorithms, Redis centralized caching, and multi-tier rate limiting rules.',
    descriptionZh:
      '防止恶意攻击与保护后端服务的限流系统：深度对比令牌桶 (Token Bucket)、漏桶 (Leaky Bucket)、固定窗口计数器、滑动窗口日志以及滑动窗口计数器 5 种核心算法；结合 Redis Sorted Set 实现高并发集中式分布式限流，并讲解规则引擎与容错降级。',
    tags: ['Rate Limiter', 'Algorithms', 'Redis', 'Token Bucket', 'Distributed'],
    tagsZh: ['限流算法', '令牌桶', '漏桶', '滑动窗口', 'Redis集群', '服务保护']
  },
  5: {
    title: 'Design Consistent Hashing',
    titleZh: '一致性哈希 (Consistent Hashing)',
    volume: 1,
    category: 'core',
    description:
      'Solving the rehashing problem in distributed caches: Hash ring topology, server lookup, node addition & removal with minimal key migration, and virtual nodes for uniform partition distribution.',
    descriptionZh:
      '解决分布式缓存扩缩容引发的雪崩与 Rehashing 难题：一致性哈希环设计原理、顺时针路由查找、节点动态增删时数据最小化迁移特性，以及采用虚拟节点 (Virtual Nodes) 彻底解决数据分布倾斜难题。',
    tags: ['Consistent Hashing', 'Hash Ring', 'Virtual Nodes', 'Dynamo', 'Cassandra'],
    tagsZh: ['一致性哈希', '哈希环', '虚拟节点', '分布式缓存', '数据倾斜']
  },
  6: {
    title: 'Design A Key-Value Store',
    titleZh: '设计分布式键值存储系统 (KV Store)',
    volume: 1,
    category: 'distributed-storage',
    description:
      'Building Dynamo-style distributed KV storage: CAP theorem trade-offs, configurable quorum consensus (N, W, R), vector clocks for conflict resolution, gossip protocol for failure detection, Merkle trees for anti-entropy, and LSM-tree write/read paths.',
    descriptionZh:
      '对标 Dynamo / Cassandra 的高可用分布式 KV 存储：CAP 定理权衡、强一致性 vs 最终一致性、可配置的仲裁共识机制 (N, W, R)、向量时钟 (Vector Clock) 解决并发写入冲突、Gossip 谣言协议故障探测、Merkle 树数据对比同步以及 LSM-Tree 读写路径剖析。',
    tags: ['Key-Value', 'CAP Theorem', 'Quorum', 'Vector Clocks', 'Merkle Tree', 'LSM-Tree'],
    tagsZh: ['KV存储', 'CAP定理', 'Quorum仲裁', '向量时钟', 'Gossip协议', 'LSM树']
  },
  7: {
    title: 'Design A Unique ID Generator',
    titleZh: '设计分布式唯一 ID 生成器',
    volume: 1,
    category: 'infrastructure',
    description:
      'Generating globally unique, time-sortable 64-bit IDs across distributed clusters: Multi-master replication, UUIDs, ticket servers (Flickr), and Twitter Snowflake breakdown (timestamp, worker ID, sequence number).',
    descriptionZh:
      '分布式集群中生成 64 位全局唯一、时间有序 ID：评估多主复制自增序列、UUID、Flickr Ticket Server 等方案的优劣，重点剖析 Twitter Snowflake (雪花算法) 的位划分 (时间戳 + 机器机房 ID + 序列号) 与时钟回拨处理。',
    tags: ['Snowflake', 'UUID', 'Ticket Server', 'Distributed ID'],
    tagsZh: ['雪花算法', '分布式ID', '全局唯一', '时钟回拨', '高性能发号器']
  },
  8: {
    title: 'Design A URL Shortener',
    titleZh: '设计短网址系统 (TinyURL)',
    volume: 1,
    category: 'real-time-apps',
    description:
      'TinyURL system architecture: 301 Moved Permanently vs 302 Found redirects, Base62 encoding versus MD5/SHA hash collision handling, relational schema, and high-performance read-heavy caching.',
    descriptionZh:
      '高并发短链生成与跳转系统：对比 301 永久重定向与 302 临时重定向对分析统计的影响；解析 Base62 编码转换与哈希截断冲突处理；设计极速读多写少的只读缓存层与长久存储分表架构。',
    tags: ['URL Shortener', 'Base62', 'Redirects', 'Caching', 'Hash Function'],
    tagsZh: ['短网址系统', 'Base62编码', 'HTTP重定向', '高并发缓存', '哈希碰撞']
  },
  9: {
    title: 'Design A Web Crawler',
    titleZh: '设计海量网页网络爬虫 (Web Crawler)',
    volume: 1,
    category: 'infrastructure',
    description:
      'Large-scale search engine crawler: URL frontier, politeness queues per host, priority scheduling, HTML downloader, DNS caching, content duplicate checksums, and extensibility for multimedia.',
    descriptionZh:
      '支撑搜索引擎的十亿级分布式爬虫：URL Frontier 架构设计、面向主机的礼貌性队列 (Politeness Queue)、优先级调度机制、高性能异步 HTML 下载器、DNS 解析缓存、SimHash 网页去重与防蜘蛛陷阱机制。',
    tags: ['Web Crawler', 'URL Frontier', 'Politeness', 'Robots.txt', 'DNS'],
    tagsZh: ['网络爬虫', 'URL边界队列', '礼貌性抓取', 'DNS缓存', '内容去重']
  },
  10: {
    title: 'Design A Notification System',
    titleZh: '设计海量消息通知推送系统',
    volume: 1,
    category: 'real-time-apps',
    description:
      'Push notification, SMS, and email platform: Apple APNS, Google FCM, SMS gateways, message queues for worker decoupling, rate limiting, retry mechanisms, and event tracking analytics.',
    descriptionZh:
      '支持 iOS APNS、Android FCM、短信与邮件的多渠道统一推送系统：利用消息队列 (RabbitMQ/Kafka) 实现高并发削峰解耦、用户防打扰频次控制、失败自动重试与死信队列、以及端到端到达率追踪分析。',
    tags: ['Notifications', 'APNS', 'FCM', 'Message Queues', 'Decoupling'],
    tagsZh: ['推送通知', 'APNS', 'FCM', '消息队列', '解耦削峰', '防打扰控制']
  },
  11: {
    title: 'Design A News Feed System',
    titleZh: '设计社交信息流/朋友圈 (News Feed)',
    volume: 1,
    category: 'real-time-apps',
    description:
      'Social timeline generation at Facebook scale: Feed publishing flow, news feed retrieval flow, fanout-on-write (push) vs fanout-on-read (pull) hybrid model, and 5-tier caching hierarchy.',
    descriptionZh:
      'Facebook 级社交关系网络时间线流设计：Feed 发布与拉取流程、深度剖析推模式 (Fanout-on-write) 与拉模式 (Fanout-on-read) 的优缺点及面向大V名人的混合推拉模型，以及五层高性能缓存架构。',
    tags: ['News Feed', 'Fanout', 'Social Graph', 'Cache Architecture'],
    tagsZh: ['信息流', '推拉模型', '朋友圈', '社交关系链', '多级缓存']
  },
  12: {
    title: 'Design A Chat System',
    titleZh: '设计即时通讯/聊天系统 (Chat System)',
    volume: 1,
    category: 'real-time-apps',
    description:
      'WhatsApp/Discord messaging architecture: Polling vs long-polling vs WebSockets, stateless gateway vs stateful chat servers, presence servers with heartbeat protocol, and 1:1 vs group fanout.',
    descriptionZh:
      '对标 WhatsApp/Discord 的高并发聊天架构：长轮询 vs WebSocket 双向全双工长连接选型、无状态网关服务与有状态聊天节点集群、心跳保活在线状态服务 (Presence Server)、单聊投递与群聊消息扩散优化。',
    tags: ['Chat', 'WebSockets', 'Presence', 'Heartbeat', 'Group Messaging'],
    tagsZh: ['即时通讯', 'WebSocket', '在线状态', '心跳保活', '群聊消息扩散']
  },
  13: {
    title: 'Design A Search Autocomplete System',
    titleZh: '设计搜索自动补全 (Typeahead Suggestions)',
    volume: 1,
    category: 'real-time-apps',
    description:
      'Google Typeahead suggestions: Trie data structure, top k query nodes, prefix hash trees, Trie caching in memory, sharding strategies, and real-time vs asynchronous frequency table aggregation.',
    descriptionZh:
      '类似 Google 搜索框的前缀联想词系统：前缀树 (Trie 字典树) 数据结构设计、节点预存 Top-K 高频热词、前缀树内存化与按字符首字母分片、异步批量词频聚合与实时日志更新机制。',
    tags: ['Autocomplete', 'Trie', 'Prefix Search', 'Typeahead', 'Caching'],
    tagsZh: ['搜索补全', '前缀树Trie', '热词TopK', '前缀联想', '内存缓存']
  },
  14: {
    title: 'Design YouTube',
    titleZh: '设计视频点播平台 (YouTube)',
    volume: 1,
    category: 'specialized',
    description:
      'Global video streaming platform: Video uploading and transcoding pipeline, DAG scheduler and task workers, pre-signed upload URLs, adaptive bitrate streaming (HLS/DASH), and edge CDN caching.',
    descriptionZh:
      '全球级视频点播与转码系统：预签名上传直传对象存储、有向无环图 (DAG) 转码任务调度与分片并行转码、自适应码率流媒体 (HLS / DASH)、CDN 边缘节点视频分发与缓存加速。',
    tags: ['Video Streaming', 'Transcoding', 'DAG', 'CDN', 'HLS/DASH'],
    tagsZh: ['视频流媒体', '视频转码', 'DAG调度', 'CDN加速', '自适应码率']
  },
  15: {
    title: 'Design Google Drive',
    titleZh: '设计云端硬盘文件同步 (Google Drive)',
    volume: 1,
    category: 'distributed-storage',
    description:
      'Cloud file storage and real-time sync: File block chunking, delta sync, S3 block storage, metadata database, notification service for remote client updates, and conflict resolution.',
    descriptionZh:
      '云存储与多端实时文件同步架构：文件分块 (Chunking)、增量同步 (Delta Sync) 与数据去重、底层 S3 对象存储、强一致性元数据存储、客户端长连接变更实时通知与并发冲突合并策略。',
    tags: ['Cloud Storage', 'Block Storage', 'Delta Sync', 'Sync Conflicts'],
    tagsZh: ['云端网盘', '文件分块', '增量同步', '多端同步', '冲突解决']
  },
  16: {
    title: 'Proximity Service',
    titleZh: '设计附近地点搜索服务 (Proximity Service)',
    volume: 2,
    category: 'specialized',
    description:
      'Yelp / Google Places location discovery: Geospatial indexing, 2D range query limitations, Even Grid, Geohash base32 encoding with boundary edge cases, and Quadtree recursive spatial partitioning.',
    descriptionZh:
      '美团 / Yelp 附近商户检索服务：传统二维 SQL 范围查询局限、均匀网格缺陷、深入剖析 Geohash Base32 编码与跨边界邻近块查询，以及四叉树 (Quadtree) 递归空间划分与动态拆分合并机制。',
    tags: ['Geospatial', 'Geohash', 'Quadtree', 'Location Service', 'Proximity'],
    tagsZh: ['空间索引', 'Geohash', '四叉树', '位置服务', '附近商户']
  },
  17: {
    title: 'Nearby Friends',
    titleZh: '设计附近的好友实时定位 (Nearby Friends)',
    volume: 2,
    category: 'real-time-apps',
    description:
      'Real-time friend locator: Periodic location updates, Redis Pub/Sub channels per geohash, fan-out backend, and consistent hashing for stateful WebSocket connections.',
    descriptionZh:
      '高频实时位置追踪与好友位置广播：周期性位置上报压缩、按 Geohash 划分 Redis 发布订阅 (Pub/Sub) 频道、长连接集群一致性哈希路由分发与后台扇出广播削峰方案。',
    tags: ['Real-time Location', 'Redis Pub/Sub', 'WebSockets', 'Geohash'],
    tagsZh: ['实时位置', 'Redis发布订阅', 'WebSocket长连接', '位置广播']
  },
  18: {
    title: 'Design Google Maps',
    titleZh: '设计电子地图导航与路径规划 (Google Maps)',
    volume: 2,
    category: 'specialized',
    description:
      'Navigation, maps, and ETA calculation: Map tile generation, Mercator projection, hierarchical road graphs, Dijkstra & A* shortest path algorithms, adaptive ETA, and streaming navigation updates.',
    descriptionZh:
      '地图渲染、最短寻路与实时 ETA 预估：墨卡托投影与矢量瓦片金字塔、分层道路拓扑图构建、Dijkstra 与 A* 寻路启发式算法、结合实时路况的动态 ETA 预估模型及导航数据流传输。',
    tags: ['Maps', 'Routing', 'Tiles', 'Navigation', 'ETA'],
    tagsZh: ['地图瓦片', '路径规划', 'A星算法', '动态ETA', '实时导航']
  },
  19: {
    title: 'Distributed Message Queue',
    titleZh: '设计分布式消息队列 (Distributed Message Queue)',
    volume: 2,
    category: 'infrastructure',
    description:
      'Kafka-scale message queue: Partitions, commit log (WAL), point-to-point vs publish-subscribe, consumer groups, delivery guarantees (at-least-once, exactly-once), and broker failover recovery.',
    descriptionZh:
      '对标 Apache Kafka 的万亿级高吞吐消息引擎：Topic 分区 (Partitions)、磁盘顺序写预写日志 (WAL)、点对点队列 vs 发布订阅模式、消费者组 (Consumer Group) 负载均衡、消息投递语义 (至少一次/精准一次) 与 Broker 主从切换容灾。',
    tags: ['Message Queue', 'Kafka', 'WAL', 'Partitions', 'Consumer Groups'],
    tagsZh: ['消息队列', 'Kafka内核', '顺序写WAL', '分区机制', '精准一次消费']
  },
  20: {
    title: 'Metrics Monitoring and Alerting System',
    titleZh: '设计分布式监控与告警系统 (Metrics & Alerting)',
    volume: 2,
    category: 'infrastructure',
    description:
      'Prometheus/Datadog monitoring architecture: Pull vs push metric collectors, time-series storage engines, double-delta timestamp/value compression, query service caching, and alert routing.',
    descriptionZh:
      '对标 Prometheus / Datadog 的监控体系：指标拉取 (Pull) vs 推送 (Push) 模型对比、高性能时序数据库 (TSDB) 架构、Gorilla 双重差值 (Double-Delta) 时间戳与浮点数压缩算法、告警规则引擎与去重抑制。',
    tags: ['Metrics', 'Monitoring', 'Time-Series', 'Prometheus', 'Double-Delta'],
    tagsZh: ['监控告警', '时序数据库', 'Prometheus', '双重差值压缩', '指标拉取']
  },
  21: {
    title: 'Ad Click Event Aggregation',
    titleZh: '广告点击事件实时流式聚合系统 (Ad Click Aggregation)',
    volume: 2,
    category: 'infrastructure',
    description:
      'Real-time big data ad impression aggregation: Lambda vs Kappa architectures, map-reduce streaming aggregation, tumbling vs sliding windows, watermarking for out-of-order events, and reconciliation pipelines.',
    descriptionZh:
      '海量广告点击事件毫秒级实时统计：Lambda 架构 vs Kappa 架构流处理选型、滚动窗口 (Tumbling Window) 与滑动窗口 (Sliding Window)、水印 (Watermark) 机制解决乱序延迟到达事件、对账管道与精确去重。',
    tags: ['Big Data', 'Stream Processing', 'MapReduce', 'Watermark', 'Ad Tech'],
    tagsZh: ['流计算', '大数据库', '滑动窗口', '乱序水印', '广告对账']
  },
  22: {
    title: 'Hotel Reservation System',
    titleZh: '设计高并发酒店房间预订系统 (Hotel Reservation)',
    volume: 2,
    category: 'specialized',
    description:
      'Booking.com high-concurrency booking engine: Concurrency control, double-booking prevention, pessimistic vs optimistic locking, database constraints, idempotency keys, and inventory cache tiers.',
    descriptionZh:
      '对标 Booking.com / 携程的高并发订房中台：防超卖与防重复预订 (Double Booking)、悲观锁 vs 乐观锁 (CAS / 版本号) 性能对比分析、数据库唯一约束、幂等性 Token 机制与 Redis 预扣库存缓存层。',
    tags: ['Booking', 'Reservation', 'Concurrency', 'Optimistic Locking', 'Idempotency'],
    tagsZh: ['酒店预订', '防超卖', '乐观锁', '幂等性', '库存缓存', '并发控制']
  },
  23: {
    title: 'Distributed Email Service',
    titleZh: '设计分布式海量邮件系统 (Distributed Email Service)',
    volume: 2,
    category: 'specialized',
    description:
      'Gmail-scale email architecture: SMTP, POP, IMAP protocols, distributed mail storage with LSM trees, inverted index search with Elasticsearch, multi-datacenter replication, and attachment object storage.',
    descriptionZh:
      '对标 Gmail 的十亿级邮件基础设施：SMTP 发送、POP/IMAP 接收协议链路、基于 LSM 树的高性能分布式邮件存取、基于倒排索引 (Elasticsearch) 的秒级全文检索、多数据中心异地复制与大附件对象存储。',
    tags: ['Email', 'SMTP', 'LSM-Tree', 'Elasticsearch', 'Distributed Storage'],
    tagsZh: ['邮件系统', 'SMTP协议', '倒排索引', '全文检索', '邮件存储']
  },
  24: {
    title: 'S3-Like Object Storage',
    titleZh: '设计类 S3 分布式对象存储系统 (Object Storage)',
    volume: 2,
    category: 'distributed-storage',
    description:
      'Distributed blob storage: Buckets and objects, data persistence write path, erasure coding (8+4 Reed-Solomon) vs replication across failure domains, multipart uploads, and versioning.',
    descriptionZh:
      '对标 AWS S3 的高可靠块与对象存储引擎：Bucket 与 Object 数据抽象、元数据与数据存储节点解耦、纠删码 (8+4 Reed-Solomon Erasure Coding) 相比多副本的成本与可靠性优势、分片断点续传与版本控制。',
    tags: ['Object Storage', 'S3', 'Erasure Coding', 'Replication', 'Multipart Upload'],
    tagsZh: ['对象存储', 'AWS S3', '纠删码', '多分片上传', '元数据解耦']
  },
  25: {
    title: 'Real-Time Gaming Leaderboard',
    titleZh: '设计实时游戏积分排行榜 (Gaming Leaderboard)',
    volume: 2,
    category: 'real-time-apps',
    description:
      'Global live leaderboard ranking: Redis Sorted Sets (ZSET), Skip List internals and O(log N) operations, scatter-gather query pattern, and sharded leaderboard scaling.',
    descriptionZh:
      '千万级玩家在线毫秒级积分榜：Redis 有序集合 (Sorted Set / ZSET) 底层跳表 (Skip List) 原理与 O(log N) 复杂度分析、Scatter-Gather 跨分片聚合模式、以及面对海量积分分布的按分数段拆分扩展。',
    tags: ['Leaderboard', 'Redis ZSET', 'Skip List', 'Real-time', 'Gaming'],
    tagsZh: ['实时排行榜', 'Redis跳表', 'ZSET原理', '分片聚合', '游戏排名']
  },
  26: {
    title: 'Payment System',
    titleZh: '设计高可靠分布式支付系统 (Payment System)',
    volume: 2,
    category: 'specialized',
    description:
      'Stripe-like financial transaction pipeline: Pay-in and pay-out workflows, payment gateway integration, hosted payment pages, idempotency keys, retry queues, double-entry bookkeeping ledger, and settlement reports.',
    descriptionZh:
      '对标 Stripe 的金融级交易处理链路：收单 (Pay-in) 与出金 (Pay-out) 业务流程、支付网关对接与托管页面、全局唯一幂等键 (Idempotency Key)、指数退避重试队列、复式记账法 (Double-entry Bookkeeping) 记账引擎与财务对账核算。',
    tags: ['Payment System', 'Idempotency', 'Reconciliation', 'Double-Entry', 'FinTech'],
    tagsZh: ['支付系统', '金融结算', '复式记账', '幂等保证', '资金对账']
  },
  27: {
    title: 'Digital Wallet',
    titleZh: '设计分布式数字钱包系统 (Digital Wallet)',
    volume: 2,
    category: 'specialized',
    description:
      'PayPal/Venmo high-reliability ledger: Distributed transactions across relational databases, 2-phase commit (2PC) vs Saga orchestration, event sourcing with CQRS, and Raft consensus replication.',
    descriptionZh:
      '对标 PayPal / 微信支付的高并发高可靠账户余额系统：跨数据库分布式事务、两阶段提交 (2PC) vs Saga 编排模式深度对比、基于事件溯源 (Event Sourcing) 与 CQRS 读写分离的账户体系、以及基于 Raft 共识协议的高可用复制。',
    tags: ['Digital Wallet', '2PC', 'Saga', 'Event Sourcing', 'CQRS', 'Raft'],
    tagsZh: ['数字钱包', '分布式事务', 'Saga模式', '事件溯源', 'CQRS架构', 'Raft共识']
  },
  28: {
    title: 'Stock Exchange',
    titleZh: '设计微秒级证券交易撮合系统 (Stock Exchange)',
    volume: 2,
    category: 'specialized',
    description:
      'Microsecond trading exchange: Order books (L1/L2/L3 market data), matching engines, sequencer architecture, event sourcing via mmap ring buffers, determinism, and ultra-high availability.',
    descriptionZh:
      '微秒级低延迟交易所架构：订单簿 (Order Book) 结构 (L1/L2/L3 行情深度)、定序器 (Sequencer) 确定性架构、内存无锁撮合引擎、基于 mmap 环形内存缓冲的事件溯源持久化以及全链路确定性高可用备份。',
    tags: ['Stock Exchange', 'Order Book', 'Matching Engine', 'Sequencer', 'Low Latency'],
    tagsZh: ['证券交易所', '撮合引擎', '订单簿', '定序器', '微秒低延迟']
  }
};

// Embedded & Modem chapters bilingual mapping with ordering
export interface EmbeddedDocMeta {
  titleEn?: string;
  titleZh: string;
  descEn?: string;
  descZh: string;
  tagsEn?: string[];
  tagsZh?: string[];
  order: number;
}

export const embeddedMeta: Record<string, EmbeddedDocMeta> = {
  resource_constrained_embedded_rtos_architecture: {
    titleEn: 'Resource-Constrained Embedded RTOS Architecture Design & Core Mechanisms',
    titleZh: '资源受限嵌入式系统架构设计与 RTOS 核心机制研究报告',
    descEn:
      'In-depth study on deterministic real-time embedded systems under tight resource limits: static memory allocation, Active Object / HSM, ISR/critical section latency bounds, lock-free SPSC ring buffers, watchdog supervisor, tickless idle low-power races, and FreeRTOS / RT-Thread / Zephyr kernel pruning.',
    descZh:
      '面向数KB~数十KB SRAM与低主频MCU的确定性嵌入式架构研究：静态内存收敛、少任务+活动对象(Active Object)/层次化状态机(HSM)、ISR与临界区时延边界、SPSC无锁环形缓冲、位掩码看门狗健康监控、Tickless Idle低功耗竞态防御，以及FreeRTOS/RT-Thread/Zephyr内核极致裁剪与工程落地验证。',
    tagsEn: ['RTOS', 'Embedded Systems', 'FreeRTOS', 'Static Memory', 'SPSC RingBuffer', 'Watchdog', 'Low Power'],
    tagsZh: ['RTOS实时系统', '嵌入式架构', '静态内存', '无锁环形缓冲', '看门狗监控', '低功耗Tickless', 'FreeRTOS裁剪'],
    order: 1
  },
  diagnostics_unified_design: {
    titleEn: 'STM32 ModemLog, CHR & Local Packet Capture Unified Design',
    titleZh: 'STM32 ModemLog、CHR 与本地抓包统一设计基线',
    descEn:
      'Unified firmware diagnostic architecture: independent ModemLog and CHR sockets, MCU-side lwIP packet capture tap with private snapshot pool, dual-task Socket Reactor & Storage Owner, bounded drop semantics, and PCAP serialization.',
    descZh:
      '统一固件诊断架构设计：ModemLog与CHR双独立Socket、MCU本地lwIP收发路径只读抓包镜像与私有快照池、双任务(Socket Reactor + Storage Owner)并发模型、故障退让与PCAP文件序列化落盘。',
    tagsEn: ['ModemLog', 'CHR', 'Packet Capture', 'lwIP', 'PCAP', 'Firmware Design'],
    tagsZh: ['Modem诊断', '双Socket', '本地抓包', 'lwIP协议栈', 'PCAP格式', 'StorageOwner'],
    order: 2
  },
  cpp_architecture_and_interactions: {
    titleEn: 'C++ Architecture: Dual Socket & Local TCPDump Interaction Contracts',
    titleZh: 'C++ 实现架构：双 Socket 与本地 TCPDump 交互契约',
    descEn:
      'C++17 static composition for embedded diagnostics: class-to-task mappings, non-copyable buffer leases, lock-free publication, C trampoline bindings for FreeRTOS & lwIP, and asynchronous quiescence & stop protocols.',
    descZh:
      '现代嵌入式C++17静态组合架构：类职责与双任务映射、不可复制缓冲Lease所有权管理、内存序无锁发布、lwIP与FreeRTOS C语言Trampoline适配、以及确定性显式异步关停协议。',
    tagsEn: ['C++17', 'Embedded C++', 'Ownership Model', 'Zero Allocation', 'FreeRTOS', 'lwIP'],
    tagsZh: ['现代C++17', '嵌入式C++', '所有权Lease', '无堆分配', 'FreeRTOS', 'lwIP适配'],
    order: 3
  },
  modem_complete_mermaid_flows: {
    titleEn: 'Modem Diagnostic System Complete Mermaid Flowcharts',
    titleZh: 'Modem 诊断系统完整 Mermaid 架构与流程图',
    descEn:
      'Comprehensive visual specifications: end-to-end data flow, Socket Reactor scheduling, capture tap pass-through, buffer slot ownership state machines, dual network isolation, and quiescence sequences.',
    descZh:
      '全套高清晰架构可视化流程图：端到端双Socket数据流、Reactor公平调度时序、CaptureTap失败放行、环形槽位所有权状态机、双网络域出口隔离与安全停机时序。',
    tagsEn: ['Mermaid', 'Architecture Diagrams', 'State Machine', 'Sequence Diagram', 'Data Flow'],
    tagsZh: ['Mermaid图表', '系统架构图', '状态机迁移', '时序流程图', '数据流向'],
    order: 4
  },
  stm32_lwip_modem_log_storage_design: {
    titleEn: 'STM32 + lwIP Modem High-Speed Log Storage Design',
    titleZh: 'STM32 + lwIP Modem 高速日志低资源写盘设计',
    descEn:
      'High-throughput 1 Mbps continuous log streaming into SD storage: SPSC byte ring buffers, non-blocking lwIP TCP sockets, FatFs aligned batch writes, and DMA synchronization boundaries.',
    descZh:
      '面向1 Mbps持续日志流的低资源可靠写盘方案：SPSC字节无锁环形缓冲、lwIP非阻塞接收与背压、FatFs大块对齐写盘、以及SDMMC DMA同步与持久化边界划分。',
    tagsEn: ['STM32', 'lwIP', 'FatFs', 'SPSC Buffer', 'DMA', 'SD Storage'],
    tagsZh: ['STM32', 'lwIP协议栈', 'FatFs文件系统', 'SPSC环形缓冲', 'SD卡写盘', 'DMA传输'],
    order: 5
  },
  modem_mcu_dual_netif_routing_design: {
    titleEn: 'Modem & MCU Dual Netif Routing & Domain Isolation Design',
    titleZh: 'Modem 与 MCU 双网络域通信与路由隔离设计',
    descEn:
      'Dual network interface isolation: dedicated IPC domain (ipc0) vs WAN cellular uplink (wan0), anti-leakage policy routing hooks, packet filtering, and queue bandwidth arbitration.',
    descZh:
      '核间双网络接口隔离方案：核间专用网卡(ipc0)与公网蜂窝出口(wan0)严格分离、强制源/目的路由Hook防护、出入口防串线校验矩阵、以及多业务队列带宽加权仲裁。',
    tagsEn: ['Dual Netif', 'Policy Routing', 'lwIP Hooks', 'Domain Isolation', 'IPC'],
    tagsZh: ['双网卡架构', '策略路由', 'lwIP Hook', '网络隔离', '核间通信'],
    order: 6
  },
  multi_channel_elastic_worker_pool_design: {
    titleEn: 'ModemLog, TCPDump & CHR Multi-Channel Elastic Worker Pool Design',
    titleZh: 'ModemLog、TCPDump、CHR 独立通道与弹性工作池设计',
    descEn:
      'Multi-channel diagnostics architecture: decoupling persistent business contexts from ephemeral worker threads, serial execution guarantees, generation-based session isolation, and static stack slot pooling.',
    descZh:
      '多业务通道解耦架构：持久业务上下文与瞬态Worker线程分离、同业务串行执行保证、基于Generation的会话隔离、以及固定栈槽复用避免堆碎片。',
    tagsEn: ['Worker Pool', 'Multi-Channel', 'Generation Isolation', 'Static Tasks', 'FreeRTOS'],
    tagsZh: ['工作线程池', '多通道解耦', 'Generation代际', '静态任务栈', 'FreeRTOS'],
    order: 7
  },
  multi_channel_elastic_worker_pool_design_review: {
    titleEn: 'ModemLog, TCPDump & CHR Architecture Review & Revision',
    titleZh: 'ModemLog、TCPDump、CHR 独立通道架构审查与修订',
    descEn:
      'Critical architectural review and corrections: eliminating thread pool deletion hazards, enforcing true SPSC conditions, replacing dynamic queues with atomic ready bitmasks, and refining buffer ownership.',
    descZh:
      '关键工程审查与架构修正：剔除静态栈自删除竞态、规范SPSC单生产者约束、以原子Ready位图替代动态就绪队列、以及明确存储缓冲所有权生命周期。',
    tagsEn: ['Architecture Review', 'Safety Audit', 'Race Conditions', 'Atomic Bitmask', 'Reliability'],
    tagsZh: ['架构审查', '并发安全', '竞态消除', '原子位图', '可靠性加固'],
    order: 8
  },
  // Legacy / fallback mappings
  gprs_network_communication: {
    titleEn: 'GPRS Cellular Network Communication & Connection Management',
    titleZh: 'GPRS 蜂窝网络通信与连接管理',
    descEn: 'Embedded cellular network communication link, AT command state machine, auto-reconnect and heartbeat keepalive.',
    descZh: '嵌入式蜂窝网络通信链路、AT 指令集状态机、掉线自动重连与心跳保活机制。',
    tagsEn: ['Cellular', 'GPRS', 'AT Commands', 'Embedded', 'State Machine'],
    tagsZh: ['蜂窝通信', 'GPRS', 'AT指令', '嵌入式', '状态机'],
    order: 20
  },
  gprs_ppp_connection: {
    titleEn: 'GPRS PPP Dial-Up & Link Establishment',
    titleZh: 'GPRS PPP 协议拨号与链路建立',
    descEn: 'PPP link establishment (LCP/PAP/CHAP/IPCP) and lightweight implementation in MCU / RTOS.',
    descZh: 'PPP (Point-to-Point Protocol) 链路建立流程 (LCP/PAP/CHAP/IPCP) 以及在单片机/RTOS 中的轻量级实现。',
    tagsEn: ['PPP', 'Link Establishment', 'Embedded Networking', 'LCP', 'IPCP'],
    tagsZh: ['PPP协议', '链路建立', '嵌入式网络', 'LCP', 'IPCP'],
    order: 21
  },
  gprs_transparent_transmission: {
    titleEn: 'GPRS Transparent Data Transmission & UART Buffering',
    titleZh: 'GPRS 数据透传模式与串口通信',
    descEn: 'Industrial transparent transmission architecture: DMA UART buffering, packet framing, and protocol pass-through.',
    descZh: '工业级数据透传 (Transparent Transmission) 架构：DMA 串口缓冲、数据帧分包与协议透明传输。',
    tagsEn: ['Transparent Transmission', 'DMA UART', 'IoT', 'RingBuffer'],
    tagsZh: ['数据透传', 'DMA串口', '工业物联网', '环形缓冲'],
    order: 22
  },
  gsm_network_architecture: {
    titleEn: 'GSM Cellular Mobile Communication Architecture',
    titleZh: 'GSM 蜂窝移动通信网络架构',
    descEn: 'Base stations, BSS/NSS network subsystems, signaling channels, and cellular terminal network registration/authentication.',
    descZh: '剖析蜂窝基站、BSS/NSS 网络子系统、信令信道划分以及手机终端驻网鉴权流程。',
    tagsEn: ['GSM Architecture', 'Base Station', 'Signaling Channel', 'Mobile Network'],
    tagsZh: ['GSM架构', '蜂窝基站', '信令信道', '移动通信'],
    order: 23
  },
  gsm_network_time_synchronization: {
    titleEn: 'GSM Base Station Time Synchronization & NTP Calibration',
    titleZh: 'GSM 基站网络授时与 NTP 对时机制',
    descEn: 'Base station network timing, AT+CCLK parsing, high-precision RTC calibration, and industrial time synchronization.',
    descZh: '基站网络授时、AT+CCLK 指令解析、高精度 RTC 晶振校准以及工业场景下的时间同步方案。',
    tagsEn: ['Network Timing', 'NTP', 'RTC Calibration', 'Base Station Time'],
    tagsZh: ['网络授时', 'NTP', 'RTC校准', '基站时间'],
    order: 24
  },
  tcp_ip_dual_netif: {
    titleEn: 'TCP/IP Dual Netif Routing & Failover Architecture',
    titleZh: 'TCP/IP 双网卡 (Dual Netif) 路由与容灾',
    descEn: 'Ethernet + 4G cellular dual interface coexistence: dynamic routing priorities, heartbeat probing, and multihomed failover.',
    descZh: '以太网 + 4G 蜂窝双网卡共存架构：路由表优先级动态切换、心跳探测与多宿主故障转移。',
    tagsEn: ['Dual Netif', 'Routing Failover', 'High Availability', 'TCP/IP', 'lwIP'],
    tagsZh: ['双网卡', '路由切换', '容灾高可用', 'TCP/IP', 'LwIP'],
    order: 25
  },
  uart_buffer_design: {
    titleEn: 'High-Performance Ring Buffer UART Driver Design',
    titleZh: '高性能环形缓冲串口驱动设计 (Ring Buffer)',
    descEn: 'Lock-free ring buffer design: pointer wraparound calculations, DMA ping-pong buffering, and overflow prevention.',
    descZh: '高并发无锁环形缓冲区设计：指针回绕计算、DMA 乒乓缓冲与避免串口溢出丢包。',
    tagsEn: ['UART Driver', 'Ring Buffer', 'Lock-Free', 'DMA'],
    tagsZh: ['串口驱动', '环形缓冲', 'RingBuffer', '无锁队列', 'DMA'],
    order: 26
  }
};

// Build chapters array with bilingual markdown loading
export function getChapters(): Chapter[] {
  const chapters: Chapter[] = [];

  // 1. Process chapters 1 to 28
  for (let num = 1; num <= 28; num++) {
    let rawMarkdownEn = '';
    let rawMarkdownZh = '';
    let folderName = '';
    let defaultFileName = 'README.md';

    for (const key of Object.keys(markdownModules)) {
      const match = key.match(/\.\.\/\.\.\/(\d+)\.\s*(.*?)\/(Readme|README)(?:\.([a-zA-Z-]+))?\.md$/i);
      if (match && parseInt(match[1], 10) === num) {
        const exactFolderMatch = key.match(/\.\.\/\.\.\/(.*?)\/(Readme|README)/i);
        if (exactFolderMatch) {
          folderName = exactFolderMatch[1];
        }
        const langExt = (match[4] || '').toLowerCase();
        if (langExt === 'zh' || langExt === 'zh-cn') {
          rawMarkdownZh = markdownModules[key] || '';
        } else {
          rawMarkdownEn = markdownModules[key] || '';
          defaultFileName = key.split('/').pop() || 'README.md';
        }
      }
    }

    if (rawMarkdownEn || rawMarkdownZh) {
      const meta = chapterMeta[num] || {
        title: `Chapter ${num}`,
        volume: (num <= 15 ? 1 : 2) as 1 | 2,
        category: 'core' as Chapter['category'],
        description: '',
        tags: []
      };

      const primaryMarkdown = rawMarkdownEn || rawMarkdownZh;
      const wordCount = primaryMarkdown.split(/\s+/).filter(Boolean).length;
      const readTime = Math.max(3, Math.round(wordCount / 200));

      chapters.push({
        id: `chapter-${num}`,
        folderName,
        fileName: defaultFileName,
        number: num,
        title: meta.title,
        titleZh: meta.titleZh,
        volume: meta.volume,
        category: meta.category,
        description: meta.description,
        descriptionZh: meta.descriptionZh,
        tags: meta.tags,
        tagsZh: meta.tagsZh,
        markdown: primaryMarkdown,
        markdownEn: rawMarkdownEn || primaryMarkdown,
        markdownZh: rawMarkdownZh,
        estimatedReadTimeMinutes: readTime
      });
    }
  }

  // 2. Process Embedded Systems, RTOS, Modemlog and advanced engineering documents
  const rawEmbeddedKeys = Object.keys(markdownModules).filter(k => {
    const isEmbeddedOrModem = k.includes('/embedded-systems/') || k.includes('/modemlog/');
    const isReadme = k.toLowerCase().endsWith('/readme.md');
    return isEmbeddedOrModem && !isReadme;
  });

  // Group by canonical base file name to pair .zh.md / .en.md / .md together
  interface EmbeddedFileGroup {
    canonicalBase: string; // e.g. "diagnostics_unified_design"
    stableFileName: string; // e.g. "diagnostics-unified-design"
    fileName: string; // e.g. "01-diagnostics-unified-design.md"
    cleanFolder: string;
    keyZh?: string;
    keyEn?: string;
    defaultKey?: string;
  }

  const groupMap = new Map<string, EmbeddedFileGroup>();

  for (const key of rawEmbeddedKeys) {
    const fileName = key.split('/').pop() || '';
    // Normalize: e.g. "01-diagnostics-unified-design.en.md" -> "01-diagnostics-unified-design"
    const withoutExt = fileName.replace(/\.(en|zh|zh-cn)\.md$/i, '').replace(/\.md$/i, '');
    const stableName = withoutExt.replace(/^\d{2}-/, '');
    const canonicalBase = stableName.toLowerCase().replace(/-/g, '_');

    let group = groupMap.get(canonicalBase);
    if (!group) {
      const cleanFolder = key.replace(/^\.\.\/\.\.\//, '').replace(/\/[^/]+$/, '');
      group = {
        canonicalBase,
        stableFileName: stableName,
        fileName: `${withoutExt}.md`,
        cleanFolder
      };
      groupMap.set(canonicalBase, group);
    }

    if (fileName.endsWith('.en.md')) {
      group.keyEn = key;
    } else if (fileName.endsWith('.zh.md')) {
      group.keyZh = key;
    } else {
      // Default file (original is in Chinese)
      group.defaultKey = key;
    }
  }

  // Convert to array and sort according to embeddedMeta order
  const sortedGroups = Array.from(groupMap.values());
  sortedGroups.sort((a, b) => {
    const orderA = embeddedMeta[a.canonicalBase]?.order ?? 999;
    const orderB = embeddedMeta[b.canonicalBase]?.order ?? 999;
    if (orderA !== orderB) return orderA - orderB;
    return a.stableFileName.localeCompare(b.stableFileName);
  });

  let embeddedIndex = 101;

  for (const group of sortedGroups) {
    // Embedded documents: original is Chinese, so defaultKey is Chinese
    const rawZh = (group.keyZh && markdownModules[group.keyZh]) || (group.defaultKey && markdownModules[group.defaultKey]) || '';
    const rawEn = (group.keyEn && markdownModules[group.keyEn]) || '';
    const rawDefault = rawZh || rawEn;

    const info = embeddedMeta[group.canonicalBase];

    const cleanTitle = group.stableFileName
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    const wordCount = rawDefault.split(/\s+/).filter(Boolean).length;
    const readTime = Math.max(3, Math.round(wordCount / 200));

    chapters.push({
      id: `embedded-${group.stableFileName}`,
      folderName: group.cleanFolder,
      fileName: group.fileName,
      number: embeddedIndex++,
      title: info?.titleEn || cleanTitle,
      titleZh: info?.titleZh || cleanTitle,
      volume: 0,
      category: 'embedded-systems',
      description:
        info?.descEn ||
        'In-depth embedded firmware, RTOS, and dual netif networking architecture design document.',
      descriptionZh:
        info?.descZh ||
        '深入剖析嵌入式实时操作系统 (RTOS)、固件协议栈与网络接口架构设计。',
      tags: info?.tagsEn || ['Embedded', 'RTOS', 'Firmware', 'STM32', 'Networking'],
      tagsZh: info?.tagsZh || ['嵌入式', 'RTOS', '固件', 'STM32', '网络栈'],
      markdown: rawDefault,
      markdownZh: rawZh,
      markdownEn: rawEn,
      estimatedReadTimeMinutes: readTime
    });
  }

  return chapters;
}

export const ALL_CHAPTERS = getChapters();
