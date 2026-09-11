# 第 24 章：类 S3 对象存储

## 简介

在本章中，我们将设计一个**对象存储**服务，类似于**Amazon S3**。

存储系统分为三大类：
- **块存储**
- **文件存储**
- **对象存储**

**块存储**是 20 世纪 60 年代出现的设备。 HDD 和 SSD 就是这样的例子。
这些设备通常物理连接到服务器，尽管它们也可以通过高速网络协议连接到网络。
服务器可以格式化原始块并将它们用作文件系统，也可以直接将它们的控制权交给服务器。

**文件存储**构建在块存储之上。它提供了更高级别的抽象，使管理文件夹和文件变得更加容易。

**对象存储**牺牲性能来获得高耐用性、大规模和低成本。
它针对“冷”数据，主要用于归档和备份。
没有分层目录结构，所有数据都作为对象存储在平面结构中。
与其他存储类型相比，它相对较慢。大多数云提供商都提供对象存储产品 - Amazon S3、Google GCS 等。

<div style="margin-left:3rem">
    <img src="./images/storage-comparison.png" alt="storage-comparison" width="500" />
</div>

|                 | 块存储 | 文件存储 | 对象存储 |
|-----------------|----------------------------------|-----------------------------------------|--------------------------------|
| 可变内容 | 是 | 是 | N（有对象版本控制） |
| 成本 | 高 | 中到高 | 低 |
| 性能 | 中到高、非常高 | 中到高 | 低到中 |
| 一致性 | 一致性强 | 一致性强 | 强一致性[5] |
| 数据存取 | SAS/iSCSI/FC | 标准文件访问、CIFS/SMB 和 NFS | RESTful API |
| 可扩展性 | 中等可扩展性 | 高扩展性 | 巨大的可扩展性 |
| 适合 | 虚拟机 (VM)、数据库 | 通用文件系统访问 | 二进制数据、非结构化数据 |

与对象存储相关的一些术语：
- **桶** - 对象的逻辑容器。名称是全球唯一的。
- **对象** - 存储在存储桶中的单个数据。包含对象数据和元数据。
- **版本控制** - 将对象的多个变体保留在同一存储桶中的功能。
- **统一资源标识符 (URI)** - 每个资源都由 URI 唯一标识。
- **服务级别协议 (SLA)** - 服务提供商和客户之间的合同。

Amazon S3 标准-不频繁访问存储类 SLA：
- 跨多个可用区的持久性达 99.999999999%
- 在整个可用区被破坏的情况下，数据具有弹性
- 专为 99.9% 的可用性而设计

---

## 第 1 步：了解问题并确定设计范围

- C：应该包括哪些功能？
- I：创建存储桶、上传/下载对象、版本控制、列出存储桶中的对象
- C：典型的数据大小是多少？
- I：我们需要高效地存储大物体和小物体
- C：我们一年存储多少数据？
- 我：100 PB
- C：我们可以假设 6 个 9 的数据耐用性 (99.9999%) 和 4 个 9 的服务可用性 (99.99%) 吗？
- 我：是的，听起来很有道理

### **非功能性需求**

- **100 PB 数据**
- **6 个九的数据持久性**
- ** 4 个九的服务可用性**
- 存储效率。降低存储成本，同时保持高可靠性和性能

### **粗略估计**

对象存储可能在磁盘容量或每秒 IO (IOPS) 方面存在瓶颈。

假设：
- 我们有 20% 小型（小于 1mb）、60% 中型（1-64mb）和 20% 大型对象（大于 64mb），
- 一个硬盘（SATA，7200rpm）每秒能够执行 100-150 次随机查找 (100-150 IOPS)

根据这些假设，我们可以估计系统可以持久存在的对象总数。
- 让我们使用每个对象类型的中值大小来简化计算 - 小型对象为 0.5mb，中型对象为 32mb，大型对象为 200mb。
- 给定 100PB 的存储 (10^11 MB) 和 40% 的存储使用率会产生 06.8 亿个对象
- 如果我们假设元数据为 1kb，那么我们需要 0.68tb 空间来存储元数据信息

---

## 第 2 步：提出高级设计并获得认可

在深入设计之前，让我们先探讨一下对象存储的一些有趣的属性：
- **对象不可变性** - 对象存储中的对象是不可变的（其他存储系统中则不然）。我们可能会删除它们或替换它们，但不会更新。
- **键值存储** - 对象 URI 是它的键，我们可以通过 HTTP 调用获取它的内容
- **一次写入，多次读取** - 数据访问模式是一次写入，多次读取。根据 Linkedin 的一些研究，95% 的操作都是读取
- 支持小型和大型对象

对象存储的设计理念与UNIX类似——当我们保存文件时，它会在称为inode的数据结构中创建文件名，并且文件数据存储在不同的磁盘位置。
索引节点包含文件块指针列表，这些指针指向磁盘上的不同位置。

访问文件时，我们首先从索引节点获取其元数据，然后再获取文件内容。

对象存储的工作原理类似 - 元数据存储用于文件信息，但内容存储在磁盘上：

<div style="margin-left:3rem">
    <img src="./images/object-store-vs-unix.png" alt="object-store-vs-unix" width="500" />
</div>

通过将元数据与文件内容分离，我们可以独立扩展不同的存储：

<div style="margin-left:3rem">
    <img src="./images/bucket-and-object.png" alt="bucket-and-object" width="500" />
</div>

### **高层设计**

<div style="margin-left:3rem">
    <img src="./images/high-level-design.png" alt="high-level-design" width="500" />
</div>

- **负载均衡器** - 跨服务副本分发 API 请求
- **API 服务** - 无状态服务器，编排对元数据和对象存储以及 IAM 服务的调用。
- **身份和访问管理 (IAM)** - 身份验证、授权、访问控制的中心位置。
- **数据存储** - 存储和检索实际数据。操作基于对象 ID (UUID)。
- **元数据存储** - 存储对象元数据

### **上传对象**

<div style="margin-left:3rem">
    <img src="./images/uploading-object.png" alt="uploading-object" width="500" />
</div>

- 通过 HTTP PUT 请求创建名为“bucket-to-share”的存储桶
- API服务调用IAM以确保用户已获得授权并具有写入权限
- API 服务调用元数据存储来创建存储桶条目。创建完成后，返回成功响应。
- 创建存储桶后，发送 HTTP PUT 以创建名为“script.txt”的对象
- API服务验证用户身份并确保用户具有写入权限
- 一旦验证通过，对象负载就会通过 HTTP PUT 发送到数据存储。数据存储将其保留并返回 UUID。
- API 服务调用元数据存储以使用 object_id、bucket_id 和 Bucket_name 以及其他元数据创建新条目。

对象上传请求示例：


```
PUT /bucket-to-share/script.txt HTTP/1.1
Host: foo.s3example.org
Date: Sun, 12 Sept 2021 17:51:00 GMT
Authorization: authorization string
Content-Type: text/plain
Content-Length: 4567
x-amz-meta-author: Alex

[4567 bytes of object data]
```


### **下载对象**

存储桶没有目录层次结构，我们可以通过连接存储桶名称和对象名称来创建逻辑层次结构来模拟文件夹结构。

用于获取对象的 GET 请求示例：


```
GET /bucket-to-share/script.txt HTTP/1.1
Host: foo.s3example.org
Date: Sun, 12 Sept 2021 18:30:01 GMT
Authorization: authorization string
```


<div style="margin-left:3rem">
    <img src="./images/download-object.png" alt="download-object" width="500" />
</div>

- 客户端向负载均衡器发送 HTTP GET 请求，即 `GET /bucket-to-share/script.txt`
- API 服务查询 IAM 以验证用户是否具有读取存储桶的正确权限
- 验证后，将从元数据存储中检索对象的 UUID
- 根据 UUID 从数据存储中检索对象负载并将其返回给客户端

---

// 冲刺1

## 第 3 步：深入设计

### **数据存储**

以下是 API 服务与数据存储交互的方式：

<div style="margin-left:3rem">
    <img src="./images/data-store-interactions.png" alt="data-store-interactions" width="500" />
</div>

数据存储的主要组件：

<div style="margin-left:3rem">
    <img src="./images/data-store-main-components.png" alt="data-store-main-components" width="500" />
</div>

数据路由服务提供RESTful或gRPC API来访问数据节点集群。
它是一种无状态服务，可通过添加更多服务器进行扩展。

其主要职责是：
- 查询放置服务以获得存储数据的最佳数据节点
- 从数据节点读取数据并返回给API服务
- 将数据写入数据节点

放置服务确定哪些数据节点应该存储对象。
它维护一个虚拟集群映射，该映射确定集群的物理拓扑。

<div style="margin-left:3rem">
    <img src="./images/virtual-cluster-map.png" alt="virtual-cluster-map" width="500" />
</div>

该服务还会向所有数据节点发送心跳，以确定是否应将它们从虚拟集群中删除。

由于这是一项关键服务，建议维护一个由 5 或 7 个副本组成的集群，通过 Paxos 或 Raft 共识算法进行同步。
例如，7 个节点的集群可以容忍 3 个节点发生故障。

数据节点存储实际的对象数据。
通过将数据复制到多个数据节点来保证可靠性和持久性。

每个数据节点都有一个正在运行的守护进程，该守护进程向放置服务发送心跳。

心跳包括：
- 数据节点管理多少个磁盘驱动器（HDD 或 SSD）？
- 每个驱动器上存储了多少数据？

#### 数据持久化流程

<div style="margin-left:3rem">
    <img src="./images/data-persistence-flow.png" alt="data-persistence-flow" width="500" />
</div>

- API服务将对象数据转发到数据存储
- 数据路由服务将数据发送到主数据节点
- 主数据节点将数据保存在本地，并复制到两个辅助数据节点。复制成功后发送响应。
- 对象的 UUID 返回给 API 服务。

注意事项：
- 给定一个对象 UUID，它的复制组是通过使用一致散列确定性地选择的
- 在步骤4中，主数据节点在返回响应之前复制对象数据。这有利于强一致性而不是较高的延迟。

<div style="margin-left:3rem">
    <img src="./images/consistency-vs-latency.png" alt="consistency-vs-latency" width="500" />
</div>

#### 数据是如何组织的

管理数据的一种简单方法是将每个对象存储在单独的文件中。

这可以工作，但对于文件系统中的许多小文件来说性能不佳：
- HDD 上的数据块被浪费了，因为每个文件都使用整个块大小。典型的块大小为 4kb。
- 许多文件意味着许多 inode。操作系统不能很好地处理太多的索引节点，并且还有最大索引节点限制。

这些问题可以通过预写日志 (WAL) 将许多小文件合并为大文件来解决。一旦文件达到其容量（通常为几 GB），就会创建一个新文件：

<div style="margin-left:3rem">
    <img src="./images/wal-optimization.png" alt="wal-optimization" width="500" />
</div>

这种方法的缺点是对文件的写访问需要序列化。多个核心访问同一文件必须相互等待。
为了解决这个问题，我们可以将文件限制到特定的核心，以避免锁争用。

#### 对象查找

为了支持在同一个文件中存储多个对象，我们需要维护一个表，它告诉数据节点：
- ZZ代码1ZZ
- `filename` 存储对象的位置
- `file_offset` 对象开始位置
- ZZ代码4ZZ

我们可以将该表部署在基于文件的数据库（如 RocksDB）或传统的关系数据库中。
由于访问模式是低写+高读，所以关系数据库工作得更好。

我们应该如何部署呢？
我们可以在集群中部署数据库并单独扩展它，由所有数据节点访问。

缺点：
- 我们需要积极扩展集群来满足所有请求
- 数据节点和数据库集群之间存在额外的网络延迟

另一种方法是利用数据节点只对与其相关的数据感兴趣的事实，
因此我们可以在数据节点本身内部署关系数据库。

SQLite 是一个不错的选择，因为它是一个轻量级的基于文件的关系数据库。

#### 更新了数据持久化流程

<div style="margin-left:3rem">
    <img src="./images/updated-data-persistence-flow.png" alt="updated-data-persistence-flow" width="500" />
</div>

- API服务发送请求以保存新对象
- 数据节点服务将新对象附加到文件末尾，名为“/data/c”
- 对象的新记录被插入到对象映射表中

#### 耐用性

数据持久性是我们设计中的一个重要要求。为了实现 6 个 9 的耐用性，需要正确检查每个故障案例。

首先要解决的问题是硬件故障。我们可以通过复制数据节点来最小化故障概率来实现这一点。
但除此之外，我们还应该跨不同的故障域（跨机架、跨 DC、单独的网络等）进行复制。
一个关键事件可能会导致同一域内的多个硬件故障：

<div style="margin-left:3rem">
    <img src="./images/failure-domain-isolation.png" alt="failure-domain-isolation" width="500" />
</div>

假设典型 HDD 的年故障率为 0.81%，制作三份副本即可获得 6 个 9 的耐用性。

像这样复制数据节点可以为我们提供所需的持久性，但我们也可以利用纠删码来降低存储成本。

纠删码使我们能够使用奇偶校验位，这使我们能够在发生故障时重建丢失的位：

<div style="margin-left:3rem">
    <img src="./images/erasure-coding.png" alt="erasure-coding" width="500" />
</div>

想象这些位是数据节点。如果其中两个出现故障，可以使用剩余的四个来恢复它们。

有不同的纠删码方案。在我们的例子中，我们可以使用 8+4 纠删码，分为不同的故障域以最大限度地提高可靠性：

<div style="margin-left:3rem">
    <img src="./images/erasure-coding-across-failure-domains.png" alt="erasure-coding-across-failure-domains" width="500" />
</div>

由于数据路由服务必须从多个位置收集数据，纠删码使我们能够以牺牲访问速度为代价实现更低的存储成本（提高 50%）：

<div style="margin-left:3rem">
    <img src="./images/erasure-coding-vs-replication.png" alt="erasure-coding-vs-replication" width="500" />
</div>

其他注意事项：
- 复制需要 200% 的存储开销（在 3 个副本的情况下），而通过纠删码则需要 50%
- 擦除编码[为我们提供了 11 个 9 的耐用性](https://github.com/Backblaze/erasure-coding-durability) vs 通过复制获得 6 个 9
- 纠删码需要更多的计算来计算和存储奇偶校验

总之，复制对于延迟敏感的应用程序更有用，而纠删码对于存储成本效率和持久性而言很有吸引力。
纠删码也更难实现。

#### 正确性验证

如果磁盘完全发生故障，则很容易检测到该故障。如果部分磁盘内存损坏，这就不那么简单了。

为了检测这一点，我们可以使用校验和 - 文件内容的哈希值，可用于验证文件的完整性。

在我们的例子中，我们将存储每个文件和每个对象的校验和：

<div style="margin-left:3rem">
    <img src="./images/checksums-for-correctness.png" alt="checksums-for-correctness" width="500" />
</div>

对于纠删码 (8+4)，我们需要分别获取 8 条数据并验证它们的校验和。

// 冲刺2

### **元数据数据模型**

表模式：

<div style="margin-left:3rem">
    <img src="./images/metadata-data-model.png" alt="metadata-data-model" width="500" />
</div>

我们需要支持的查询：
- 按名称查找对象 ID
- 根据名称插入/删除对象
- 列出存储桶中具有相同前缀的对象

用户可以创建的存储桶的数量通常是有限的，因此存储桶表的大小很小并且可以容纳在单个数据库服务器中。
但我们仍然需要扩展服务器的读取吞吐量。

不过，对象表可能不适合单个数据库服务器。因此，我们可以通过分片来扩展表：
- 按bucket_id分片会导致热点问题，因为一个bucket可以有数十亿个对象
- 按bucket_id分片使负载分布更均匀，但我们的查询会很慢
- 我们选择按 `hash(bucket_name, object_name)` 分片，因为大多数查询都是基于对象/桶名称。

然而，即使采用这种分片方案，列出存储桶中的对象也会很慢。

### **列出存储桶中的对象**

在单个数据库中，根据前缀列出对象（看起来像目录）的工作方式如下：


```
SELECT * FROM object WHERE bucket_id = "123" AND object_name LIKE `abc/%`
```


当数据库被分片时，这很难实现。为了实现这一点，我们可以在每个分片上运行查询并将结果聚合在内存中。
但这使得分页具有挑战性，因为不同的分片包含不同的结果大小，并且我们需要为每个分片维护单独的限制/偏移量。

我们可以利用这样一个事实：通常对象存储并未针对列出对象进行优化，因此我们可以牺牲列出性能。
我们还可以创建一个非规范化表来列出对象，并按存储桶 ID 进行分片。
这将使我们的列表查询足够快，因为它被隔离到单个数据库实例。

### **对象版本控制**

版本控制通过另一个 TIMEUUID 类型的 `object_version` 列来工作，使我们能够基于它对记录进行排序。

每个新版本都会产生一个新的 `object_id`：

<div style="margin-left:3rem">
    <img src="./images/object-versioning.png" alt="object-versioning" width="500" />
</div>

删除对象会创建一个带有特殊 `object_id` 的新版本，指示该对象已被删除。对它的查询返回 404：

<div style="margin-left:3rem">
    <img src="./images/deleting-versioned-object.png" alt="deleting-versioned-object" width="500" />
</div>

### **优化大文件上传**

上传大文件可以通过使用分段上传来优化 - 将一个大文件分成几个块，独立上传：

<div style="margin-left:3rem">
    <img src="./images/multipart-upload.png" alt="multipart-upload" width="500" />
</div>

- 客户端调用服务发起分段上传
- 数据存储返回唯一标识上传的上传 ID
- 客户端将大文件分割成几个块，使用upload id独立上传
- 当上传一个块时，数据存储会返回一个 etag，它是一个 md5 校验和，用于标识该上传块
- 所有分片上传完毕后，客户端发送完整的分片上传请求，其中包括upload_id、分片编号和所有etag
- 数据存储从对象的各个部分重新组装对象。该过程可能需要几分钟的时间。之后，将成功响应返回给客户端。

此时可以移除不再有用的旧部件。我们可以引入垃圾收集器来处理它。

### **垃圾收集**

垃圾收集是回收不再使用的存储空间的过程。数据变成垃圾有以下几种方式：
- **延迟对象删除** - 对象被标记为已删除，但实际上并未被删除
- **孤立数据** - 例如上传失败，需要删除旧部分
- **损坏的数据** - 校验和验证失败的数据

垃圾收集器还负责回收副本中未使用的空间。
通过复制，数据将从主数据库和副本数据库中删除。使用纠删码（8+4），数据从所有 12 个节点中删除。

为了方便删除，我们将使用一个称为压缩的过程：
- 垃圾收集器将未删除的对象从“data/b”复制到“data/d”
- 复制完成后，使用数据库事务更新 `object_mapping` 表
- 为了避免生成太多小文件，会对增长超过特定阈值的文件进行压缩

<div style="margin-left:3rem">
    <img src="./images/compaction.png" alt="compaction" width="500" />
</div>

---

## 第四步：总结

我们涵盖的内容：
- 设计类似 S3 的对象存储
- 比较对象、块和文件存储之间的差异
- 涵盖存储桶中对象的上传、下载、列出、版本控制
- 深入设计 - 数据存储和元数据存储、复制和纠删码、分段上传、分片
