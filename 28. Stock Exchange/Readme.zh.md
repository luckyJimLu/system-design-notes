# 第28章：证券交易所

## 简介
我们将在本章中设计一个**电子证券交易所**。

其基本功能是高效匹配买家和卖家。

主要证券交易所包括**纽约证券交易所**、**纳斯达克**等。

<div style="margin-left:3rem">
    <img src="./images/world-stock-exchanges.png" alt="world-stock-exchanges" width="500" />
</div>

---

## 第 1 步：了解问题并确定设计范围
 * C：我们要交易哪些证券？股票、期权还是期货？
 * I：为了简单起见，只显示股票
 * C：支持哪些订单类型 - 下单、取消、替换？限价单、市价单、条件单又如何？
 * I：我们需要支持下单和取消订单。我们只需要考虑订单类型的限价订单。
 * C：系统需要支持盘后交易吗？
 * 我：没有，只是正常交易时间
 * C：您能介绍一下交易所的基本功能吗？
 * I：客户可以下限价单或取消限价单，并实时接收撮合交易。他们应该能够实时查看订单簿。
 * C：交易所的规模是多少？
 * I：数以万计的用户同时交易，约 100 个交易品种。每天数十亿订单。我们还需要支持合规风险检查。
 * C：什么样的风险检查？
 * I：我们来做简单的风险检查——例如限制用户一天只能交易 100 万股苹果股票
 * C：用户钱包参与度如何？
 * I：下单前我们需要确保客户有足够的资金。用于待处理订单的资金需要扣留，直到订单最终确定。

### **非功能性需求**
面试官提到的规模暗示我们要设计一个中小型的交易所。
我们还需要确保未来支持更多符号和用户的灵活性。

其他非功能性需求：
 * 可用性 - 至少 99.99%。停机可能会损害声誉
 * 容错——需要容错和快速恢复机制来限制生产事件的影响
 * 延迟 - 往返延迟应为毫秒级别，重点关注第 99 个百分位。持续较高的 99p 延迟会给少数用户带来糟糕的体验。
 * 安全——我们应该有一个账户管理系统。为了合法合规，我们需要支持KYC来验证用户身份。我们还应该保护公共资源免受 DDoS 攻击。

### **粗略估计**
 * 100 个交易品种，每天 10 亿个订单
 * 正常交易时间为09:30至16:00（6.5小时）
 * QPS = 10 亿 / 6.5 / 3600 = 43000
 * 峰值QPS = 5*QPS = 215000
 * 开市时交易量明显增加

---

## 第 2 步：提出高级设计并获得认可

### **商业知识101**
让我们讨论一些与交换相关的基本概念。

经纪人调解交易所和最终用户（Robinhood、Fidelity 等）之间的交互。

机构客户使用专门的交易软件进行大量交易。他们需要专门的治疗。
例如，在大批量交易时进行订单拆分，以避免影响市场。

订单类型：
 * 限价 - 以固定价格买入或卖出。它可能无法立即找到匹配项，或者可能部分匹配。
 * 市场 - 未指定价格。立即以当前市场价格执行。

价格：
 * 出价 - 买家愿意购买股票的最高价格
 * 询问 - 卖家愿意出售股票的最低价格

美国市场有三级报价——L1、L2、L3。

L1 市场数据包含最佳买入/卖出价格和数量：

<div style="margin-left:3rem">
    <img src="./images/l1-price.png" alt="l1-price" width="500" />
</div>

L2 包括更多价格级别：

<div style="margin-left:3rem">
    <img src="./images/l2-price.png" alt="l2-price" width="500" />
</div>

L3显示级别和每个级别的排队数量：

<div style="margin-left:3rem">
    <img src="./images/l3-price.png" alt="l3-price" width="500" />
</div>

烛台显示市场开盘价和收盘价，以及给定区间内的最高价和最低价：

<div style="margin-left:3rem">
    <img src="./images/candlestick.png" alt="candlestick" width="500" />
</div>

FIX 是一种用于交换证券交易信息的协议，被大多数供应商使用。证券交易示例：

```
8=FIX.4.2 | 9=176 | 35=8 | 49=PHLX | 56=PERS | 52=20071123-05:30:00.000 | 11=ATOMNOCCC9990900 | 20=3 | 150=E | 39=E | 55=MSFT | 167=CS | 54=1 | 38=15 | 40=2 | 44=15 | 58=PHLX EQUITY TESTING | 59=0 | 47=C | 32=0 | 31=0 | 151=15 | 14=0 | 6=0 | 10=128 |
```


### **高层设计**

<div style="margin-left:3rem">
    <img src="./images/high-level-design.png" alt="high-level-design" width="500" />
</div>

贸易流程：
 * 客户通过交易界面下单
 * 经纪商将订单发送至交易所
 * 订单通过客户端网关进入交换，客户端网关进行验证、速率限制、身份验证等。订单被转发到订单管理器。
 * 订单经理根据风险经理设定的规则进行风险检查
 * 通过风险检查后，订单管理器验证钱包中有足够的资金用于订单
 * 订单被发送到匹配引擎。当找到匹配时，匹配引擎会发出两个执行指令（称为“执行”）以进行买入和卖出。这两个订单都经过排序，因此具有确定性。
 * 执行结果返回给客户端。

市场数据流向（M1-M3）：
 * 匹配引擎生成执行流，发送给市场数据发布者
 * 市场数据发布者构建蜡烛图并将其发送到数据服务
 * 市场数据存储在专门的存储器中以进行实时分析。经纪商连接到数据服务以获取及时的市场数据。

记者流程（R1-R2）：
 * 报告者从订单和执行中收集所有必要的报告字段并将其写入数据库
 * 报告字段 - client_id、价格、数量、订单类型、已填充数量、剩余数量

交易流位于关键路径上，而其余流则不是，因此它们之间的延迟要求不同。

#### 交易流程
交易流程位于关键路径上，因此，应该对其进行高度优化以实现低延迟。

匹配引擎是其核心，也称为交叉引擎。主要职责：
 * 维护每个交易品种的订单簿 - 交易品种的买入/卖出订单列表。
 * 匹配买卖订单 - 匹配会导致两次执行（成交），买方和卖方各执行一次。该功能必须快速且准确
 * 将执行流作为市场数据分发
 * 匹配必须按确定的顺序产生。高可用性的基础

接下来是排序器 - 它是关键组件，通过使用序列 ID 标记每个入库订单和出库订单，使匹配引擎具有确定性。

<div style="margin-left:3rem">
    <img src="./images/sequencer.png" alt="sequencer" width="500" />
</div>

我们出于以下几个原因对入库订单和出库订单进行盖章：
 * 及时性和公平性
 * 快速恢复/重播
 * 一次性保证

从概念上讲，我们可以使用 Kafka 作为排序器，因为它实际上是一个入站和出站消息队列。然而，我们将自己实现它以实现更低的延迟。

订单管理器管理订单状态。它还与匹配引擎交互 - 发送订单和接收订单。

订单经理的职责：
 * 发送订单进行风险检查 - 例如验证用户的交易量小于 100 万
 * 检查用户钱包中的订单并验证是否有足够的资金来执行该订单
 * 它将订单发送到定序器并发送到匹配引擎。为了减少带宽，仅将必要的订单信息传递给匹配引擎
 * 从定序器接收执行（填充），然后通过客户端网关发送到代理

实现订单管理器的主要挑战是状态转换管理。事件溯源是一种可行的解决方案（深入讨论）。

最后，客户端网关接收用户的订单并将其发送给订单管理器。其职责：

<div style="margin-left:3rem">
    <img src="./images/client-gateway.png" alt="client-gateway" width="500" />
</div>

由于客户端网关位于关键路径上，因此它应该保持轻量级。

不同的客户端可以有多个客户端网关。例如，colo 引擎是一个交易引擎服务器，由经纪商在交易所的数据中心租用：

<div style="margin-left:3rem">
    <img src="./images/client-gateways.png" alt="client-gateways" width="500" />
</div>

#### 市场数据流
市场数据发布者从匹配引擎接收执行并从执行流构建订单簿/烛台图。

该数据被发送到数据服务，数据服务负责向订阅者显示聚合数据：

<div style="margin-left:3rem">
    <img src="./images/market-data.png" alt="market-data" width="500" />
</div>

#### 报告流程
记者并不处于关键路径上，但它仍然是一个重要的组成部分。

<div style="margin-left:3rem">
    <img src="./images/reporting-flow.png" alt="reporting-flow" width="500" />
</div>

它负责交易历史、税务报告、合规报告、结算等。
延迟并不是报告流程的关键要求。准确性和合规性更为重要。

### **API设计**
客户通过经纪商与证券交易所互动，下订单、查看执行情况、市场数据、下载历史数据进行分析等。

我们使用 RESTful API 在客户端网关和代理之间进行通信。

对于机构客户，使用专有协议来满足他们的低延迟要求。

创建订单：

```
POST /v1/order
```


参数：
 * 符号 - 股票符号。字符串
 * side - 买入或卖出。字符串
 * 价格 - 限价单的价格。长
 * orderType - 限价或市价（我们在设计中仅支持限价订单）。字符串
 * 数量 - 订单的数量。长

回应：
 * id - 订单的 ID。长
 * creationTime - 订单的系统创建时间。长
 * fillQuantity - 已成功执行的数量。长
 * 剩余数量 - 仍待执行的数量。长
 * 状态 - 新的/取消的/已填充的。字符串
 * 其余属性与输入参数相同

获取执行：

```
GET /execution?symbol={:symbol}&orderId={:orderId}&startTime={:startTime}&endTime={:endTime}
```


参数：
 * 符号 - 股票符号。细绳
 * orderId - 订单的 ID。选修的。字符串
 * startTime - 查询纪元\[11\]中的开始时间。长
 * endTime - 查询结束时间（纪元）。长

回应：
 * executions - 范围内每次执行的数组（请参阅下面的属性）。数组
 * id - 执行的 ID。长
 * orderId - 订单的 ID。长
 * 符号 - 股票符号。字符串
 * side - 买入或卖出。字符串
 * 价格 - 执行的价格。长
 * orderType - 限价或市价。字符串
 * 数量 - 填充数量。长

获取订单簿：

```
GET /marketdata/orderBook/L2?symbol={:symbol}&depth={:depth}
```


参数：
 * 符号 - 股票符号。字符串
 * 深度 - 每边的订单簿深度。 INT

回应：
 * bids - 包含价格和大小的数组。数组
 * 询问 - 包含价格和尺寸的数组。数组

获取烛台：

```
GET /marketdata/candles?symbol={:symbol}&resolution={:resolution}&startTime={:startTime}&endTime={:endTime}
```


参数：
 * 符号 - 股票符号。字符串
 * 分辨率 - 烛台图的窗口长度（以秒为单位）。长
 * startTime - 纪元中窗口的开始时间。长
 * endTime - 纪元中窗口的结束时间。长

回应：
 * Candles - 包含每个烛台数据的数组（下面列出的属性）。数组
 * 开盘价 - 每个烛台的开盘价。双人间
 * 收盘价 - 每个烛台的收盘价。双人间
 * high - 每个烛台的最高价格。双倍的
 * low - 每个烛台的最低价格。双人间

### **数据模型**
我们交换的数据主要分为三种类型：
 * 产品、订单、执行
 * 订单簿
 * 烛台图

#### 产品、订单、执行
产品描述了交易品种的属性——产品类型、交易品种、UI显示品种等。

该数据不会经常更改，它主要用于在 UI 中呈现。

订单代表买入/卖出订单的指令。执行是出站匹配结果。

这是数据模型：

<div style="margin-left:3rem">
    <img src="./images/product-order-execution-data-model.png" alt="product-order-execution-data-model" width="500" />
</div>

我们在所有三个流程中都会遇到订单和执行：
 * 在关键路径中，它们在内存中进行处理以获得高性能。它们被存储并从测序仪中恢复。
 * 报告者将命令和执行写入数据库以报告用例
 * 执行被转发到市场数据以重建订单簿和烛台图

#### 订单簿
订单簿是一种工具的买入/卖出订单列表，按价格水平组织。

该模型的有效数据结构需要满足：
 * 恒定的查找时间 - 获取价格水平或价格水平之间的交易量
 * 快速添加/执行/取消操作
 * 查询最佳买价/卖价
 * 迭代价格水平

订单簿执行示例：

<div style="margin-left:3rem">
    <img src="./images/order-book-execution.png" alt="order-book-execution" width="500" />
</div>

完成这笔大订单后，价格随着买卖价差扩大而上涨。

伪代码中的订单簿实现示例：

```
class PriceLevel{
    private Price limitPrice;
    private long totalVolume;
    private List<Order> orders;
}

class Book<Side> {
    private Side side;
    private Map<Price, PriceLevel> limitMap;
}

class OrderBook {
    private Book<Buy> buyBook;
    private Book<Sell> sellBook;
    private PriceLevel bestBid;
    private PriceLevel bestOffer;
    private Map<OrderID, Order> orderMap;
}
```


为了更有效的实现，我们可以使用双向链表而不是标准列表：
 * 下一个新订单的时间复杂度为 O(1)，因为我们将订单添加到列表的尾部。
 * 匹配订单的时间复杂度为 O(1)，因为我们要从头部删除订单
 * 取消订单是指从订单簿中删除订单。我们利用 `orderMap` 进行 O(1) 查找和 O(1) 删除（因为 `Order` 引用了列表中的前一个元素）。

<div style="margin-left:3rem">
    <img src="./images/order-book-impl.png" alt="order-book-impl" width="500" />
</div>

这种数据结构也被用在市场数据服务中来重建订单簿。

#### 烛台图
蜡烛图数据是在市场数据服务中根据时间间隔内处理订单来计算的：

```
class Candlestick {
    private long openPrice;
    private long closePrice;
    private long highPrice;
    private long lowPrice;
    private long volume;
    private long timestamp;
    private int interval;
}

class CandlestickChart {
    private LinkedList<Candlestick> sticks;
}
```


一些避免消耗过多内存的优化：
 * 使用预分配的环形缓冲区来保存内存条以减少分配数量
 * 限制内存中的内存条数量，并将其余内存保存到磁盘

我们将使用内存列式数据库（例如 KDB）进行实时分析。收盘后，数据保存在历史数据库中。

---

## 第 3 步：深入设计
关于现代交易所需要注意的一件有趣的事情是，与大多数其他软件不同，它们通常在一台巨大的服务器上运行所有内容。

让我们来探讨一下细节。

### **性能**
对于交易所来说，所有百分位数具有良好的总体延迟非常重要。

我们如何减少延迟？
 * 减少关键路径上的任务数量
 * 通过减少网络/磁盘使用和/或减少任务执行时间来缩短每个任务所花费的时间

为了实现第一个目标，我们从关键路径中剥离了所有无关的责任，甚至删除了日志记录以实现最佳延迟。

如果我们遵循最初的设计，就会存在几个瓶颈——服务之间的网络延迟和定序器的磁盘使用情况。

通过这样的设计，我们可以实现数十毫秒的端到端延迟。我们希望达到几十微秒。

因此，我们将把所有内容放在一台服务器上，进程将通过 mmap 作为事件存储进行通信：

<div style="margin-left:3rem">
    <img src="./images/mmap-bus.png" alt="mmap-bus" width="500" />
</div>

另一种优化是使用应用程序循环（当循环执行关键任务时），固定到同一 CPU 以避免上下文切换：

<div style="margin-left:3rem">
    <img src="./images/application-loop.png" alt="application-loop" width="500" />
</div>

使用应用程序循环的另一个副作用是不存在锁争用 - 多个线程争夺同一资源。

现在让我们探讨一下 mmap 的工作原理 - 它是一个 UNIX 系统调用，它将磁盘上的文件映射到应用程序的内存。

我们可以使用的一个技巧是在 `/dev/shm` 中创建文件，它代表“共享内存”。因此，我们根本没有磁盘访问权限。

### **事件来源**
事件溯源在[数字钱包章节](../chapter28)中进行了深入讨论。参考它的所有细节。

简而言之，我们不存储当前状态，而是存储不可变的状态转换：

<div style="margin-left:3rem">
    <img src="./images/event-sourcing.png" alt="event-sourcing" width="500" />
</div>

 * 左边 - 传统模式
 * 右侧 - 事件源架构

到目前为止，我们的设计如下：

<div style="margin-left:3rem">
    <img src="./images/design-so-far.png" alt="design-so-far" width="500" />
</div>

 * 外部域使用 FIX 协议与我们的客户端网关交互
 * 订单管理器接收新订单事件，验证它并将其添加到其内部状态。然后订单被发送到匹配的核心
 * 如果顺序匹配，则生成 `OrderFilledEvent` 并通过 mmap 发送
 * 其他组件订阅事件存储并完成其处理部分

一项额外的优化 - 所有组件都保存订单管理器的副本，该副本被打包为库以避免管理订单的额外调用

此设计中的定序器不再是事件存储，而是单个编写器，在将事件转发到事件存储之前对事件进行排序：

<div style="margin-left:3rem">
    <img src="./images/sequencer-deep-dive.png" alt="sequencer-deep-dive" width="500" />
</div>

### **高可用性**
我们的目标是 99.99% 的可用性 - 每天只有 8.64 秒的停机时间。

为了实现这一目标，我们必须识别交换架构中的单点故障：
 * 设置处于备用状态的关键服务（例如匹配引擎）的备份实例
 * 积极自动化故障检测和故障转移到备份实例

通过添加更多服务器，可以轻松水平扩展客户端网关等无状态服务。

对于有状态组件，我们可以处理入站事件，但如果我们不是领导者，则不能发布出站事件：

<div style="margin-left:3rem">
    <img src="./images/leader-election.png" alt="leader-election" width="500" />
</div>

为了检测主副本是否已关闭，我们可以发送心跳来检测其是否无法正常工作。

该机制仅在单个服务器的边界内起作用。
如果我们想扩展它，我们可以将整个服务器设置为热/温副本，并在发生故障时进行故障转移。

为了跨副本复制事件存储，我们可以使用可靠的 UDP 来实现更快的通信。

### **容错**
如果即使是温暖的实例也下降了怎么办？这是一个小概率事件，但我们应该做好准备。

大型科技公司通过将核心数据复制到多个城市的数据中心来解决这个问题，以减轻自然灾害等影响。

需要考虑的问题：
 * 如果主实例发生故障，我们如何以及何时故障转移到备份实例？
 * 我们如何在备份实例中选择leader呢？
 * 所需的恢复时间是多少（RTO - 恢复时间目标）？
 * 需要恢复哪些功能？我们的系统可以在降级条件下运行吗？

如何解决这些问题：
 * 系统可能会由于错误（影响主副本和副本）而关闭，我们可以使用混沌工程来显示边缘情况和灾难性结果，例如
 * 但最初，我们可以手动执行故障转移，直到我们收集到有关系统故障模式的足够知识
 * 可以使用领导者选举（例如 Raft）来确定在主副本发生故障时哪个副本成为领导者

复制如何跨不同服务器工作的示例：

<div style="margin-left:3rem">
    <img src="./images/replication-across-servers.png" alt="replication-across-servers" width="500" />
</div>

领导者选举术语示例：

<div style="margin-left:3rem">
    <img src="./images/leader-election-terms.png" alt="leader-election-terms" width="500" />
</div>

有关 Raft 工作原理的详细信息，[查看](https://thesecretlivesofdata.com/raft/)

最后，我们还需要考虑丢失容忍度——在事情变得严重之前我们可以丢失多少数据？
这将决定我们备份数据的频率。

对于证券交易所来说，数据丢失是不可接受的，所以我们必须经常备份数据，并依靠raft的复制来降低数据丢失的概率。

### **匹配算法**
通过伪代码稍微绕一下匹配的工作原理：

```
Context handleOrder(OrderBook orderBook, OrderEvent orderEvent) {
    if (orderEvent.getSequenceId() != nextSequence) {
        return Error(OUT_OF_ORDER, nextSequence);
    }

    if (!validateOrder(symbol, price, quantity)) {
        return ERROR(INVALID_ORDER, orderEvent);
    }

    Order order = createOrderFromEvent(orderEvent);
    switch (msgType):
        case NEW:
            return handleNew(orderBook, order);
        case CANCEL:
            return handleCancel(orderBook, order);
        default:
            return ERROR(INVALID_MSG_TYPE, msgType);

}

Context handleNew(OrderBook orderBook, Order order) {
    if (BUY.equals(order.side)) {
        return match(orderBook.sellBook, order);
    } else {
        return match(orderBook.buyBook, order);
    }
}

Context handleCancel(OrderBook orderBook, Order order) {
    if (!orderBook.orderMap.contains(order.orderId)) {
        return ERROR(CANNOT_CANCEL_ALREADY_MATCHED, order);
    }

    removeOrder(order);
    setOrderStatus(order, CANCELED);
    return SUCCESS(CANCEL_SUCCESS, order);
}

Context match(OrderBook book, Order order) {
    Quantity leavesQuantity = order.quantity - order.matchedQuantity;
    Iterator<Order> limitIter = book.limitMap.get(order.price).orders;
    while (limitIter.hasNext() && leavesQuantity > 0) {
        Quantity matched = min(limitIter.next.quantity, order.quantity);
        order.matchedQuantity += matched;
        leavesQuantity = order.quantity - order.matchedQuantity;
        remove(limitIter.next);
        generateMatchedFill();
    }
    return SUCCESS(MATCH_SUCCESS, order);
}
```


该匹配算法使用 FIFO 算法来确定某个价格水平的哪些订单要匹配。

### **决定论**
功能决定论是通过我们使用的定序器技术来保证的。

事件发生的实际时间并不重要：

<div style="margin-left:3rem">
    <img src="./images/determinism.png" alt="determinism" width="500" />
</div>

延迟决定论是我们必须跟踪的。我们可以根据监控 99 或 99.99 百分位延迟来计算它。

可能导致延迟峰值的事情是 Java 中的垃圾收集器事件。

### **市场数据发布者优化**
市场数据发布者从匹配引擎接收匹配结果，并根据这些结果重建订单簿和蜡烛图。

我们只保留部分烛台，因为我们没有无限的内存。客户可以选择他们想要多少详细信息。更详细的信息可能需要更高的价格：

<div style="margin-left:3rem">
    <img src="./images/market-data-publisher.png" alt="market-data-publisher" width="500" />
</div>

环形缓冲区（也称为循环缓冲区）是一个固定大小的队列，头部与尾部相连。该空间是预先分配的以避免分配。数据结构也是无锁的。

优化环形缓冲区的另一种技术是填充，它确保序列号永远不会与其他任何内容一起位于缓存行中。

### **市场数据和组播的分配公平性**
我们需要确保订阅者同时收到数据，因为如果一个人先于另一个人收到数据，就会为他们提供重要的市场洞察力，他们可以利用这些洞察力来操纵市场。

为了实现这一点，我们可以在向订阅者发布数据时使用可靠的 UDP 进行多播。

数据可以通过三种方式通过互联网传输：
 * 单播 - 一个源，一个目的地
 * 广播 - 整个子网的一个来源
 * 多播 - 不同子网上一组主机的一个源

理论上，通过使用多播，所有订阅者应该同时接收数据。

然而，UDP 并不可靠，数据可能无法到达每个人。然而，它可以通过重传来增强。

### **主机托管**
交易所为经纪商提供了将其服务器与交易所托管在同一数据中心的能力。

这大大减少了延迟，可以被视为 VIP 服务。

### **网络安全**
由于存在一些面向互联网的服务，DDoS 对交易所来说是一个挑战。这是我们的选择：
 * 将公共服务和数据与私有服务隔离，这样 DDoS 攻击就不会影响最重要的客户端
 * 使用缓存层来存储不经常更新的数据
 * 强化 URL 抵御 DDoS，例如更喜欢 `https://my.website.com/data/recent` 而不是 `https://my.website.com/data?from=123&to=456`，因为前者更容易缓存
 * 需要有效的白名单/黑名单机制。
 * 速率限制可用于缓解 DDoS

---

## 第四步：总结
其他有趣的注释：
 * 并非所有交易所都依赖将所有内容放在一台大型服务器上，但有些交易所仍然这样做
 * 现代交易所更多地依赖云基础设施和自动做市商（AMM）来避免维护订单簿
