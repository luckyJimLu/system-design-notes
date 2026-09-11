# 第 13 章：设计搜索自动完成系统

## 简介
自动完成，也称为预先输入或增量搜索，当用户在搜索框中键入时向他们提供实时建议。系统必须根据历史查询数据高效地提供前 k 个相关且热门的建议。

### 主要特点
- 建议最多 **5 个自动完成结果**。
- 基于**查询流行度**（频率）。
- 仅支持**小写英文字符**。
- 快速响应时间 (<100 ms) and scalable.

---

## Step 1: Understanding the Problem

### Requirements
1. **Real-Time Suggestions:** Display relevant matches as the user types.
2. **Top-k Results:** Return up to 5 results sorted by popularity.
3. **Scalability:** Handle **10 million DAU** with a peak QPS of **48,000**.
4. **High Availability:** Handle failures without system downtime.
5. **Data Growth:** Support daily storage growth of **0.4 GB** for new query data.

---

## Step 2: High-Level Design
At the high-level, the system is broken down into two services:
1. **Data Gathering Service:** 
    - Collects user queries and aggregates them for frequency analysis in real-time.
    - Real-time processing is not practical for large data sets; however, it is a good starting point


2. **Query Service:** Provides the top-k suggestions based on the user’s input.

---

### Data Gathering Service
<div style="margin-left:3rem">
    <img src="./images/data-gathering.png" alt="Data Gathering" width="600">
</div>

- 聚合来自分析日志的查询数据并更新频率表。
- 每周处理历史数据以构建 **trie**（前缀树）。




### 查询服务
<div style="margin-left:3rem">
    <img src="./images/frequency-table.png" alt="Frequency Table" width="400">
    <img src="./images/basic-search-suggestions.png" alt="Search Suggestions" width="360">
</div>

- 使用数据收集服务中的频率表。
- 处理用户输入并使用 Trie 从频率表中检索前 k 个建议。
- 使用缓存和高效的数据结构优化快速查找。
- 例如，当用户在搜索框中键入“tw”时，将显示以下前 5 个搜索查询。


---

## 第 3 步：深入设计

### 特里树数据结构
**trie** 是一种树状数据结构，用于有效地存储和检索查询字符串。

#### 主要特点
1. **紧凑存储：** 分层表示前缀以最大程度地减少冗余。
2. **频率信息：**存储每个节点的查询的流行度。

4. **获取搜索次数最多的前 k 个查询的步骤**
   <div style="margin-left:3rem">
      <img src="./images/trie-structure.png" alt="Trie Structure" width="500">
   </div>

    - 查找前缀
    - 从前缀节点遍历子树以获取所有有效子节点
    - 对孩子进行排序并获得前 k 个


3. **优化：**
   - 在每个节点缓存 top-k 查询以加快检索速度并避免遍历整个 trie。

        <img src="./images/cached-trie.png" alt="Cached Trie" width="600">

   - 限制前缀长度以减少搜索空间，因为用户很少键入长搜索查询（例如 50）。

#### 特里树操作
1. **创建：**
    - 使用聚合查询数据每周构建一次。
    - 数据来源来自分析日志/DB。
2. **更新：**很少实时更新；每周更新替换旧数据。
3. **删除：**
      <div style="margin-left:3rem">
         <img src="./images/delete-kv.png" alt="Delete KV" width="500">
      </div>

    - 过滤器会删除不需要的或有害的建议（例如仇恨言论）。
    - 过滤层使我们能够灵活地根据不同的过滤规则删除结果。
    - 不需要的建议会从数据库中异步物理删除。
    

---

### 查询处理流程
1. **前缀搜索：**
   - 识别与用户输入对应的前缀节点。
   - 遍历子树以收集有效建议。
2. **前k排序：**
   - 在每个节点缓存 top-k 建议以最小化排序开销。
3. **响应构建：**
   - 使用缓存数据构建结果以实现快速响应。

---

### 优化
1. **每个节点的缓存：**
   - 存储 top-k 查询以避免冗余遍历。
2. **限制前缀长度：**
   - 将前缀长度限制为较小的值（例如 50 个字符）以加快查找速度。
3. **AJAX 请求：**
   - 使用轻量级异步请求进行实时响应。
4. **浏览器缓存：**
   - 将经常搜索的术语的自动完成结果保存在浏览器缓存中。

---

### 数据收集管道
在高层设计中，每当用户输入搜索查询时，数据就会实时更新。这种方法并不实用。
- 用户每天可能会输入数十亿次查询。在每个查询上更新 trie 是不可行的。
- 顶级建议可能不会对构建的特里树产生太大影响。


#### 更新设计

<div style="margin-left:3rem">
   <img src="./images/data-gathering-flow.png" alt="Updated Data Gathering Flow" width="600">
</div>

1. **分析日志：**
   - 将原始查询数据存储为日志以进行每周聚合。
   - 日志只能追加且未建立索引
2. **聚合器：**
   - 将日志处理成频率表，适合 trie 构建。
   - 对于 Twitter 等实时应用程序，可以在较短的时间间隔内聚合数据。
   - 对于其他情况，聚合数据的频率较低，例如每周一次就足够了。
3. **工人：**
   - 异步服务器重建特里树并将其存储在持久存储中。
4. **存储选项：**
    - **Trie Cache**：Trie Cache 是一个分布式缓存系统，它将 trie 保存在内存中以便快速读取。
    - **特里数据库**
        1. **文档存储（例如MongoDB）**：由于每周都会构建一个新的trie，因此我们可以定期对其进行快照，序列化，并将序列化的数据存储在数据库中，如MongoDB
        2. **键值存储：**
            - 将前缀映射到节点数据以实现快速访问。
            - trie 中的每个前缀都映射到哈希表中的一个键。
            - 每个 trie 节点上的数据都映射到哈希表中的一个值。

                <img src="./images/trie-db.png" alt="Trie DB" width="600">
---

### 可扩展性
1. **分片：**
   - 根据前缀范围（例如，`a-m`、`n-z`）在服务器之间分布 trie 节点。
   - 在前缀内进一步分片以平衡不均匀分布（例如，`aa-ag`、`ah-an`）。
2. **负载平衡：**
   <div style="margin-left:3rem">
      <img src="./images/sharding.png" alt="Sharding" width="400">
   </div>

   - 使用分片映射管理器将请求路由到适当的服务器。


---

## 第 4 步：高级功能

### 多语言支持
1. **Unicode 字符：** 使用 Unicode 支持非英语语言。
2. **特定国家/地区的尝试：** 为不同的国家或地区构建单独的尝试。

### 热门查询
- 通过动态更新 trie 节点或更重视最近查询的权重来处理实时事件。

