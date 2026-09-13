# 第25章：实时游戏排行榜

## 简介

我们将为一款在线手机游戏设计一个**排行榜**：

<div style="margin-left:3rem">
    <img src="./images/leaderboard.png" alt="leaderboard" width="500" />
</div>

---

## 第 1 步：了解问题并确定设计范围

- C：排行榜的分数是如何计算的？
- I：用户每次赢得比赛都会获得积分。
- C：所有玩家都包含在排行榜中吗？
- 我：是的
- C：排行榜有时间段吗？
- I：每个月，都会有一场新的锦标赛开始，并开始一个新的排行榜。
- C：我们可以假设我们只关心前 10 位用户吗？
- I：我们想要显示前 10 位用户，以及特定用户的位置。如果时间允许，我们可以讨论在排行榜中向用户展示特定用户的情况。
- C：一场锦标赛中有多少用户？
- I：500 万日活跃用户和 2500 万月活跃用户
- C：一场比赛平均进行多少场比赛？
- I：每个球员平均每天打10场比赛
- C：如果两名选手得分相同，如何确定名次？
- I：这样的话他们的等级是一样的。如果时间允许，我们可以讨论断绝关系。
- C：排行榜需要实时吗？
- I：是的，我们希望呈现实时结果或者尽可能接近实时的结果。不能呈现批量结果历史记录。

### **功能要求**

- 在排行榜上显示前 10 名玩家
- 显示用户的具体排名
- 显示高于和低于给定用户四位的用户（奖励）

### **非功能性需求**

- 分数实时更新
- 分数更新实时反映在排行榜上
- 一般可扩展性、可用性、可靠性

### **粗略估计**

有了 5000 万 DAU，如果游戏在 24 小时内玩家分布均匀，我们平均每秒就有 50 个用户。
然而，由于分布通常不均匀，我们可以估计峰值在线用户数为每秒 250 个用户。

用户得分的 QPS - 平均每天 10 场游戏，50 个用户/秒 * 10 = 500 QPS。峰值 QPS = 2500。

获取前 10 名排行榜的 QPS - 假设用户平均每天打开一次，QPS 为 50。

---

## 第 2 步：提出高级设计并获得认可

### **API设计**

我们需要的第一个 API 是更新用户分数的 API：


```
POST /v1/scores
```


此 API 需要两个参数 - `user_id` 和 `points` 赢得游戏的得分。

此 API 应该只能由游戏服务器访问，而不能由最终客户端访问。

接下来是获取排行榜前 10 名的玩家：


```
GET /v1/scores
```


响应示例：


```
{
  "data": [
    {
      "user_id": "user_id1",
      "user_name": "alice",
      "rank": 1,
      "score": 12543
    },
    {
      "user_id": "user_id2",
      "user_name": "bob",
      "rank": 2,
      "score": 11500
    }
  ],
  ...
  "total": 10
}
```


您还可以获取特定用户的分数：


```
GET /v1/scores/{:user_id}
```


响应示例：


```
{
    "user_info": {
        "user_id": "user5",
        "score": 1000,
        "rank": 6,
    }
}
```


### **高层架构**

<div style="margin-left:3rem">
    <img src="./images/high-level-architecture.png" alt="high-level-architecture" width="500" />
</div>

- 当玩家赢得游戏时，客户端向游戏服务发送请求
- 游戏服务验证获胜是否有效并调用排行榜服务来更新玩家的分数
- 排行榜服务更新用户在排行榜商店中的分数
- 玩家调用排行榜服务来获取排行榜数据，例如前 10 名玩家和给定玩家的排名

考虑的另一种设计是客户直接在排行榜服务中更新他们的分数：

<div style="margin-left:3rem">
    <img src="./images/alternative-design.png" alt="alternative-design" width="500" />
</div>

此选项不安全，因为它容易受到中间人攻击。玩家可以放置代理并随意更改分数。

另一个需要注意的是，对于游戏，游戏逻辑由服务器管理，客户端不需要显式调用服务器来记录他们的胜利。
服务器根据游戏逻辑自动为他们执行此操作。

另一个考虑因素是我们是否应该在游戏服务器和排行榜服务之间放置一个消息队列。如果其他服务对游戏结果感兴趣，这将很有用，但到目前为止，这在采访中还没有明确的要求，因此它没有包含在设计中：

<div style="margin-left:3rem">
    <img src="./images/message-queue-based-comm.png" alt="message-queue-based-comm" width="500" />
</div>

### **数据模型**

让我们讨论一下存储排行榜数据的选项 - 关系数据库、Redis、NoSQL。

NoSQL 解决方案将在深入部分进行讨论。

#### 关系型数据库解决方案

如果规模并不重要并且我们没有那么多用户，那么关系数据库就可以很好地满足我们的需求。

我们可以从一个简单的排行榜表开始，每个月一个（个人说明 - 这没有意义。您可以只添加一个 `month` 列，避免每月维护新表的麻烦）：

<div style="margin-left:3rem">
    <img src="./images/leaderboard-table.png" alt="leaderboard-table" width="500" />
</div>

其中还需要包含其他数据，但这与我们运行的查询无关，因此被省略。

当用户赢得积分时会发生什么？

<div style="margin-left:3rem">
    <img src="./images/user-wins-point.png" alt="user-wins-point" width="500" />
</div>

如果表中尚不存在用户，我们需要先将其插入：


```
INSERT INTO leaderboard (user_id, score) VALUES ('mary1934', 1);
```


在随后的通话中，我们只需更新他们的分数：


```
UPDATE leaderboard set score=score + 1 where user_id='mary1934';
```


我们如何找到排行榜上的顶尖玩家？

<div style="margin-left:3rem">
    <img src="./images/find-leaderboard-position.png" alt="find-leaderboard-position" width="500" />
</div>

我们可以运行以下查询：


```
SELECT (@rownum := @rownum + 1) AS rank, user_id, score
FROM leaderboard
ORDER BY score DESC;
```


但这并不高效，因为它会进行表扫描以对数据库表中的所有记录进行排序。

我们可以通过在 `score` 上添加索引并使用 `LIMIT` 操作来优化它，以避免扫描所有内容：


```
SELECT (@rownum := @rownum + 1) AS rank, user_id, score
FROM leaderboard
ORDER BY score DESC
LIMIT 10;
```


然而，如果用户不在排行榜的顶部并且您想要找到他们的排名，则这种方法无法很好地扩展。

#### Redis解决方案

我们希望找到一种解决方案，即使对数百万玩家也能很好地工作，而无需依赖复杂的数据库查询。

Redis 是一个内存数据存储，它在内存中工作，速度很快，并且有一个合适的数据结构来满足我们的需求 - 排序集。

排序集是一种类似于编程语言中的集的数据结构，它允许您保持按给定条件排序的数据结构。
在内部，它是使用哈希映射来维护键（user_id）和值（分数）之间的映射以及按排序顺序将分数映射到用户的跳过列表来实现的：

<div style="margin-left:3rem">
    <img src="./images/sorted-set.png" alt="sorted-set" width="500" />
</div>

跳过列表如何工作？
- 它是一个链接列表，可以快速搜索
- 它由排序链表和多级索引组成

<div style="margin-left:3rem">
    <img src="./images/skip-list.png" alt="skip-list" width="500" />
</div>

这种结构使我们能够在数据集足够大的情况下快速搜索特定值。
在下面的示例（64 个节点）中，需要遍历基本链表中的 62 个节点才能找到给定值，而在跳表情况下则需要遍历 11 个节点：

<div style="margin-left:3rem">
    <img src="./images/skip-list-performance.png" alt="skip-list-performance" width="500" />
</div>

排序集比关系数据库性能更高，因为数据始终保持排序，但添加和查找操作的代价为 O(logN)。

按照合同，这里有一个示例嵌套查询，我们需要运行它来查找给定用户在关系数据库中的排名：


```
SELECT *,(SELECT COUNT(*) FROM leaderboard lb2
WHERE lb2.score >= lb1.score) RANK
FROM leaderboard lb1
WHERE lb1.user_id = {:user_id};
```


我们需要哪些操作来操作Redis中的排行榜？
- **ZADD** - 如果用户不存在，则将其插入到集合中。否则，更新分数。 O(logN) 时间复杂度。
- **ZINCRBY** - 将用户的分数增加给定量。如果用户不存在，则分数从零开始。 O(logN) 时间复杂度。
- **ZRANGE/ZREVRANGE** - 获取一系列用户，按分数排序。我们可以指定顺序 (ASC/DESC)、偏移量和结果大小。 O(logN+M) 时间复杂度，其中 M 是结果大小。
- **ZRANK/ZREVRANK** - 按 ASC/DESC 顺序获取给定用户的位置（排名）。 O(logN) 时间复杂度。

当用户得分时会发生什么？


```
ZINCRBY leaderboard_feb_2021 1 'mary1934'
```


每个月都会创建一个新的排行榜，而旧的排行榜则会移至历史存储中。

当用户获取排名前 10 的玩家时会发生什么？


```
ZREVRANGE leaderboard_feb_2021 0 9 WITHSCORES
```


结果示例：


```
[(user2,score2),(user1,score1),(user5,score5)...]
```


用户获取他们的排行榜位置怎么样？

<div style="margin-left:3rem">
    <img src="./images/leaderboard-position-of-user.png" alt="leaderboard-position-of-user" width="500" />
</div>

鉴于我们知道用户的排行榜位置，这可以通过以下查询轻松实现：


```
ZREVRANGE leaderboard_feb_2021 357 365
```


可以使用 `ZREVRANK <user-id>` 获取用户的位置。

让我们探讨一下我们的存储需求：
- 假设在给定月份所有 2500 万月活跃用户参与游戏的最坏情况
- ID 是 24 个字符的字符串，分数是 16 位整数，我们需要 26 字节 * 25mil = ~650MB 的存储空间
- 即使我们由于跳跃列表的开销而使存储成本加倍，这仍然很容易适合现代 Redis 集群

另一个需要考虑的非功能性要求是支持每秒 2500 次更新。这完全在单个 Redis 服务器的能力范围内。

附加警告：
- 我们可以启动 Redis 副本以避免在 Redis 服务器崩溃时丢失数据
- 我们仍然可以利用 Redis 持久性来在崩溃时不丢失数据
- 我们需要 MySQL 中的两个支持表来获取用户详细信息，例如用户名、显示名称等，并存储用户赢得游戏的时间
- MySQL 中的第二个表可用于在基础设施发生故障时重建排行榜
- 作为一个小的性能优化，我们可以缓存前 10 名玩家的用户详细信息，因为他们会被频繁访问

---

## 第 3 步：深入设计

### **是否使用云提供商**

我们可以选择部署和管理我们自己的服务，也可以使用云提供商来为我们管理它们。

如果我们选择自己管理服务，我们将使用 redis 来存储排行榜数据，使用 mysql 来存储用户配置文件，如果我们想要扩展数据库，则可能使用缓存来存储用户配置文件：

<div style="margin-left:3rem">
    <img src="./images/manage-services-ourselves.png" alt="manage-services-ourselves" width="500" />
</div>

或者，我们可以使用云产品来为我们管理许多服务。例如，我们可以使用 AWS API Gateway 将 API 调用路由到 AWS Lambda 函数：

<div style="margin-left:3rem">
    <img src="./images/api-gateway-mapping.png" alt="api-gateway-mapping" width="500" />
</div>

AWS Lambda 使我们能够运行代码，而无需自己管理或配置服务器。它仅在需要时运行并自动扩展。

用户得分示例：

<div style="margin-left:3rem">
    <img src="./images/user-scoring-point-lambda.png" alt="user-scoring-point-lambda" width="500" />
</div>

用户检索排行榜的示例：

<div style="margin-left:3rem">
    <img src="./images/user-retrieve-leaderboard.png" alt="user-retrieve-leaderboard" width="500" />
</div>

Lambda 是无服务器架构的实现。我们不需要管理扩展和环境设置。

如果我们从头开始构建游戏，作者建议采用这种方法。

### **扩展Redis**

有了 500 万 DAU，从存储和 QPS 角度来看，我们都可以使用单个 Redis 实例。

然而，如果我们想象用户群增长 10 倍，达到 5 亿 DAU，那么我们需要 65 GB 的存储空间，QPS 达到 25 万。

这样的规模需要分片。

实现它的一种方法是对数据进行范围分区：

<div style="margin-left:3rem">
    <img src="./images/range-partition.png" alt="range-partition" width="500" />
</div>

在此示例中，我们将根据用户的分数进行分片。我们将在应用程序代码中维护 user_id 和 shard 之间的映射。
我们可以通过 MySQL 或映射本身的另一个缓存来做到这一点。

为了获取前 10 名玩家，我们将查询得分最高的分片 (`[900-1000]`)。

为了获取用户的排名，我们需要计算用户分片内的排名，并将其他分片中得分较高的所有用户相加。
后者是 O(1) 操作，因为可以通过 info keyspace 命令快速访问每个分片的总记录。

或者，我们可以通过 Redis 集群使用哈希分区。它是一个代理，基于类似于一致性哈希的分区在 Redis 节点之间分发数据，但并不完全相同：

<div style="margin-left:3rem">
    <img src="./images/hash-partition.png" alt="hash-partition" width="500" />
</div>

使用此设置计算前 10 名玩家具有挑战性。我们需要获取每个分片的前 10 名玩家并将结果合并到应用程序中：

<div style="margin-left:3rem">
    <img src="./images/top-10-players-calculation.png" alt="top-10-players-calculation" width="500" />
</div>

哈希分区有一些限制：
- 如果我们需要获取前 K 个用户（其中 K 较高），则延迟可能会增加，因为我们需要从所有分片中获取大量数据
- 延迟随着分区数量的增加而增加
- 没有直接的方法来确定用户的排名

因此，作者倾向于使用固定分区来解决这个问题。

其他注意事项：
- 最佳实践是为写入量大的 Redis 节点分配两倍的内存，以在需要时容纳快照
- 我们可以使用名为 Redis-benchmark 的工具来跟踪 Redis 设置的性能并做出数据驱动的决策

### **替代解决方案：NoSQL**

要考虑的另一种解决方案是使用针对以下方面进行优化的适当 NoSQL 数据库：
- 重写入
- 按分数有效地对同一分区内的项目进行排序

DynamoDB、Cassandra 或 MongoDB 都很适合。

在本章中，作者决定使用 DynamoDB。它是一个完全托管的 NoSQL 数据库，提供可靠的性能和出色的可扩展性。
当我们需要查询不属于主键的字段时，它还可以使用全局二级索引。

<div style="margin-left:3rem">
    <img src="./images/dynamo-db.png" alt="dynamo-db" width="500" />
</div>

让我们从存储国际象棋游戏排行榜的表开始：

<div style="margin-left:3rem">
    <img src="./images/chess-game-leaderboard-table-1.png" alt="chess-game-leaderboard-table-1" width="500" />
</div>

这很有效，但如果我们需要按分数查询任何内容，则无法很好地扩展。因此，我们可以将分数作为排序键：

<div style="margin-left:3rem">
    <img src="./images/chess-game-leaderboard-table-2.png" alt="chess-game-leaderboard-table-2" width="500" />
</div>

这种设计的另一个问题是我们按月分区。这会导致热点分区，因为与其他月份相比，最近一个月的访问量会不均匀。

我们可以使用一种称为写分片的技术，其中我们为每个键附加一个分区号，通过 `user_id % num_partitions` 计算：

<div style="margin-left:3rem">
    <img src="./images/chess-game-leaderboard-table-3.png" alt="chess-game-leaderboard-table-3" width="500" />
</div>

需要考虑的一个重要权衡是我们应该使用多少个分区：
- 分区越多，写入扩展性越高
- 然而，读取可扩展性会受到影响，因为我们需要查询更多分区来收集聚合结果

使用这种方法要求我们使用我们之前看到的“分散-聚集”技术，随着我们添加更多分区，该技术的时间复杂度会增加：

<div style="margin-left:3rem">
    <img src="./images/scatter-gather-2.png" alt="scatter-gather-2" width="500" />
</div>

为了对分区数量做出良好的评估，我们需要进行一些基准测试。

这种 NoSQL 方法仍然有一个主要缺点 - 很难计算用户的具体排名。

如果我们有足够的规模来要求我们进行分片，那么我们也许可以告诉用户他们所处的分数“百分位数”。

cron 作业可以定期运行来分析分数分布，并据此确定用户的百分位数，例如：


```
10th percentile = score < 100
20th percentile = score < 500
...
90th percentile = score < 6500
```


---

## 第四步：总结

如果时间允许，其他可以讨论的事情：
- **更快的检索** - 我们可以通过映射 `user_id -> user object` 的 Redis 哈希来缓存用户对象。与查询数据库相比，这可以实现更快的检索。
- **打破平局** - 当两个玩家得分相同时，我们可以根据上次玩的比赛对他们进行排序来打破平局。
- **系统故障恢复** - 在发生大规模Redis中断的情况下，我们可以通过遍历MySQL WAL条目来重新创建排行榜，并通过临时脚本重新创建它
