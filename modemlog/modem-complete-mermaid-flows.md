# Modem 系统完整 Mermaid 流程图

本文统一描述 MCU、Modem、lwIP双网络域、三种独立诊断通道、动态处理、存储所有权、路由选择和安全停机流程。

## 1. Modem 与 MCU 双网络域

```mermaid
flowchart TD
    subgraph MCU["MCU 网络域"]
        APP["业务应用"] --> SOCK["Socket / lwIP"]
        SOCK --> IPC0["ipc0 核间接口"]
        SOCK --> WAN0["wan0 公网接口"]
    end
    subgraph MODEM["Modem 网络域"]
        MIPC["ipc0 本地服务"]
        MLAN["wan-lan0"]
        NAT["路由 / NAT"]
        CELL["cell0 蜂窝公网"]
        MLAN --> NAT --> CELL
    end
    IPC0 <-->|"核间本地通道"| MIPC
    WAN0 <-->|"公网数据通道"| MLAN
```

关键约束：

- `ipc0`没有默认网关；
- 只有`wan0`是MCU默认路由；
- IPC服务绑定确定的IPC地址，不能绑定`INADDR_ANY`；
- Modem只允许`wan-lan0`与`cell0`之间进行受控转发/NAT；
- IPC接口故障时必须失败，不能回退到公网接口。

## 2. MCU的lwIP路由选择

```mermaid
flowchart TD
    SEND["Socket发送数据"] --> DEST{"目标属于IPC子网？"}
    DEST -->|"是"| SRC{"源地址也是IPC或ANY？"}
    SRC -->|"是"| IPC["强制选择ipc0"]
    SRC -->|"否"| DROP["策略拒绝"]
    DEST -->|"否"| ISRC{"源地址属于IPC？"}
    ISRC -->|"是"| DROP
    ISRC -->|"否"| WAN{"wan0可用？"}
    WAN -->|"是"| OUT["选择wan0默认路由"]
    WAN -->|"否"| FAIL["返回无路由"]
    IPC --> GUARD["netif output再次校验"]
    OUT --> GUARD
```

## 3. 三业务独立通道数据流

```mermaid
flowchart TD
    DRIVER["核间驱动 / DMA"] --> DEMUX{"按 Channel ID 分流"}
    DEMUX -->|"Channel 0"| MR["ModemLog RX Ring"]
    DEMUX -->|"Channel 1"| TR["TCPDump Packet Ring"]
    DEMUX -->|"Channel 2"| CR["CHR Message Ring"]
    MR --> CORE["Core Worker"]
    TR --> CORE
    CR --> CORE
    CORE -->|"可选纯计算"| BURST["Burst Worker"]
    CORE --> SQ["Storage请求调度"]
    BURST --> SQ
    SQ --> STORE["Storage Owner"]
    STORE --> FILES["ModemLog / PCAP / CHR 文件"]
```

三种业务必须具备独立：

- 通道ID；
- RX Ring；
- credit和描述符配额；
- 高低水位；
- 丢弃或暂停策略；
- 统计信息。

## 4. 核间接收和调度

```mermaid
sequenceDiagram
    participant Modem
    participant RX as Channel RX
    participant Core as Core Worker
    participant Store as Storage Owner
    participant SD as SD DMA
    Modem->>RX: 独立通道数据
    RX->>RX: 写RX Ring并发布sequence
    RX->>Core: Notify ready bit
    Core->>Core: 按通道预算解析或封装
    Core->>Store: buffer + generation + sequence
    Store->>SD: f_write并等待DMA
    SD-->>Store: 完成或超时
    Store-->>Core: completion
    Core->>Core: 推进commit并释放buffer
```

## 5. Core Worker公平调度

```mermaid
flowchart TD
    WAIT["Core Worker 等待通知"] --> READY["读取ready bitmap"]
    READY --> PICK{"选择业务"}
    PICK -->|"CHR优先或超时老化"| CHR["处理CHR预算"]
    PICK -->|"ModemLog"| LOG["处理日志预算"]
    PICK -->|"TCPDump"| TCP["处理抓包预算"]
    CHR --> LEVEL{"检查通道水位"}
    LOG --> LEVEL
    TCP --> LEVEL
    LEVEL -->|"< 70%"| NEXT["继续公平调度"]
    LEVEL -->|"70% - 95%"| BOOST["提高优先级或请求减速"]
    LEVEL -->|">= 95%"| LIMIT["暂停或业务专属丢弃"]
    BOOST --> NEXT
    LIMIT --> NEXT
    NEXT --> EMPTY{"ready bitmap为空？"}
    EMPTY -->|"否"| PICK
    EMPTY -->|"是"| WAIT
```

## 6. 物理IPC链路仲裁

```mermaid
flowchart TD
    Q0["ModemLog TX Queue"] --> ARB["加权仲裁器"]
    Q1["TCPDump TX Queue"] --> ARB
    Q2["CHR TX Queue"] --> ARB
    ARB --> CREDIT{"检查通道credit"}
    CREDIT -->|"有credit"| DMA["共享DMA / IPC链路"]
    CREDIT -->|"无credit"| HOLD["保留队列并执行流控"]
    DMA --> DEMUX["对端按Channel ID分流"]
    HOLD --> ARB
```

独立逻辑通道必须继续落实到物理层描述符和credit，否则大流量ModemLog仍会造成队头阻塞。

## 7. Socket与文件阻塞隔离

```mermaid
flowchart TD
    SOCKET["Socket接收线程"] -->|"recv可阻塞"| RING["业务RX Ring"]
    RING --> CORE["Core Worker"]
    CORE --> REQUEST["Storage Request"]
    REQUEST --> STORE["Storage Owner"]
    STORE -->|"f_write可阻塞"| DMA["SD DMA"]
    DMA --> DONE{"完成？"}
    DONE -->|"成功"| COMMIT["推进commit并释放buffer"]
    DONE -->|"超时或失败"| ERROR["保留所有权并进入恢复"]
```

`recv()`和`f_write()`可以阻塞，但必须位于不同执行上下文，且所有永久等待风险必须有超时。

## 8. 业务安全停止

```mermaid
stateDiagram-v2
    [*] --> STOPPED
    STOPPED --> STARTING: 初始化上下文和文件
    STARTING --> ACTIVE: 打开独立通道
    ACTIVE --> QUIESCING: 停止请求
    QUIESCING --> DRAINING: 收到channel close ack
    DRAINING --> SYNCING: RX与写队列清空
    SYNCING --> STOPPED: DMA完成且文件关闭
    ACTIVE --> ERROR: 通道或存储错误
    ERROR --> QUIESCING: 受控停止
```

## 9. 安全停止时序

```mermaid
sequenceDiagram
    participant App
    participant Channel
    participant Core
    participant Store
    participant File
    App->>Channel: stop并停止新数据
    Channel-->>Core: close ack
    Core->>Core: 等待inflight RX归零
    Core->>Store: 排空剩余写请求
    Store->>File: 等待DMA并f_sync
    File-->>Store: 完成
    Store-->>Core: drain complete
    Core-->>App: 会话进入STOPPED
```

## 10. 线程生命周期

```mermaid
flowchart TD
    START["系统启动"] --> CORE["创建常驻Core Worker"]
    CORE --> BLOCK["阻塞等待Task Notification"]
    BLOCK --> WORK["处理三个通道的有限预算"]
    WORK --> BLOCK
    WORK --> NEED{"存在CPU密集任务？"}
    NEED -->|"否"| BLOCK
    NEED -->|"是"| BURST["按需创建Burst Worker"]
    BURST --> IDLE{"空闲超时且无资源？"}
    IDLE -->|"否"| BURST
    IDLE -->|"是"| EXIT["受控退出"]
```

常驻Core Worker已经实现三种业务共享一份栈。不要删除它。只有不拥有Socket、通道、文件、DMA和协议状态的Burst Worker可以受控退出。

## 11. 最终架构

```mermaid
flowchart TD
    APP["诊断控制应用"] --> LIFE["Session Manager"]
    LIFE --> CTX["三个持久Service Context"]
    PHY["核间物理链路"] --> CHANNELS["三个独立Channel"]
    CHANNELS --> CTX
    CTX --> CORE["一个常驻Core Worker"]
    CORE --> STORAGE["一个Storage Owner"]
    STORAGE --> FILES["三个独立输出文件"]
    CORE --> STATS["通道级统计与流控"]
    LIFE --> ROUTE["IPC / WAN路由策略"]
```

最终原则：

> 三个独立通道和持久业务上下文保证连续性；Core Worker负责公平串行调度；Storage Owner保证文件和DMA所有权；线程变化不能影响通道、协议和文件状态。
