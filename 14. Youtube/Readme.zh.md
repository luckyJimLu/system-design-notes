# 第 14 章：设计 YouTube

## 简介
YouTube是一个支持视频上传、播放和各种互动的海量视频流媒体平台。本章重点介绍设计具有以下核心功能的可扩展视频流系统：
- **快速视频上传**
- **流畅的视频流**
- **能够更改视频质量**
- **基础设施成本低**
- **高可用性和可靠性**

### 主要统计数据（2020 年）
- **20 亿月活跃用户**
- **每天观看 50 亿个视频**
- **37% 的移动互联网流量来自 YouTube**
- 提供 **80 种语言**
- **2019 年广告收入为 151 亿美元**

---

## 第 1 步：了解问题和范围

### 核心功能
1. 上传视频
2. 观看视频

### 支持的平台
- 移动应用程序、网络浏览器和智能电视

### 假设
- **每日活跃用户 (DAU)：** 500 万
- **平均视频大小：** 300 MB
- **上传限制：** 每个视频最大 1 GB
- **每日存储需求：** 150 TB
- **CDN 成本：** 500 万个 * 5 个视频 * 0.3GB * 0.02 美元 = 150,000 美元/天（使用 Amazon CloudFront）

---

## 第 2 步：高层设计

### 组件

<div style="margin-left:3rem">
    <img src="./images/high-level-design.png" alt="High Level Design" width="400">
</div>

1. **客户端：** 智能手机、计算机和电视等设备。
2. **CDN（内容交付网络）：** 存储和流式传输视频。
3. **API 服务器：** 处理除视频流之外的所有用户交互（例如上传、元数据更新）。
4. **元数据数据库：** 存储视频元数据（例如标题、描述、大小）。
5. **原始存储：** 用于上传视频的 Blob 存储。
6. **转码服务器：** 将视频转换为多种分辨率和格式。
7. **转码存储：** 用于转码视频的 Blob 存储。


---

### 核心工作流程
#### 1. 视频上传流程
- **并行进程：**
  1. 将视频上传到原始存储。
  2. 更新数据库中的视频元数据。

- **视频上传（步骤）：**

    <div style="margin-left:3rem">
        <img src="./images/video-uploading-flow.png" alt="Video Upload Flow" width="500">
    </div>

    - [1] 视频上传到 blob 存储。
    - [2] 转码服务器将视频转换为多种格式。
    - [3] 一次转码完成，下面两步并行执行。
        - [3a] 转码视频被发送到转码存储。
        - [3b] 转码完成事件在完成队列中排队。
    - [3a.1] 视频分发到 CDN。
    - [3b.1] 完成处理程序更新元数据并通知用户。



- **元数据上传（步骤）：**

    <div style="margin-left:3rem">
        <img src="./images/metadata-upload.png" alt="Metadata Upload" height="500">
    </div>

    - 客户端并行发送更新视频元数据的请求
    - 该请求包含视频元数据，包括文件名、大小、格式等。
    
       


#### 2. 视频流媒体流程

<div style="margin-left: 3em;">
  <img src="./images/video-streaming-flow.png" alt="Video Streaming Flow" height="400">
</div>

- 使用边缘服务器直接从 CDN 传输视频，以最大程度地减少延迟。
- 一些流行的流媒体协议包括 MPEG_DASH、Apple HLS、Adobe HDS。
-  *不同的流媒体协议支持不同的视频编码和播放器。*


---

## 第 3 步：深入设计

### 视频转码
#### 重要性
1. 原始视频消耗大量存储空间。它减少了存储空间。
2. 确保跨设备和浏览器的兼容性。
3. 使视频质量适应网络条件。

#### 组件
- **容器：** 封装视频、音频和元数据（例如 MP4、AVI）。
- **编解码器：** 压缩和解压缩算法（例如 H.264、VP9）。

#### 有向无环图 (DAG) 模型
<div style="margin-left: 3em;">
    <img src="./images/dag-video-transcoding.png" alt="DAG Video Transcoding" width="600">
</div>

- 对视频进行转码的计算量很大且耗时。
- DAG 模型定义了编码、缩略图生成和水印等任务。
- 允许视频处理的高并行性。


- 原始视频分为视频、音频和元数据。
    - 视频编码：视频被转换为支持不同的分辨率、编解码器、比特率。
    - 缩略图：可以由用户上传，也可以由系统自动生成。
    - 水印：视频顶部的图像叠加包含有关视频的识别信息。

---

### 视频转码架构

<div style="margin-left: 3em;">
<img src="./images/video-transcoding-architecture.png" alt="Video Transcoding" width="600">
</div>

1. **预处理器：** 将视频分割成更小的块（GOP 对齐）。它有 4 个职责。

    <div style="margin-left: 3em;">
        <img src="./images/dag-config.png" alt="DAG Config" width="500">
    </div>

    - 视频分割：视频流被分割或进一步分割成更小的图像组（GOP）对齐。
    - 它为老客户按 GOP 对齐方式分割视频。
    - 它根据客户端程序员编写的配置文件生成 DAG。
    - 它将 GOP 和元数据存储在临时存储中，以防编码失败，系统可以使用持久数据进行重试操作。


2. **DAG 调度程序：** 将任务组织为顺序或并行阶段。
    <div style="margin-left: 3em;">
        <img src="./images/dag-scheduler.png" alt="DAG Scheduler" width="500">
    </div>

    - 它将 DAG 图拆分为任务阶段，并将它们放入资源管理器的任务队列中。
    - 第一阶段：视频、音频和元数据。
    - 在第 2 阶段，视频文件进一步分为两个任务：视频编码和缩略图。


3. **资源管理器：** 负责管理资源分配的效率。
包含 3 个队列和一个任务调度程序。
    <div style="margin-left: 3em;">
        <img src="./images/resource-manager.png" alt="Resource Manager" width="700">
    </div>

    - 任务队列：包含要执行的任务的优先级队列。
    - 工作队列：包含工作人员利用率信息的优先级队列。
    - 运行队列：包含当前正在运行的任务和运行任务的worker。
    - 任务调度器：选择最佳的任务/工作人员，并指示所选的任务工作人员执行作业。


4. **任务工作者：** 执行转码和其他操作。
    <div style="margin-left: 3em;">
        <img src="./images/task-worker.png" alt="Task Worker" width="250">
   </div>

    - 不同的任务工作者可能运行不同的任务


5. **临时存储：** 存储重试的中间数据。
    - 存储系统的选择取决于数据类型、数据大小、访问频率、数据寿命等因素。
6. **输出：** 转码后的视频可供分发。


---

## 系统优化

### 速度优化
1. **并行视频上传：** 将视频分割成更小的块，以实现更快、可恢复的上传。

    <img src="./images/video-split.png" alt="Video Split" width="600">

2. **分布式上传中心：** 使用CDN作为靠近用户的上传中心。
3. **并行处理：**使用消息队列解耦模块以实现高并行性。

    <img src="./images/message-queue1.png" alt="Message Queue" width="600">
    <img src="./images/message-queue2.png" alt="Message Queue" height="170" width="500">

### 安全优化
1. **预签名 URL：** 限制授权用户上传视频。

    <img src="./images/pres-signed-urls.png" alt="Pre Signed" width="500">

2. **保护视频：**
   - **DRM 系统**（例如 Apple FairPlay、Google Widevine）。
   - **AES 加密。**
   - **水印。**

### 节省成本的优化
1. 通过 CDN 仅提供热门视频；来自大容量服务器的不太受欢迎的。
2. 对很少访问的视频进行按需编码。
3. 根据受欢迎程度对视频分发进行区域化。
4. 构建自定义 CDN 并与 ISP 合作以降低带宽成本。

---

## 错误处理
### 可恢复的错误
- 重试失败的上传、转码或资源分配任务。

### 不可恢复的错误
- 停止格式错误的视频处理并返回错误代码。

