# 第20章：指标监控和警报系统

## 简介
本章重点介绍设计一个高度可扩展的**指标监控和警报系统**，这对于确保高可用性和可靠性至关重要。

---

## 第 1 步：了解问题并确定设计范围
指标监控系统可能意味着很多不同的事情 - 例如，当面试官只对基础设施指标感兴趣时，您不想设计日志聚合系统。

让我们先尝试理解这个问题：
 - C：我们为谁构建这个系统？大型科技公司的内部监控系统还是 DataDog 等 SaaS？
 - I：我们的建筑仅供内部使用。
 - C：我们想要收集哪些指标？
 - I：操作系统指标 - CPU 负载、内存、数据磁盘空间。还有诸如每秒请求数之类的高级指标。业务指标不在范围内。
 - C：我们正在监控的基础设施的规模有多大？
 - I：1亿日活跃用户，1000个服务器池，每个池100台机器
 - C：我们应该保留数据多久？
 - I：我们假设保留 1 年。
 - C：我们可以降低长期存储的指标数据分辨率吗？
 - I：将新收到的指标保留 7 天。在接下来的 30 天内将它们滚动到 1m 分辨率。 30 天后进一步将其分辨率提高到 1 小时。
 - C：支持哪些警报渠道？
 - I：电子邮件、电话、PagerDuty 或 webhooks。
 - C：我们需要收集错误或访问日志等日志吗？
 - 我：没有
 - C：我们需要支持分布式系统追踪吗？
 - 我：没有

### **高级要求和假设**
被监控的基础设施规模很大：
 - 1 亿日活跃用户
 - 1000 个服务器池 * 100 台机器 * 每台机器约 100 个指标 -> 约 1000 万个指标
 - 数据保留 1 年
 - 数据保留政策 - 7 天为原始数据，30 天为 1 分钟分辨率，1 年为 1 小时分辨率

可以监控多种指标：
 - CPU负载
 - 请求数
 - 内存使用情况
 - 消息队列中的消息计数

### **非功能性需求**
 - **可扩展性**：系统应该可扩展以适应更多指标和警报
 - **低延迟**：系统需要对仪表板和警报具有低查询延迟
 - **可靠性**：系统应该高度可靠，以避免错过关键警报
 - **灵活性**：系统应该能够在未来轻松集成新技术

哪些要求超出了范围？
 - **日志监控**：ELK 堆栈对于此用例非常流行
 - **分布式系统跟踪**：这是指在请求流经系统内的多个服务时收集有关请求生命周期的数据

---

## 第 2 步：提出高级设计并获得认可

### **基础知识**
指标监控和警报系统涉及五个核心组件：

<div style="margin-left:3rem">
    <img src="./images/metrics-monitoring-core-components.png" alt="metrics-monitoring-core-components" width="500" />
</div>

 - **数据收集**：从不同来源收集指标数据
 - **数据传输**：将数据从源传输到指标监控系统
 - **数据存储**：组织和存储传入的数据
 - **警报**：分析传入数据、检测异常并生成警报
 - **可视化**：以图形、图表等形式呈现数据

### **数据模型**
指标数据通常记录为时间序列，其中包含一组带有时间戳的值。
该系列可以通过名称和一组可选的标签来识别。

示例 1 - 20:00 生产服务器实例 i631 上的 CPU 负载是多少？

<div style="margin-left:3rem">
    <img src="./images/metrics-example-1.png" alt="metrics-example-1" width="500" />
</div>

数据可以通过下表来识别：

<div style="margin-left:3rem">
    <img src="./images/metrics-example-1-data.png" alt="metrics-example-1-data" width="500" />
</div>

时间序列由指标名称、标签和特定时间的单个点来标识。

示例 2 - 过去 10 分钟美国西部地区所有 Web 服务器的平均 CPU 负载是多少？


```
CPU.load host=webserver01,region=us-west 1613707265 50

CPU.load host=webserver01,region=us-west 1613707265 62

CPU.load host=webserver02,region=us-west 1613707265 43

CPU.load host=webserver02,region=us-west 1613707265 53

...

CPU.load host=webserver01,region=us-west 1613707265 76

CPU.load host=webserver01,region=us-west 1613707265 83
```


这是我们可以从存储中提取来回答该问题的示例数据。
平均 CPU 负载可以通过对行的最后一列中的值进行平均来计算。

上面所示的格式称为线路协议，市场上许多流行的监控软件都使用它 - 例如 Prometheus、OpenTSDB。

每个时间序列都包含以下内容：

<div style="margin-left:3rem">
    <img src="./images/time-series-data-example.png" alt="time-series-data-example" width="500" />
</div>

可视化数据外观的好方法：

<div style="margin-left:3rem">
    <img src="./images/time-series-data-viz.png" alt="time-series-data-viz" width="500" />
</div>

 - x 轴是时间
 - y 轴是您正在查询的维度 - 例如指标名称、标签等。

当我们收集大量指标时，数据访问模式是大量写入和尖峰读取，但它们很少被访问，尽管在发生事件时会出现突发情况。

数据存储系统是本设计的核心。
 - 尽管您可以通过专家级调整实现良好的规模，但不建议使用通用数据库来解决此问题。
 - 使用 NoSQL 数据库在理论上是可行的，但很难设计一个可扩展的模式来有效地存储和查询时间序列数据。

有许多专门用于存储时间序列数据的数据库。其中许多支持自定义查询接口，可以有效查询时间序列数据。
 - OpenTSDB是一个分布式时序数据库，但它是基于Hadoop和HBase的。如果您没有配置该基础设施，则很难使用该技术。
 - Twitter 使用 MetricsDB，而 Amazon 提供 Timestream。
 - 两个最流行的时间序列数据库是 InfluxDB 和 Prometheus。
 - 它们旨在存储大量时间序列数据。两者都是基于内存缓存+磁盘存储。

InfluxDB 的规模示例 - 配置 8 个内核和 32GB RAM 时每秒写入次数超过 250k：

<div style="margin-left:3rem">
    <img src="./images/influxdb-scale.png" alt="influxdb-scale" width="500" />
</div>

您不需要了解指标数据库的内部结构，因为它是小众知识。仅当您在简历中提及时，才可能会询问您。

出于采访的目的，了解指标是时间序列数据并了解流行的时间序列数据库（例如 InfluxDB）就足够了。

时序数据库的一大特色是通过标签对大量时序数据进行高效聚合和分析。
例如，InfluxDB 为每个标签构建索引。

然而，保持标签基数较低是至关重要的，即不要使用太多唯一标签。

### **高层设计**

<div style="margin-left:3rem">
    <img src="./images/high-level-design.png" alt="high-level-design" width="500" />
</div>

 - **指标来源**：可以是应用服务器、SQL数据库、消息队列等。
 - **指标收集器**：收集指标数据并写入时间序列数据库
 - **时间序列数据库**：将指标存储为时间序列。提供自定义查询接口，用于分析大量指标。
 - **查询服务**：可以轻松地从时序数据库中查询和检索数据。如果数据库的接口足够强大的话，可以完全取代它。
 - **警报系统**：将警报通知发送到各个警报目的地。
 - **可视化系统**：以图形/图表的形式显示指标。

---

## 第 3 步：深入设计
让我们深入研究系统中几个更有趣的部分。

### **指标收集**
对于指标收集，偶尔的数据丢失并不重要。客户解雇后就忘记是可以接受的。

<div style="margin-left:3rem">
    <img src="./images/metrics-collection.png" alt="metrics-collection" width="500" />
</div>

有两种方法可以实现指标收集：拉取或推送。

拉模型可能如下所示：

<div style="margin-left:3rem">
    <img src="./images/pull-model-example.png" alt="pull-model-example" width="500" />
</div>

对于此解决方案，指标收集器需要维护最新的服务和指标端点列表。
我们可以使用 Zookeeper 或 etcd 来实现该目的 - 服务发现。

服务发现包含有关何时何地收集指标的配置规则：

<div style="margin-left:3rem">
    <img src="./images/service-discovery-example.png" alt="service-discovery-example" width="500" />
</div>

以下是指标收集流程的详细说明：

<div style="margin-left:3rem">
    <img src="./images/metrics-collection-flow.png" alt="metrics-collection-flow" width="500" />
</div>

 - 指标收集器从服务发现中获取配置元数据。这包括拉取间隔、IP 地址、超时和重试参数。
 - 指标收集器通过预定义的http端点（例如`/metrics`）提取指标数据。这通常由客户端库完成。
 - 或者，指标收集器可以向服务发现注册更改事件通知，以便在服务端点更改时得到通知。
 - 另一种选择是指标收集器定期轮询指标端点配置更改。

在我们的规模下，单个指标收集器是不够的。必须有多个实例。
但是，它们之间还必须存在某种同步，以便两个收集器不会两次收集相同的指标。

一个解决方案是将收集器和服务器放置在一致的哈希环上，并将一组服务器仅与单个收集器相关联：

<div style="margin-left:3rem">
    <img src="./images/consistent-hash-ring.png" alt="consistent-hash-ring" width="500" />
</div>

另一方面，使用推送模型，服务会主动将其指标推送到指标收集器：

<div style="margin-left:3rem">
    <img src="./images/push-model-example.png" alt="push-model-example" width="500" />
</div>

在这种方法中，收集代理通常与服务实例一起安装。
代理从服务器收集指标并将其推送到指标收集器。

<div style="margin-left:3rem">
    <img src="./images/metrics-collector-agent.png" alt="metrics-collector-agent" width="500" />
</div>

通过此模型，我们可以在将指标发送到收集器之前聚合指标，从而减少收集器处理的数据量。

另一方面，指标收集器可以拒绝推送请求，因为它无法处理负载。
因此，将收集器添加到负载均衡器后面的自动缩放组非常重要。

那么哪一个更好呢？两种方法之间都存在权衡，不同的系统使用不同的方法：
 - Prometheus 采用拉式架构
 - Amazon Cloud Watch 和 Graphite 使用推送架构

以下是推式和拉式之间的一些主要区别：
|                                        | 拉动 | 推 |
|----------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 调试方便 | 应用程序服务器上用于拉取指标的 /metrics 端点可用于随时查看指标。您甚至可以在笔记本电脑上执行此操作。拉胜。 | 如果指标收集器未收到指标，则问题可能是由网络问题引起的。 |
| 健康检查 | 如果应用程序服务器没有响应拉取，您可以快速确定应用程序服务器是否已关闭。拉胜。 | 如果指标收集器未收到指标，则问题可能是由网络问题引起的。 |
| 短暂的工作 |                                                                                                                                                                                                         | 一些批处理作业可能是短暂的，并且持续时间不足以被拉取。推胜。这可以通过引入拉模型的推网关来解决[22]。 |
| 防火墙或复杂的网络设置 | 让服务器拉取指标要求所有指标端点均可访问。这在多个数据中心设置中可能会出现问题。它可能需要更复杂的网络基础设施。 | 如果指标收集器设置了负载均衡器和自动缩放组，则可以从任何地方接收数据。推胜。 |
| 性能 | 拉取方法通常使用 TCP。 | 推送方法通常使用 UDP。这意味着推送方法提供了较低延迟的指标传输。这里的反驳是，与发送度量有效负载相比，建立 TCP 连接的工作量很小。 |
| 数据真实性 | 从中收集指标的应用程序服务器预先在配置文件中定义。从这些服务器收集的指标保证是真实的。 | 任何类型的客户端都可以将指标推送到指标收集器。这可以通过将接受指标的服务器列入白名单或要求身份验证来解决。 |

没有明显的赢家。一个大型组织可能需要同时支持两者。首先可能没有办法安装推送代理。

### **扩展指标传输管道**

<div style="margin-left:3rem">
    <img src="./images/metrics-transmission-pipeline.png" alt="metrics-transmission-pipeline" width="500" />
</div>

无论我们使用推模型还是拉模型，指标收集器都是在自动缩放组中配置的。

但是，如果时序数据库发生故障，则可能会丢失数据。为了缓解这个问题，我们将提供一个排队机制：

<div style="margin-left:3rem">
    <img src="./images/queuing-mechanism.png" alt="queuing-mechanism" width="500" />
</div>

 - 指标收集器将指标数据推送到kafka
 - 消费者或流处理服务（例如 Apache Storm、Flink 或 Spark）处理数据并将其推送到时序数据库

这种方法有几个优点：
 - Kafka作为高可靠、可扩展的分布式消息平台
 - 它将数据收集和数据处理相互解耦
 - 通过保留Kafka中的数据可以防止数据丢失

Kafka 可以为每个指标名称配置一个分区，以便消费者可以按指标名称聚合数据。
为了扩展这一点，我们可以进一步按标签/标签进行分区，并对首先收集的指标进行分类/优先排序。

<div style="margin-left:3rem">
    <img src="./images/metrics-collection-kafka.png" alt="metrics-collection-kafka" width="500" />
</div>

使用 Kafka 解决此问题的主要缺点是维护/操作开销。
另一种方法是使用大规模摄取系统，例如 [Gorilla](https://www.vldb.org/pvldb/vol8/p1816-teller.pdf)。
可以说，使用它与使用 Kafka 进行队列一样具有可扩展性。

### **可以发生聚合的地方**
指标可以在多个地方聚合。不同的选择之间存在权衡：
 - **采集代理**：客户端采集代理仅支持简单的聚合逻辑。例如收集 1m 的计数器并将其发送到指标收集器。
 - **摄取管道**：为了在写入数据库之前聚合数据，我们需要像 Flink 这样的流处理引擎。这减少了写入量，但由于我们不存储原始数据，因此我们会失去数据精度。
 - **查询端**：当我们通过可视化系统运行查询时，我们可以聚合数据。没有数据丢失，但由于大量数据处理，查询可能会很慢。

### **查询服务**
与时序数据库分开的查询服务将可视化和警报系统与数据库解耦，这使我们能够将数据库与客户端解耦并随意更改。

我们可以在这里添加一个Cache层来减少时序数据库的负载：

<div style="margin-left:3rem">
    <img src="./images/cache-layer-query-service.png" alt="cache-layer-query-service" width="500" />
</div>

我们还可以避免完全添加查询服务，因为大多数可视化和警报系统都有强大的插件可以与大多数时间序列数据库集成。
有了精心选择的时间序列数据库，我们可能也不需要引入自己的缓存层。

大多数时序数据库不支持SQL，因为它对于查询时序数据无效。以下是计算指数移动平均值的 SQL 查询示例：


```
select id,
       temp,
       avg(temp) over (partition by group_nr order by time_read) as rolling_avg
from (
  select id,
         temp,
         time_read,
         interval_group,
         id - row_number() over (partition by interval_group order by time_read) as group_nr
  from (
    select id,
    time_read,
    "epoch"::timestamp + "900 seconds"::interval * (extract(epoch from time_read)::int4 / 900) as interval_group,
    temp
    from readings
  ) t1
) t2
order by time_read;
```


这是 Flux 中的相同查询 - InfluxDB 中使用的查询语言：


```
from(db:"telegraf")
  |> range(start:-1h)
  |> filter(fn: (r) => r._measurement == "foo")
  |> exponentialMovingAverage(size:-10s)
```


### **存储层**
仔细选择时序数据库很重要。

根据 Facebook 发布的研究，约 85% 的运营存储查询都是针对过去 26 小时内的数据。

如果我们选择一个利用此属性的数据库，它可能会对系统性能产生重大影响。 InfluxDB 就是这样的选择之一。

无论我们选择什么数据库，我们都可以采用一些优化。

数据编码和压缩可以显着减小数据的大小。这些特征通常被内置到一个好的时间序列数据库中。

<div style="margin-left:3rem">
    <img src="./images/double-delta-encoding.png" alt="double-delta-encoding" width="500" />
</div>

在上面的示例中，我们可以存储时间戳增量，而不是存储完整时间戳。

我们可以采用的另一种技术是下采样 - 将高分辨率数据转换为低分辨率，以减少磁盘使用。

我们可以将其用于旧数据，并让数据科学家配置规则，例如：
 - 7d - 无下采样
 - 30d - 采样时间减少至 1 分钟
 - 1y - 下采样至 1h

例如，这是一个 10 秒分辨率指标表：
| 公制 | 时间戳 | 主机名 | 指标值 |
|--------|----------------------|----------|--------------|
| 中央处理器 | 2021-10-24T19:00:00Z | 主机A | 10           |
| 中央处理器 | 2021-10-24T19:00:10Z | 主机A | 16           |
| 中央处理器 | 2021-10-24T19:00:20Z | 主机A | 20           |
| 中央处理器 | 2021-10-24T19:00:30Z | 主机A | 30           |
| 中央处理器 | 2021-10-24T19:00:40Z | 主机A | 20           |
| 中央处理器 | 2021-10-24T19:00:50Z | 主机A | 30           |

下采样至 30 秒分辨率：
| 公制 | 时间戳 | 主机名 | 指标值（平均值） |
|--------|----------------------|----------|--------------------|
| 中央处理器 | 2021-10-24T19:00:00Z | 主机A | 19                 |
| 中央处理器 | 2021-10-24T19:00:30Z | 主机A | 25                 |

最后，我们还可以使用冷存储来使用不再使用的旧数据。冷藏的财务成本要低得多。

### **警报系统**

<div style="margin-left:3rem">
    <img src="./images/alerting-system.png" alt="alerting-system" width="500" />
</div>

配置已加载到缓存服务器。规则通常以 YAML 格式定义。这是一个例子：


```
- name: instance_down
  rules:

  # Alert for any instance that is unreachable for >5 minutes.
  - alert: instance_down
    expr: up == 0
    for: 5m
    labels:
      severity: page
```


警报管理器从缓存中获取警报配置。根据配置规则，它还会按预定义的时间间隔调用查询服务。
如果满足规则，则会创建警报事件。

警报管理器的其他职责是：
 - 过滤、合并和删除重复警报。例如，如果单个实例的警报被多次触发，则仅生成一个警报事件。
 - 访问控制 - 将警报管理操作仅限于某些个人非常重要
 - 重试 - 管理器确保警报至少传播一次。

警报存储是一个键值数据库，类似于 Cassandra，它保存所有警报的状态。它确保通知至少发送一次。
一旦触发警报，就会将其发布到 Kafka。

最后，警报消费者从 Kafka 中提取警报数据并将通知发送到不同的渠道 - 电子邮件、短信、PagerDuty、webhooks。

在现实世界中，有许多现成的警报系统解决方案。很难证明在内部构建自己的系统是合理的。

### **可视化系统**
可视化系统显示一段时间内的指标和警报。这是使用 Grafana 构建的仪表板：

<div style="margin-left:3rem">
    <img src="./images/grafana-dashboard.png" alt="grafana-dashboard" width="500" />
</div>

构建高质量的可视化系统非常困难。很难证明不使用像 Grafana 这样的现成解决方案是合理的。

---

## 第四步：总结
这是我们的最终设计：

<div style="margin-left:3rem">
    <img src="./images/final-design.png" alt="final-design" width="500" />
</div>
