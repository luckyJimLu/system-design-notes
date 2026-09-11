export interface ExternalResource {
  topic: string;
  title: string;
  url: string;
  type: 'paper' | 'blog' | 'video' | 'code';
  publisher: string;
  summary: string;
}

export const ADDITIONAL_RESOURCES: ExternalResource[] = [
  {
    topic: 'Rate Limiting',
    title: 'Circuit Breaker Algorithm',
    url: 'https://martinfowler.com/bliki/CircuitBreaker.html',
    type: 'blog',
    publisher: 'Martin Fowler',
    summary: 'The classic pattern for preventing cascading failures in distributed networks.'
  },
  {
    topic: 'Rate Limiting',
    title: 'Uber Leaky Bucket Rate Limiter',
    url: 'https://github.com/uber-go/ratelimit/blob/master/ratelimit.go',
    type: 'code',
    publisher: 'Uber Open Source',
    summary: 'Uber implementation of an efficient leaky-bucket rate limiter in Go.'
  },
  {
    topic: 'Consistent Hashing',
    title: 'Consistent Hashing and Random Trees',
    url: 'https://tom-e-white.com/2007/11/consistent-hashing.html',
    type: 'blog',
    publisher: 'Tom White',
    summary: 'Explanation of Karger et al. consistent hashing algorithm and hash ring properties.'
  },
  {
    topic: 'Consistent Hashing',
    title: 'Stanford CS168: Introduction to Consistent Hashing',
    url: 'http://theory.stanford.edu/~tim/s16/l/l1.pdf',
    type: 'paper',
    publisher: 'Stanford University (Tim Roughgarden)',
    summary: 'Theoretical foundations and formal mathematical analysis of consistent hashing.'
  },
  {
    topic: 'Consistent Hashing',
    title: 'Cassandra: A Decentralized Structured Storage System',
    url: 'http://www.cs.cornell.edu/Projects/ladis2009/papers/Lakshman-ladis2009.PDF',
    type: 'paper',
    publisher: 'Facebook / Cornell (Avinash Lakshman, Prashant Malik)',
    summary: 'The original Facebook Cassandra paper combining Dynamo hash rings and BigTable LSM trees.'
  },
  {
    topic: 'Consistent Hashing',
    title: 'How Discord Scaled Elixir to 5,000,000 Concurrent Users',
    url: 'https://blog.discord.com/scaling-elixir-f9b8e1e7c29b',
    type: 'blog',
    publisher: 'Discord Engineering',
    summary: 'Using consistent hash rings to distribute connected users across Erlang/Elixir nodes.'
  },
  {
    topic: 'Consistent Hashing',
    title: 'Maglev: A Fast and Reliable Software Network Load Balancer',
    url: 'https://static.googleusercontent.com/media/research.google.com/en//pubs/archive/44824.pdf',
    type: 'paper',
    publisher: 'Google Research',
    summary: 'Google high-throughput software load balancer using lookup-table consistent hashing.'
  },
  {
    topic: 'Key-Value Store',
    title: 'Dynamo: Amazon’s Highly Available Key-value Store',
    url: 'https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf',
    type: 'paper',
    publisher: 'Amazon SOSP Paper (Werner Vogels et al.)',
    summary: 'Seminal paper introducing sloppy quorums, vector clocks, gossip, and Merkle trees.'
  },
  {
    topic: 'Key-Value Store',
    title: 'Bigtable: A Distributed Storage System for Structured Data',
    url: 'https://static.googleusercontent.com/media/research.google.com/en//archive/bigtable-osdi06.pdf',
    type: 'paper',
    publisher: 'Google Research (Chang et al.)',
    summary: 'Google distributed storage system using SSTables and MemTables (LSM architecture).'
  },
  {
    topic: 'Unique-ID Generator',
    title: 'Ticket Servers: Distributed Unique Primary Keys on the Cheap',
    url: 'https://code.flickr.net/2010/02/08/ticket-servers-distributed-unique-primary-keys-on-the-cheap',
    type: 'blog',
    publisher: 'Flickr Engineering',
    summary: 'How Flickr scaled unique 64-bit ID generation using MySQL auto-increment ticket servers.'
  },
  {
    topic: 'Unique-ID Generator',
    title: 'Announcing Snowflake: Real-Time Unique ID Generation',
    url: 'https://blog.twitter.com/engineering/en_us/a/2010/announcing-snowflake.html',
    type: 'blog',
    publisher: 'Twitter Engineering',
    summary: 'Twitter 64-bit snowflake ID format composing millisecond timestamp, worker ID, and sequence.'
  },
  {
    topic: 'Web Crawler',
    title: 'Web Crawling Survey',
    url: 'http://infolab.stanford.edu/~olston/publications/crawling_survey.pdf',
    type: 'paper',
    publisher: 'Stanford InfoLab (Christopher Olston, Marc Najork)',
    summary: 'Comprehensive survey on web crawling architectures, politeness, and duplicate detection.'
  },
  {
    topic: 'Chat Systems',
    title: 'How Discord Stores Billions of Messages',
    url: 'https://discord.com/blog/how-discord-stores-billions-of-messages',
    type: 'blog',
    publisher: 'Discord Engineering',
    summary: 'Discord migration from MongoDB to Apache Cassandra and ScyllaDB for billions of messages.'
  },
  {
    topic: 'Chat Systems',
    title: 'Flannel: An Application-Level Edge Cache to Make Slack Scale',
    url: 'https://slack.engineering/flannel-an-application-level-edge-cache-to-make-slack-scale/',
    type: 'blog',
    publisher: 'Slack Engineering',
    summary: 'Slack architecture for caching user presence and channel state at edge data centers.'
  },
  {
    topic: 'Search Autocomplete',
    title: 'Prefixy: A Scalable Prefix Search Service for Autocomplete',
    url: 'https://medium.com/@prefixyteam/how-we-built-prefixy-a-scalable-prefix-search-service-for-powering-autocomplete-c20f98e2eff1',
    type: 'blog',
    publisher: 'Prefixy Team',
    summary: 'Distributed Trie and Redis-backed typeahead search architecture.'
  },
  {
    topic: 'YouTube & Video',
    title: 'Transcoding Videos at Scale with DAG Workflows',
    url: 'https://www.egnyte.com/blog/2018/12/transcoding-how-we-serve-videos-at-scale/',
    type: 'blog',
    publisher: 'Egnyte Blog',
    summary: 'Splitting large videos into chunks and using Directed Acyclic Graphs (DAG) for parallel transcoding.'
  },
  {
    topic: 'YouTube & Video',
    title: 'Netflix Video Encoding at Scale: Dynamic Optimization',
    url: 'https://netflixtechblog.com/high-quality-video-encoding-at-scale-d159db052746',
    type: 'blog',
    publisher: 'Netflix Technology Blog',
    summary: 'Per-title and per-shot encoding pipelines at Netflix delivering maximum video quality with reduced bandwidth.'
  },
  {
    topic: 'Google Drive & File Sync',
    title: 'Differential Synchronization',
    url: 'https://neil.fraser.name/writing/sync/',
    type: 'paper',
    publisher: 'Neil Fraser (Google)',
    summary: 'Mathematical algorithm for real-time peer-to-peer differential synchronization of documents.'
  },
  {
    topic: 'Google Drive & File Sync',
    title: 'How We’ve Scaled Dropbox',
    url: 'https://www.youtube.com/watch?v=PE4gwstWhmc',
    type: 'video',
    publisher: 'Dropbox Engineering',
    summary: 'Architecture of Dropbox sync engine, block storage, and metadata server scalability.'
  }
];
