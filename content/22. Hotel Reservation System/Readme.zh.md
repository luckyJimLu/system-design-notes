# 第22章：酒店预订系统

## 简介
在本章中，我们将设计一个**酒店预订系统**，类似于万豪国际酒店。

也适用于其他类型的系统 - Airbnb、航班预订、电影票预订。

---

## 第 1 步：了解问题并确定设计范围
在深入设计系统之前，我们应该向面试官提出问题以澄清范围：
 - C：系统的规模有多大？
 - I：我们正在为一家拥有 5000 家酒店和 100 万间客房的连锁酒店建立一个网站
 - C：顾客是在预订时付款还是在到达酒店时付款？
 - I：他们预订的时候就付全款了。
 - C：顾客只通过网站预订酒店房间吗？我们是否必须支持其他预订方式，例如电话？
 - I：他们只通过网站或应用程序进行预订。
 - C：顾客可以取消预订吗？
 - 我：是的
 - C：还有其他需要考虑的事情吗？
 - I： 是的，我们允许超额预订 10%。酒店将出售比实际数量更多的房间。酒店这样做是因为预计客户会取消预订。
 - C：由于时间不多，我们将重点关注-显示酒店相关页面、酒店房间详情页面、预订房间、管理面板、支持超额预订。
 - 我：听起来不错。
 - I：还有一件事——酒店价格一直在变化。假设酒店房间的价格每天都在变化。
 - 丙：好的。

### **非功能性需求**
 - 支持高并发——旺季时可能会有很多顾客试图预订同一家酒店。
 - 中等延迟 - 用户进行预订时最好具有低延迟，但如果系统需要几秒钟的时间来处理它也是可以接受的。

### **粗略估计**
 - 总计5000家酒店和100万间客房
 - 假设 70% 的客房已入住，平均入住时间为 3 天
 - 预计每日预订量 - 100 万个 * 0.7 / 3 = 每天约 24 万个预订量
 - 每秒预订量 - 一天 240k / 10^5 秒 = ~3。平均预订TPS较低。

我们来估算一下 QPS。如果我们假设到达预订页面需要三个步骤，并且每页转化率为 10%，
我们可以估算一下，如果有3个预订，那么预订页面的浏览量一定有30次，酒店房间详情页面的浏览量一定有300次。

<div style="margin-left:3rem">
    <img src="./images/qps-estimation.png" alt="qps-estimation" width="500" />
</div>

---

## 第 2 步：提出高级设计并获得认可
我们将探索 - API 设计、数据模型、高层设计。

### **API设计**
此 API 设计侧重于我们支持酒店预订系统所需的核心端点（使用 RESTful 实践）。

一个成熟的系统需要更广泛的 API，支持根据大量标准搜索房间，但我们在本节中不会关注这一点。
原因是它们在技术上不具有挑战性，因此超出了范围。

**酒店相关API**
 - `GET /v1/hotels/{id}` - 获取有关酒店的详细信息
 - `POST /v1/hotels` - 添加新酒店。仅适用于操作员
 - `PUT /v1/hotels/{id}` - 更新酒店信息。仅适用于操作员
 - `DELETE /v1/hotels/{id}` - 删除酒店。 API仅供操作人员使用

**房间相关API**
 - `GET /v1/hotels/{id}/rooms/{id}` - 获取有关房间的详细信息
 - `POST /v1/hotels/{id}/rooms` - 添加房间。仅适用于操作员
 - `PUT /v1/hotels/{id}/rooms/{id}` - 更新房间信息。仅适用于操作员
 - `DELETE /v1/hotels/{id}/rooms/{id}` - 删除房间。仅适用于操作员

**预订相关API**
 - `GET /v1/reservations` - 获取当前用户的预订历史记录
 - `GET /v1/reservations/{id}` - 获取有关预订的详细信息
 - `POST /v1/reservations` - 进行新的预订
 - `DELETE /v1/reservations/{id}` - 取消预订

以下是预订请求的示例：


```
{
  "startDate":"2021-04-28",
  "endDate":"2021-04-30",
  "hotelID":"245",
  "roomID":"U12354673389",
  "reservationID":"13422445"
}
```


请注意，`reservationID` 是幂等键，以避免重复预订。详细解释见[并发部分](#concurrency-issues)

### **数据模型**
在选择要使用的数据库之前，让我们考虑一下我们的访问模式。

我们需要支持以下查询：
 - 查看有关酒店的详细信息
 - 查找给定日期范围内的可用房间类型
 - 记录预订
 - 查找预订或过去的预订历史

根据我们的估算，我们知道系统的规模并不大，但我们需要为流量激增做好准备。

鉴于这些知识，我们将选择关系数据库，因为：
 - 关系数据库可以很好地与读密集型和写密集型系统配合使用。
 - NoSQL databases are normally optimized for writes, but we know we won't have many as only a fraction of users who visit the site make a reservation.
 - 关系数据库提供 ACID 保证。这些对于这样的系统很重要，因为没有它们，我们将无法防止负余额、双重收费等问题。
 - 关系数据库可以轻松地对数据进行建模，因为结构非常清晰。

这是我们的架构设计：

<div style="margin-left:3rem">
    <img src="./images/schema-design.png" alt="schema-design" width="500" />
</div>

大多数字段都是不言自明的。唯一值得一提的字段是 `status` 字段，它表示给定房间的状态机：

<div style="margin-left:3rem">
    <img src="./images/status-state-machine.png" alt="status-state-machine" width="500" />
</div>

此数据模型适用于像 Airbnb 这样的系统，但不适用于用户不预订特定房间而是预订房间类型的酒店。
他们预订一种房间类型，并在预订时选择房间号。

这个缺点将在[改进的数据模型](#improved-data-model)部分中解决。

### **高层设计**
我们为此设计选择了微服务架构。近年来它非常受欢迎：

<div style="margin-left:3rem">
    <img src="./images/high-level-design.png" alt="high-level-design" width="500" />
</div>

 - **用户**：通过手机或电脑预订酒店房间
 - **管理员**：执行管理功能，例如退款/取消付款等
 - **CDN**：缓存JS包、图片、视频等静态资源
 - **公共API网关**：完全托管的服务，支持速率限制、身份验证等。
 - **内部 API**：仅对授权人员可见。通常受 VPN 保护。
 - **酒店服务**：提供有关酒店和房间的详细信息。酒店和房间数据是静态的，因此可以积极缓存。
 - **房价服务**：提供未来不同日期的房价。关于此域的一个有趣的说明是，价格取决于酒店在特定日期的入住情况。
 - **预订服务**：接收预订请求并预订酒店房间。还可以在预订/取消时跟踪房间库存。
 - **付款服务**：处理付款并在成功时更新预订状态。
 - **酒店管理服务**：仅向授权人员提供。允许某些管理功能来管理和查看预订、酒店等。

可以通过 RPC 框架（例如 gRPC）促进服务间通信。

---

## 第 3 步：深入设计
让我们更深入地探讨：
 - 改进的数据模型
 - 并发问题
 - 可扩展性
 - 解决微服务中的数据不一致问题

### **改进的数据模型**
正如上一节中提到的，我们需要修改 API 和架构，以便能够预订某种类型的房间而不是特定的房间。

对于预留API，我们不再预留`roomID`，而是预留`roomTypeID`：


```
POST /v1/reservations
{
  "startDate":"2021-04-28",
  "endDate":"2021-04-30",
  "hotelID":"245",
  "roomTypeID":"12354673389",
  "roomCount":"3",
  "reservationID":"13422445"
}
```


这是更新后的架构：

<div style="margin-left:3rem">
    <img src="./images/updated-schema.png" alt="updated-schema" width="500" />
</div>

 - **房间**：包含有关房间的信息
 - **room_type_rate**：包含有关给定房间类型的价格信息
 - **预订**：记录客人预订数据
 - **room_type_inventory**：存储有关酒店房间的库存数据。

让我们看一下 `room_type_inventory` 列，因为该表更有趣：
 - **hotel_id**：酒店 ID
 - **room_type_id**：房间类型的id
 - **日期**：单个日期
 - **total_inventory**：房间总数减去暂时从库存中删除的房间数。
 - **total_reserved**：给定的预订房间总数（hotel_id、room_type_id、日期）

有其他方法可以设计此表，但每个（hotel_id、room_type_id、date）有一个房间可以轻松实现
预订管理和更轻松的查询。

表中的行是使用每日 CRON 作业预先填充的。

样本数据：
| 酒店_id | 房间类型 ID | 日期 | 总库存 | 总保留量 |
|----------|--------------|------------|-----------------|----------------|
| 211      | 1001         | 2021-06-01 | 100             | 80             |
| 211      | 1001         | 2021-06-02 | 100             | 82             |
| 211      | 1001         | 2021-06-03 | 100             | 86             |
| 211      | 1001         | ...        | ...             |                |
| 211      | 1001         | 2023-05-31 | 100             | 0              |
| 211      | 1002         | 2021-06-01 | 200             | 16             |
| 2210     | 101          | 2021-06-01 | 30              | 23             |
| 2210     | 101          | 2021-06-02 | 30              | 25             |

用于检查某种类型房间的可用性的 SQL 查询示例：


```
SELECT date, total_inventory, total_reserved
FROM room_type_inventory
WHERE room_type_id = ${roomTypeId} AND hotel_id = ${hotelId}
AND date between ${startDate} and ${endDate}
```


如何使用该数据检查指定数量的房间的可用性（请注意，我们支持超额预订）：


```
if (total_reserved + ${numberOfRoomsToReserve}) <= 110% * total_inventory
```


现在让我们对存储量进行一些估计。
 - 我们有 5000 家酒店。
 - 每家酒店拥有20种房型。
 - 5000 * 20 * 2（年）* 365（天）= 7300 万行

7300 万行并不是很多数据，单个数据库服务器就可以处理它。
然而，设置读取复制（可能跨不同区域）以实现高可用性是有意义的。

后续问题——如果单个数据库的预订数据太大，你会怎么做？
 - 仅存储当前和未来的预订数据。预订历史记录可以移至冷库。
 - 数据库分片 - 我们可以通过 `hash(hotel_id) % servers_cnt` 对数据进行分片，因为我们在查询中始终选择 `hotel_id`。

### **并发问题**
另一个需要解决的重要问题是重复预订。

有两个问题需要解决：
 - 同一用户点击“预订”两次
 - 多个用户尝试同时预订房间

这是第一个问题的可视化：

<div style="margin-left:3rem">
    <img src="./images/double-booking-single-user.png" alt="double-booking-single-user" width="500" />
</div>

有两种方法可以解决这个问题：
 - 客户端处理 - 一旦单击，前端就可以禁用预订按钮。但是，如果用户禁用了 JavaScript，他们将不会看到该按钮变灰。
 - Idemptent API - 向 API 添加幂等密钥，使用户能够执行一次操作，无论端点被调用多少次：

<div style="margin-left:3rem">
    <img src="./images/idempotency.png" alt="idempotency" width="500" />
</div>

该流程的工作原理如下：
 - 当您填写详细信息并进行预订时，就会生成预订订单。预订订单是使用全局唯一标识符生成的。
 - 使用上一步中生成的 `reservation_id` 提交预订 1。
 - 如果第二次点击“完成预订”，则会发送相同的 `reservation_id`，后端会检测到这是重复预订。
 - 通过使 `reservation_id` 列具有唯一约束来避免重复，从而防止具有该 id 的多个记录存储在数据库中。

<div style="margin-left:3rem">
    <img src="./images/unique-constraint-violation.png" alt="unique-constraint-violation" width="500" />
</div>

如果有多个用户进行相同的预订怎么办？

<div style="margin-left:3rem">
    <img src="./images/double-booking-multiple-users.png" alt="double-booking-multiple-users" width="500" />
</div>

 - 假设事务隔离级别不可序列化
 - 用户 1 和 2 尝试同时预订同一房间。
 - 事务 1 检查是否有足够的房间 - 有
 - 事务 2 检查是否有足够的房间 - 有
 - 事务2预留房间并更新库存
 - 事务 1 也保留了房间，因为它仍然看到 100 个房间中有 99 个 `total_reserved` 房间。
 - 两个事务均成功提交更改

这个问题可以使用某种形式的锁定机制来解决：
 - 悲观锁
 - 乐观锁
 - 数据库限制

这是我们用来预订房间的 SQL：


```sql
# step 1: check room inventory
SELECT date, total_inventory, total_reserved
FROM room_type_inventory
WHERE room_type_id = ${roomTypeId} AND hotel_id = ${hotelId}
AND date between ${startDate} and ${endDate}

# For every entry returned from step 1
if((total_reserved + ${numberOfRoomsToReserve}) > 110% * total_inventory) {
  Rollback
}

# step 2: reserve rooms
UPDATE room_type_inventory
SET total_reserved = total_reserved + ${numberOfRoomsToReserve}
WHERE room_type_id = ${roomTypeId}
AND date between ${startDate} and ${endDate}

Commit
```


#### 选项 1：悲观锁定
悲观锁定通过在更新记录时锁定记录来防止同时更新。

这可以在 MySQL 中使用 `SELECT... FOR UPDATE` 查询来完成，该查询会锁定查询选择的行，直到提交事务。

<div style="margin-left:3rem">
    <img src="./images/pessimistic-locking.png" alt="pessimistic-locking" width="500" />
</div>

优点：
 - 防止应用程序更新正在更改的数据
 - 易于实施并通过序列化更新避免冲突。当存在大量数据争用时很有用。

缺点：
 - 当多个资源被锁定时，可能会发生死锁。
 - 这种方法不可扩展 - 如果事务锁定时间过长，则会影响尝试访问该资源的所有其他事务。
 - 当查询选择大量资源并且事务长期存在时，影响非常严重。

由于其可扩展性问题，作者不推荐这种方法。

#### 选项 2：乐观锁定
乐观锁定允许多个用户同时尝试更新一条记录。

有两种常见的实现方法 - 版本号和时间戳。建议使用版本号，因为服务器时钟可能不准确。

<div style="margin-left:3rem">
    <img src="./images/optimistic-locking.png" alt="optimistic-locking" width="500" />
</div>

 - 数据库表中添加了一个新的 `version` 列
 - 在用户修改数据库行之前，会读取版本号
 - 当用户更新该行时，版本号加1并写回数据库
 - 如果新版本号不超过前一个版本号，数据库验证将阻止插入

乐观锁定通常比悲观锁定更快，因为我们不锁定数据库。
然而，当并发性很高时，它的性能往往会下降，因为这会导致大量回滚。

优点：
 - 它可以防止应用程序编辑过时的数据
 - 我们不需要获取数据库中的锁
 - 当数据争用较低（即很少出现更新冲突）时的首选选项

缺点：
 - 数据争用较多时性能较差

乐观锁定对于我们的系统来说是一个不错的选择，因为预留 QPS 不是很高。

#### 选项 3：数据库约束
这种方法与乐观锁定非常相似，但护栏是使用数据库约束来实现的：


```
CONSTRAINT `check_room_count` CHECK((`total_inventory - total_reserved` >= 0))
```


<div style="margin-left:3rem">
    <img src="./images/database-constraint.png" alt="database-constraint" width="500" />
</div>

优点：
 - 易于实施
 - 当数据争用较小时效果很好

缺点：
 - 与乐观锁定类似，当数据争用较高时性能较差
 - 数据库约束无法像应用程序代码那样轻松进行版本控制
 - 并非所有数据库都支持约束

由于其易于实施，这是酒店预订系统的另一个不错的选择。

### **可扩展性**
通常，酒店预订系统的负载不高。

然而，面试官可能会问你，当该系统被更大、更受欢迎的旅游网站（例如 booking.com）采用时，你会如何处理？
这样的话，QPS就可以提高1000倍。

当出现这种情况时，了解我们的瓶颈在哪里很重要。所有服务都是无状态的，因此可以通过复制轻松扩展。

然而，数据库是有状态的，并且如何扩展它并不那么明显。

扩展它的一种方法是实现数据库分片——我们可以将数据分割到多个数据库中，每个数据库都包含一部分数据。

我们可以基于 `hotel_id` 进行分片，因为所有查询都基于它进行过滤。
假设QPS为3万，将数据库分片为16个分片后，每个分片的QPS为1875，在单个MySQL集群的负载能力之内。

<div style="margin-left:3rem">
    <img src="./images/database-sharding.png" alt="database-sharding" width="500" />
</div>

我们还可以通过 Redis 使用缓存进行房间库存和预订。我们可以设置 TTL，以便旧数据可以在过去的几天内过期。

<div style="margin-left:3rem">
    <img src="./images/inventory-cache.png" alt="inventory-cache" width="500" />
</div>

我们存储库存的方式基于 `hotel_id`、`room_type_id` 和 `date`：


```
key: hotelID_roomTypeID_{date}
value: the number of available rooms for the given hotel ID, room type ID and date.
```


数据一致性是异步发生的，并通过使用 CDC 流机制进行管理 - 读取数据库更改并将其应用到单独的系统。
Debezium 是与 Redis 同步数据库更改的流行选项。

使用这样的机制，有可能在一段时间内缓存和数据库不一致。
在我们的例子中这很好，因为数据库将阻止我们进行无效的预订。

这将导致 UI 出现一些问题，因为用户必须刷新页面才能看到“没有更多房间了”，
但无论这个问题如何，如果一个人在预订之前犹豫了很多，那么这种情况就可能发生。

缓存优点：
 - 减少数据库负载
 - 高性能，因为 Redis 在内存中管理数据

缓存缺点：
 - 维护缓存和数据库之间的数据一致性很困难。我们需要考虑这种不一致如何影响用户体验。

### **服务之间的数据一致性**
单体应用程序使我们能够使用共享关系数据库来确保数据一致性。

在我们的微服务设计中，我们选择了一种混合方法，其中一些服务是独立的，
但预订和库存 API 由预订和库存 API 的同一服务处理。

这样做是因为我们希望利用关系数据库的 ACID 保证来确保一致性。

然而，面试官可能会质疑这种方法，因为它不是纯粹的微服务架构，其中每个服务都有一个专用的数据库：

<div style="margin-left:3rem">
    <img src="./images/microservices-vs-monolith.png" alt="microservices-vs-monolith" width="500" />
</div>

这可能会导致一致性问题。在单体服务器中，我们可以利用关系数据库的事务功能来实现原子操作：

<div style="margin-left:3rem">
    <img src="./images/atomicity-monolith.png" alt="atomicity-monolith" width="500" />
</div>

然而，当操作跨越多个服务时，保证这种原子性更具挑战性：

<div style="margin-left:3rem">
    <img src="./images/microservice-non-atomic-operation.png" alt="microservice-non-atomic-operation" width="500" />
</div>

有一些众所周知的技术可以处理这些数据不一致问题：
 - **两阶段提交**：一种保证跨多个节点原子事务提交的数据库协议。
但它的性能不高，因为单个节点滞后会导致所有节点阻塞操作。
 - **Saga**：一系列本地事务，如果工作流中的任何步骤失败，则会触发补偿事务。这是最终一致的方法。

值得注意的是，解决微服务之间的数据不一致是一个具有挑战性的问题，这会增加系统的复杂性。
鉴于我们将依赖操作封装在同一个关系数据库中的更实用的方法，最好考虑一下成本是否值得。

---

## 第四步：总结
我们提出了酒店预订系统的设计。

这些是我们经历的步骤：
 - 收集需求并进行粗略计算以了解系统的规模
 - 我们在高层设计中提出了API设计、数据模型和系统架构
 - 在深入研究中，我们随着需求的变化探索了替代数据库模式设计
 - 我们讨论了竞争条件并提出了解决方案 - 悲观/乐观锁定、数据库约束
 - 通过数据库分片和缓存扩展系统的方法
 - 最后我们解决了如何处理跨多个微服务的数据一致性问题
