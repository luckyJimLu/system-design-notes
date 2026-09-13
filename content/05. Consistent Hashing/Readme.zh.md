# 第 5 章：设计一致性哈希

## 简介
本章探讨一致性哈希，这是通过在服务器之间有效分配请求和数据来实现水平扩展所必需的技术。它可以最大限度地减少添加或删除服务器时的数据重新分配，并确保数据的均匀分配，以缓解服务器热点等问题。

## 重新哈希问题
### 说明
在传统的哈希方法中，例如`serverIndex = hash(key) % N`，当服务器数量发生变化时，数据重新分配就会出现问题。例如：
- 删除服务器会导致大多数键被重新分配，从而导致缓存未命中。
- 添加服务器会导致不必要的密钥重新分配。

  <img src="./images/server-hashing.png"  alt="Server hashing" width="450">

- 当服务器池的大小固定时，这种方法效果很好。然而，当添加新服务器或删除现有服务器时，就会出现问题。

  <img src="./images/server-hashing-miss.png"  alt="Server hashing Miss" width="450">

### 关键问题
当服务器数量发生变化时，大多数密钥的重新分配会导致效率低下和过载。

## 一致性哈希
### 定义
一致的散列可确保在添加或删除服务器时仅重新映射一小部分密钥。这可以最大限度地减少中断并增强可扩展性。

### 关键概念
1. **哈希空间和环：**哈希空间形成一个连续的环，哈希值从`0`分布到`2^160-1`（例如使用SHA-1等哈希函数）。通过连接两端，我们得到一个环。
    <p align="center">
    <img src="./images/hash-ring.png"  alt="Hash Ring" width="450">
    </p>

- 使用相同的哈希函数 f，我们根据服务器 IP 或名称将服务器映射到环上。

    <p align="center">
    <img src="./images/server-ring.png"  alt="Server Ring" width="450">
    </p>

1. **服务器查找**
- 通过在环上顺时针遍历直到找到服务器来确定密钥的服务器。

  <p align="center">
  <img src="./images/server-lookup.png"  alt="Server Lookup" width="450">
  </p>

2. **添加和删除服务器**
- 添加服务器仅重新分配附近的密钥。只有一小部分密钥被重新分发到新服务器。
  
  <p align="center">
  <img src="./images/adding-server.png"  alt="Adding Server" width="450">
  </p>

- 删除服务器仅影响其范围内的键。只有已删除服务器中的密钥才会按顺时针方向重新分配给下一个服务器。

  <p align="center">
  <img src="./images/removing-server.png"  alt="Removing Server" width="450">
  </p>

## 挑战与解决方案
### 基本方法中的两个问题
1. **分区大小不均匀：** 服务器可能具有不相等的数据分区。
2. **不均匀的密钥分配：** 某些服务器可能会比其他服务器接收更多的密钥。

### 解决方案：虚拟节点
- 每个服务器由均匀分布在环上的多个虚拟节点来表示。
- 虚拟节点改善密钥分配并平衡负载。随着虚拟节点数量的增加，密钥的分布变得更加均衡。这是因为虚拟节点越多，标准差就越小，从而导致数据分布均衡。
   
  <p align="center">
  <img src="./images/virtual-nodes.png"   alt="Virtual Nodes" width="450">
  </p>

## 受影响的按键
添加或删除服务器时：
- **添加的服务器：** 受影响的密钥是新服务器与其前身服务器之间的密钥。
在以下示例中，服务器 4 添加到环中。受影响范围从s4开始（新
添加的节点）并绕环逆时针移动，直到找到服务器（s3）。因此，键
位于s3和s4之间的数据需要重新分配到s4。

  <p align="center">
  <img src="./images/server-addition.png"   alt="Server Addition" width="450">
  </p>

- **已删除的服务器：** 受影响的密钥是已删除的服务器与其前身服务器之间的密钥。在以下示例中，当删除服务器 (s1) 时，受影响的范围从 s1 开始
（删除节点）并绕环逆时针移动，直到找到服务器（s0）。因此，位于 s0 和 s1 之间的密钥必须重新分配给 s2。
   
  <p align="center">
  <img src="./images/server-removed.png"   alt="Server Removed" width="450">
  </p>

## 一致性哈希的好处
- **最小化重新分配：** 仅重新分配一小部分键。
- **可扩展性：** 启用水平缩放。
- **缓解热点：**平衡数据分布以避免服务器过载。

## 实际应用
- 亚马逊 Dynamo 数据库
- 阿帕奇卡桑德拉
- 不和谐
- 阿卡迈CDN
- 磁悬浮负载均衡器

