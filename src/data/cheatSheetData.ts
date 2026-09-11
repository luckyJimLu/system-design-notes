export interface LatencyItem {
  operation: string;
  time: string;
  timeNs: number;
  notes?: string;
}

export interface PowerOfTwoItem {
  power: string;
  exact: string;
  approx: string;
}

export interface AvailabilityItem {
  availability: string;
  downtimePerDay: string;
  downtimePerYear: string;
}

export const LATENCY_NUMBERS: LatencyItem[] = [
  { operation: 'L1 cache reference', time: '0.5 ns', timeNs: 0.5, notes: 'Fastest CPU cache' },
  { operation: 'Branch mispredict', time: '5 ns', timeNs: 5 },
  { operation: 'L2 cache reference', time: '7 ns', timeNs: 7, notes: '14x L1 cache' },
  { operation: 'Mutex lock/unlock', time: '17 ns', timeNs: 17 },
  { operation: 'Main memory reference', time: '100 ns', timeNs: 100, notes: '20x L2 cache, 200x L1' },
  { operation: 'Compress 1KB with Zippy', time: '2,000 ns (2 µs)', timeNs: 2000 },
  { operation: 'Send 1 KB over 1 Gbps network', time: '10,000 ns (10 µs)', timeNs: 10000 },
  { operation: 'Read 4 KB randomly from SSD', time: '16,000 ns (16 µs)', timeNs: 16000, notes: 'Fast random read' },
  { operation: 'Read 1 MB sequentially from memory', time: '3,000 ns (3 µs)', timeNs: 3000 },
  { operation: 'Round trip within same datacenter', time: '500,000 ns (0.5 ms)', timeNs: 500000 },
  { operation: 'Read 1 MB sequentially from SSD', time: '1,000,000 ns (1 ms)', timeNs: 1000000, notes: '1GB/sec SSD' },
  { operation: 'Disk seek (magnetic HDD)', time: '2,000,000 ns (2 ms)', timeNs: 2000000, notes: 'Mechanical latency' },
  { operation: 'Read 1 MB sequentially from HDD', time: '20,000,000 ns (20 ms)', timeNs: 20000000 },
  { operation: 'Packet roundtrip CA to Netherlands', time: '150,000,000 ns (150 ms)', timeNs: 150000000, notes: 'Cross-Atlantic speed of light' },
];

export const POWER_OF_TWO: PowerOfTwoItem[] = [
  { power: '2^10', exact: '1,024', approx: '1 Thousand (1 KB - Kilobyte)' },
  { power: '2^20', exact: '1,048,576', approx: '1 Million (1 MB - Megabyte)' },
  { power: '2^30', exact: '1,073,741,824', approx: '1 Billion (1 GB - Gigabyte)' },
  { power: '2^40', exact: '1,099,511,627,776', approx: '1 Trillion (1 TB - Terabyte)' },
  { power: '2^50', exact: '1,125,899,906,842,624', approx: '1 Quadrillion (1 PB - Petabyte)' },
];

export const AVAILABILITY_LEVELS: AvailabilityItem[] = [
  { availability: '99% (Two 9s)', downtimePerDay: '14.4 minutes', downtimePerYear: '3.65 days' },
  { availability: '99.9% (Three 9s)', downtimePerDay: '1.44 minutes', downtimePerYear: '8.77 hours' },
  { availability: '99.99% (Four 9s)', downtimePerDay: '8.64 seconds', downtimePerYear: '52.6 minutes' },
  { availability: '99.999% (Five 9s)', downtimePerDay: '864 milliseconds', downtimePerYear: '5.26 minutes' },
  { availability: '99.9999% (Six 9s)', downtimePerDay: '86.4 milliseconds', downtimePerYear: '31.5 seconds' },
];

export const FOUR_STEP_FRAMEWORK = [
  {
    step: 1,
    title: 'Understand the Problem and Establish Design Scope',
    duration: '3 - 10 minutes',
    focus: 'Ask clarifying questions. Understand user requirements, traffic volume, latency expectations, mobile vs web, and core non-functional requirements.'
  },
  {
    step: 2,
    title: 'Propose High-Level Design and Get Buy-in',
    duration: '10 - 15 minutes',
    focus: 'Draw high-level block diagram (Clients, Load Balancer, Web Servers, Database, Cache, CDN). Walk through common use cases with the interviewer.'
  },
  {
    step: 3,
    title: 'Design Deep Dive',
    duration: '10 - 25 minutes',
    focus: 'Investigate 2-3 core bottlenecks or interviewer-specified components (e.g. data schema, cache consistency, replication, sharding, fault tolerance).'
  },
  {
    step: 4,
    title: 'Wrap Up and Discuss Bottlenecks',
    duration: '3 - 5 minutes',
    focus: 'Summarize the architecture, point out failure scenarios (e.g. server crash, network partition), operational metrics, and future scaling steps.'
  }
];
