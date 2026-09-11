# 第 4 章：设计速率限制器

## 简介
本章探讨速率限制器的设计和实现，速率限制器是用于控制客户端或服务发送的流量速率的系统组件。速率限制器对于防止滥用、降低成本和确保服务器资源的稳定性至关重要。它们的使用示例包括限制帖子、帐户创建和奖励索赔。

## 速率限制的好处
- **防止 DoS 攻击：** 阻止过多的调用以避免资源匮乏。
- **降低成本：**限制不必要的请求以减少服务器费用。
- **防止过载：** 过滤掉过多的请求以稳定服务器性能。

## 第 1 步：了解问题
### 主要特点
- 服务器端 API 速率限制器。
- 支持多种节流规则。
- 处理分布式环境中的大型系统。
- 独立服务或应用程序级代码的选项。
- 当受到限制时通知用户。

### 要求
- 准确的请求限制。
- 最小延迟。
- 内存使用率低。
- 分布式能力。
- 明确的异常处理。
- 高容错性。

## 第 2 步：高层设计
### 安置选项
<div style="margin-left:2rem">
    <img src="./images/rate_limiter_architecture.png"  alt="Rate Limiting Middleware Architecture" width="550">
</div>

1. **客户端实现：** 由于潜在的误用而不可靠。
2. **服务器端实现：** 控制和可靠性的首选。
3. **中间件（API 网关）：** 集成速率限制的灵活选项。


### 安置指南
- 评估当前的技术堆栈并选择有效的选项。
- 根据业务需求选择合适的算法。
- 如果使用微服务，请使用 API 网关。
- 如果资源有限，请选择商业解决方案。

## 步骤 3：速率限制算法
### 1. 令牌桶
<div style="margin-left:2rem">
  <img src="./images/token-bucket.png"  alt="Token Bucket Algorithm" width="550">
</div>

- **说明：** 令牌以固定速率添加到桶中；每个请求都会消耗一个令牌。
- **参数：** 铲斗尺寸和填充率。
- **优点：** 易于实施、内存高效、支持流量突发。
- **缺点：**需要仔细调整参数。



### 2、漏斗
<div style="margin-left:2rem">
  <img src="./images/leaking-bucket.png"  alt="Leaking Bucket Algorithm" width="550">
</div>

- **描述：** 使用 FIFO 队列以固定速率处理请求。
- **优点：** 内存效率高，流出率稳定。
- **缺点：** 流量突发可能会延迟最近的请求。
  

示例：https://github.com/uber-go/ratelimit



### 3. 固定窗口柜台
<div style="margin-left:2rem">
  <img src="./images/fixed-window-counter.png"  alt="Fixed Window Counter" width="550">
</div>

- **描述：** 将时间划分为固定的间隔，并使用计数器来限制请求。
- **优点：** 简单、高效，适用于特定用例。
- **缺点：** 窗口边缘的流量峰值可能会超出限制。

- 时间窗口边缘突然出现的交通流量
可能会导致请求超过允许的配额。

  <img src="./images/fixed-window-issue.png"  alt="Fixed Window Issue" width="550">


### 4. 滑动窗口日志
<div style="margin-left:2rem">
  <img src="./images/sliding-window-log.png"  alt="Sliding Window Log" width="550">
</div>

- **描述：** 跟踪时间戳以允许滚动时间窗口。
- **优点：** 准确的速率限制。
- **缺点：** 高内存消耗。
  


### 5. 滑动窗口柜台
<div style="margin-left:2rem">
  <img src="./images/sliding-window-counter.png"  alt="Fixed Window Counter" width="550">
</div>

- **描述：** 结合固定窗口和滑动对数方法来平滑尖峰。
- **优点：** 内存效率高，可处理流量突发。
- **缺点：** 近似可能并不完全严格。
  



## 高层架构
<div style="margin-left:2rem">
  <img src="./images/architecture.png" style="margin-left: 40px; margin-top: 40px; margin-bottom: 20px;" alt="Architecture" width="550">
</div>

- **数据存储：** 使用内存缓存（例如 Redis）进行快速计数器操作。
- **步骤：**
  1. 客户端向中间件发送请求。
  2. 中间件检查 Redis 中的计数器。
  3. 根据限制处理或拒绝请求。


## 高级注意事项
### 分布式环境
- **挑战：** 竞争条件、同步问题。
- **解决方案：** 在 Redis 中使用锁、Lua 脚本或排序集。使用集中式数据存储进行同步。

### 性能优化
- 多数据中心设置可减少延迟。
- 用于同步的最终一致性模型。

### 监控
- 定期分析以确保算法有效性并根据需要调整规则。

