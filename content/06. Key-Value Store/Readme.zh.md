# 第 6 章：设计键值存储

## 简介
**键值存储**是一种非关系数据库，其中数据存储为键值对。每个键都是唯一的，并且使用这些键来访问值。本章详细介绍了如何设计可扩展、高可用性的分布式键值存储，该存储支持以下操作：
- `put(key, value)` 用于插入数据。
- `get(key)` 用于检索数据。

### 设计特点
- 小键值对 (<10 KB).
- Supports big data with high availability and scalability.
- Automatic scaling and tunable consistency.
- Low latency.

---

## Single Server Key-Value Store
### Implementation
- Use a **hash table** to store key-value pairs in memory.
- Optimizations:
  - Data compression.
  - Storing less frequently accessed data on disk.

### Limitation
A single server's memory is limited, requiring a **distributed approach** for scalability.

---

## Distributed Key-Value Store
A **distributed key-value store** partitions data across multiple servers and must address trade-offs outlined by the **CAP theorem**.

### CAP Theorem
1. **Consistency:** All clients see the same data simultaneously.
2. **Availability:** The system responds to every request, even if some nodes are down.
3. **Partition Tolerance:** The system continues to operate despite network partitions.

**Trade-off:** According to CAP theorem only two of the three guarantees can be achieved.

<p align="center">
  <img src="./images/cap.png" alt="CAP" width="400">
</p>

#### 系统类型：
- **CP 系统：** 一致性和分区容错性，同时牺牲可用性（例如银行系统）。
- **AP 系统：** 可用性和分区容错性，同时牺牲一致性（例如，最终一致性）。
- **CA Systems：** 一致性和可用性，同时牺牲分区容错性。

**由于网络故障不可避免，分布式系统必须容忍网络分区。因此，CA 系统不能存在于现实世界的应用程序中。**

在分布式系统中，分区是不可避免的。当分区发生时，我们必须在一致性和可用性之间做出选择。例如，如果节点 n3 出现故障，
写入节点 n1 或 n2 的任何数据都无法传播到 n3。相反，如果数据已写入 n3 但尚未传播到 n1 和 n2，则节点 n1 和 n2 将具有陈旧数据。

    <p align="center">
    <img src="./images/server-down.png"  alt="Server down" width="400">
    </p>
    
- 如果我们选择CP系统，我们必须阻止所有对n1和n2的写操作，以避免数据不一致。
- 如果我们选择 AP 系统，系统会继续接受读取，即使它可能返回陈旧的数据。
对于写入，n1和n2继续接受写入，
当网络分区解决后，数据将同步到n3。

---

## 系统组件
### 1. 数据分区
- **技术：** 一致性哈希用于在多个服务器之间均匀分布数据。
- **优点：**
  - 通过添加/删除服务器自动扩展。
  - 通过虚拟节点实现异构性。服务器的虚拟节点数量与服务器容量成正比。

### 2. 数据复制
- 跨 `N` 服务器复制数据以实现高可用性。
- 从服务器位置开始顺时针选择N台服务器，选择环上的前N台服务器来存储数据副本。将副本放置在不同的数据中心，以提高虚拟节点情况下的可靠性。

    <p align="center">
    <img src="./images/data-replication.png" alt="Data replication" width="300">
    </p>

### 3、一致性
由于数据在多个节点上复制，因此必须跨副本同步。
- **法定人数共识：**
  - `N`：副本总数。
  - `W`：写入仲裁大小。为了使写入被视为成功，必须从 W 个副本确认写入。
  - `R`：读取仲裁大小。为了使读取被视为成功，读取必须等待至少 R 个副本的响应。
  - **规则：** `W + R > N` 确保强一致性。
  - W、R和N的配置是延迟和一致性之间的典型权衡。

    <p align="center">
    <img src="./images/quorum-consensus.png"   alt="Quorum consensus" width="400">
    </p>
    
    - 如果 R = 1 且 W = N，则系统针对快速读取进行了优化。
    - 如果 W = 1 且 R = N，则系统针对快速写入进行了优化。
    - 如果W+R>N，则保证强一致性（通常N=3，W=R=2）。
    - 如果 W + R <= N, strong consistency is not guaranteed.

- **Models**:
  - **Strong Consistency:** A read operation returns a value corresponding to the result of the most updated write data item.
  - **Weak Consistency:** Subsequent read operations may not see the most updated value.
  - **Eventual Consistency:** Given enough time, all updates are propagated, and all replicas are consisten


### 4. Inconsistency Resolution
Replication gives high availability but causes inconsistencies among replicas. Versioning and
vector locks are used to solve inconsistency problems.
- **Versioning:** 
    - Use **vector clocks** to track data versions and resolve conflicts.
    - Versioning means treating each data modification as a new immutable version of data.
        <div>
        <img src="./images/consistent-server.png"   alt="Consisten hashing" width="400">
        <img src="./images/inconsistent-server.png"   alt="Inconsistent server" height="230">
        </div>
    
    - 服务器 1 更改名称，服务器 2 也更改名称。这两个改变是同时进行的。现在，我们有冲突的值，称为版本 v1 和 v2。


- **矢量时钟**
    1. **设置**：矢量时钟是与数据项关联的[服务器，版本]对。它可以用来检查
如果一个版本先于其他版本、成功或与其他版本冲突。
        - 假设矢量时钟由 D([S1, v1], [S2, v2], …, [Sn, vn]) 表示，如果数据项 D 写入服务器
Si，系统必须执行以下任务之一。
        - 其中： `D` 是数据项。`Si` 是服务器标识符。`vi` 是服务器 `Si` 上数据的版本计数器。

    2. **更新矢量时钟：** 当数据项在服务器上修改时：
        - 如果矢量时钟中存在该服务器，则其版本计数器会递增。
        - 否则，将向矢量时钟添加新条目。

    3. **冲突检测：**
        - **无冲突：** 如果 X 中的所有计数器都小于或等于 Y 中的计数器，则版本 X 是版本 Y 的祖先。
        - **存在冲突：** 如果 Y 中至少有一个计数器小于 X 中的对应计数器，则两个版本是同级版本。

    4. **冲突解决：** 当检测到冲突（同级版本）时，系统依赖于应用程序特定的逻辑或客户端干预来协调数据。

        <p align="center">
        <img src="./images/vector-clock.png"  alt="Server hashing" width="500">
        </p>

- **挑战：**
  - 增加了客户的复杂性。
  - 矢量时钟大小可能会随着多次更新而增长，需要调整策略来限制其大小。


### 5. 处理失败

#### a.故障检测
仅仅因为另一台服务器这么说就相信一台服务器已关闭是不够的。通常，需要至少两个独立的信息源才能将一台服务器标记为关闭。
- **八卦协议：**
    <div style="margin-left:3rem">
        <img src="./images/gossip-protocol.png"  alt="Gossip protocol" width="600">
    </div>

    - 每个节点维护成员 ID 和心跳计数器。
    - 每个节点定期增加其心跳计数器。
    - 每个节点定期向一组随机节点发送心跳。
    - 如果心跳在超过预定义的时间内没有增加，则该成员
被视为离线



#### b.暂时故障
- **马虎仲裁：** 使用健康节点暂时维持运行。
        <p align="center">
        <img src="./images/sloppy-quorum.png"   alt="Sloppy Quorum" width="400">
        </p>

    - 检测到故障后，系统需要部署一定的机制来保证可用性
    - 系统不会强制执行仲裁要求，而是选择前 W 台健康服务器进行写入，并选择前 R 台服务器
用于在哈希环上读取的健康服务器。
    - 离线服务器将被忽略。如果一台服务器不可用，另一台服务器将临时处理请求


- **提示切换：** 离线服务器在恢复时赶上更改。
    - 当宕机的服务器上线时，更改将被推回以实现数据一致性

#### c.永久性故障
- 使用 **Merkle Trees** 实现副本之间的高效同步。
**Merkle Tree**（或哈希树）是一种数据结构，用于在永久故障期间有效检测和解决副本之间的不一致问题。

- 工作
    1. **结构：**
        - **叶节点**存储各个数据块的哈希值。
        - **非叶节点**存储其子节点的哈希值。
        - **根哈希**表示树中所有数据的组合状态。

    2. **构建默克尔树：**
        - **步骤1：** 将密钥空间划分为多个桶。
            
            <img src="./images/key-bucket.png"   alt="Key Bucket" width="500">

        - **步骤 2：** 使用统一哈希对存储桶中的每个键进行哈希。

            <img src="./images/hash-key-bucket.png"   alt="Hash Key Bucket" width="500">

        - **步骤 3：** 为每个存储桶创建一个哈希值。
        
            <img src="./images/hash-bucket.png"   alt="Hash Bucket" width="500">

        - **步骤 4：** 组合存储桶的哈希值来计算更高级别的哈希值，最终得到根哈希值。

            <img src="./images/merkel-tree.png"   alt="Merkel Tree" width="500">



    3. **同步：**
        - 要同步两个副本：
            - 比较它们的根哈希值。
            - 如果根哈希匹配，则副本是一致的。
            - 如果根哈希值不同，则递归比较子哈希值以识别不一致的存储桶。
        - 仅同步不一致的数据。

- 优点
    - **效率：**只同步不一致的数据，减少数据传输。
    - **可扩展性：** 对于大型数据集有效，同步开销最小。
    - **可靠性：** 确保副本之间的数据一致性。


### 6. 处理数据中心中断
- 跨多个数据中心复制数据以确保中断期间的可用性。

---

## 写入和读取路径
### 1.写入路径（基于Cassandra架构）

<div style="margin-left:3rem">
    <img src="./images/write-path.png"   alt="Hash Bucket" width="500">
</div>

- 将写入保留在**提交日志**中。
- 将数据保存到**内存缓存**。
- 当缓存已满时，将数据刷新到磁盘上的**SSTable**（排序字符串表）。

   

### 2. 读取路径
<div style="margin-left:3rem">
    <img src="./images/read-path.png"   alt="Hash Bucket" width="500">
    <img src="./images/read-path-without-cache.png"   alt="Hash Bucket" width="500">
</div>

- 检查**内存缓存**中的数据。
- 如果不存在，请使用 **布隆过滤器** 来定位 SSTable 中的数据。
- 检索并返回数据。


---

## 最终架构

<p align="center">
<img src="./images/final-architecture.png"   alt="Hash Bucket" width="500">
</p>


-  客户端通过简单的 API 与键值存储进行通信：get(key) 和 put(key,
值）。
- 协调器是充当客户端和键值存储之间的代理的节点。
- 使用一致性哈希将节点分布在环上。
- 该系统是完全去中心化的，因此可以自动添加和移动节点。
- 数据在多个节点上复制。
- 不存在单点故障，因为每个节点都有相同的职责。


