# 第12章：设计聊天系统

## 简介
**聊天系统**支持用户之间的实时消息传递。本章重点介绍聊天应用程序的设计，其中包括：
- **一对一聊天**
- **群聊（最多 100 位用户）**
- **在线状态指示器**
- **多设备支持**
- **推送通知**

该系统的目标是**5000万每日活跃用户（DAU）**并永久存储聊天历史记录。

---

## 第 1 步：了解问题

### 要求
1. **特点：**
   - 一对一和群聊（最多 100 名成员）。
   - 基于文本的消息（最多 100,000 个字符）。
   - 在线/离线指标。
   - 支持多种设备。
   - 推送通知。
2. **规模：** 设计为 5000 万 DAU。
3. **存储：**永久聊天记录。

---

## 第 2 步：高层设计

### 通讯协议
1. **发送方：** 用于发送消息的 HTTP，利用持久连接来提高效率。

      <div style="margin-left:2rem">
      <img src="./images/basic-design.png" alt="Basic Design" width="500">    
      <div>

2. **接收端：**
   - **投票：**
      - 客户端定期询问服务器是否有可用消息。
      - 由于频繁、冗余的请求，效率低下。

         <img src="./images/polling.png" alt="Polling" width="400">    

   - **长轮询：**
      - 保持连接打开，直到消息到达。
      - 对于不活跃的用户来说效率低下。

         <img src="./images/long-polling.png" alt="Long Polling" width="400">

   - **网络套接字：**
      - 用于实时通信的双向持久连接，选择用于发送和接收消息。
      - 使用 WebSockets (ws) 协议发送和接收消息。

         <img src="./images/websocket.png" alt="Websocket"  width="400" >    
   
---

### 组件

<div style="margin-left:5rem">
   <img src="./images/high-level-stateless-arch.png" alt="High Level Architecture" height="350">    
   <img src="./images/high-level-statefull-arch.png" alt="High Level Architecture" height="350" width="550">
</div>

1. **无状态服务：**
   - 处理注册、登录和用户配置文件管理。
   - 与服务发现集成以推荐最佳的聊天服务器。
2. **有状态服务：**
   - 聊天服务器维护持久的 WebSocket 连接。
   - 负责消息的传递和同步。
3. **第三方集成：**
   - 推送通知服务通知用户有新消息。
   - 有关通知实施的信息，请参阅“通知系统”一章。


---
### 设计

客户端维护与聊天服务器的持久 WebSocket 连接以进行实时消息传递。

<div style="margin-left:3rem">
      <img src="./images/high-level-design.png" alt="High Level Design" width="450"> 
</div>

- 聊天服务器促进消息发送/接收。
- 状态服务器管理在线/离线状态。
- API 服务器处理一切事务，包括用户登录、注册、更改个人资料等。
- 通知服务器发送推送通知。
- 最后，键值存储用于存储聊天记录。键值存储用于聊天记录数据的数据库，原因如下：
   - 它允许轻松水平缩放。
   - KV 存储提供非常低的数据访问延迟。
   - 关系数据库不能很好地处理长尾数据。当指数增长时
大的随机访问是昂贵的。
   - KV 存储被其他经过验证的可靠聊天应用程序采用。例如，
Facebook Messenger 和 Discord。


以下是一对一聊天和群聊的数据模型。
   - 主键是消息id，它有助于决定消息顺序。
   - 对于群聊，复合主键是（channel_id，message_id）。
      - ID 可以使用像 Snowflake 这样的全局 64 位序列号生成器来生成。
      - 更好的方法是使用本地序列号生成器。本地意味着 ID 仅在组内是唯一的。
      - 本地ID起作用的原因是维持一对一通道或组通道内的消息顺序就足够了。
      
      <img src="./images/one-to-one-chat.png" alt="One to one chat design" width="300">   
      <img src="./images/group-chat.png" alt="Group chat design" width="300">   


## 第 3 步：深入设计

### 服务发现

<div style="margin-left:3rem">
   <img src="./images/zookeeper.png" alt="Zookeeper" width="400">   
</div>

- 服务发现的主要作用是为基于客户端的客户端推荐最佳的聊天服务器。
根据地理位置、服务器容量等标准。
- 使用 **Apache Zookeeper** 根据地理位置和服务器容量等标准分配聊天服务器。
- 确保有效的负载分配并最大限度地减少延迟。


### 消息传递流程
#### 一对一聊天


1. 用户 A 向聊天服务器 1 发送消息。
2. 聊天服务器 1 分配唯一的消息 ID 并将该消息存储在键值存储中。
3. 如果用户 B 在线，则消息将转发到聊天服务器 2，从而保持持久的 WebSocket 连接。
4. 如果用户B离线，则发送推送通知。



#### 群聊

<div style="margin-left:3rem">
   <img src="./images/group-chat-flow.png" alt="Group Chat Flow" width="400">  
</div>

- 邮件将被复制到组中每个收件人的单独收件箱中。
- 简化同步，但对于较大的组来说变得昂贵。
- 在接收方，一个接收方可以接收来自多个用户的消息。每个收件人
有一个收件箱（消息同步队列），其中包含来自不同发件人的消息。

---

#### 消息同步

许多用户拥有多个设备。我们需要跨设备同步消息。
每个设备都维护一个名为 cur_max_message_id 的变量，该变量跟踪最新的消息
设备上的消息 ID。满足以下两个条件的消息被视为
作为新闻消息：

<div style="margin-left:3rem">
   <img src="./images/message-synchronization.png" alt="Message Synchronization"  width="400">  
</div>

- 接收者ID等于当前登录的用户ID。
- 键值存储中的消息 ID 大于 cur_max_message_id

---

### 在线状态
1. **心跳机制：**
   <div style="margin-left:3rem">
      <img src="./images/heartbeat-mechanism.png" alt="Heartbeat Mechanism" width="400"> 
   </div>
   
   - 客户端定期向状态服务器发送心跳以表明它们处于在线状态。
   - 如果在阈值（例如 x = 30）内未收到心跳，则用户将被标记为离线。

     

2. **扇出模型：**

   <div style="margin-left:3rem">
      <img src="./images/fanout-presence.png" alt="Fanout Presence" width="400"> 
   </div>

   - 使用发布-订阅模型将状态更新推送给朋友，其中每个朋友对维护一个频道。
   - 当用户A在线状态发生变化时，将事件发布到三个通道：通道A-B、A-C、A-D。
   - 这三个频道分别由用户 B、C 和 D 订阅，获得在线状态更新。
   - 上述设计对于小用户群来说是有效的。


---

## 其他注意事项
### 可扩展性
- **水平扩展：** 随着用户数量的增加添加服务器。
- **负载平衡：** 在服务器之间均匀分配流量。
- **缓存：**减少数据库负载并改善延迟。

### 错误处理
- **重试机制：** 通过重试和排队来处理消息传递失败。
- **服务器故障：** 使用服务发现在发生故障时分配新服务器。

### 未来的扩展
1. **媒体支持：** 添加对照片和视频的处理，包括压缩和云存储。
2. **端到端加密：** 确保消息隐私。
3. **客户端缓存：**减少数据传输以获得更好的性能。
4. **改进加载时间：** 使用地理上分布式的缓存网络。

