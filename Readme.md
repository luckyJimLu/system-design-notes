
# [System Design Interview - An Insider's Guide (Vol 1 and 2)](https://bytebytego.com/courses/system-design-interview)
These notes are based on the System Design Interview books - [Vol 1 and Vol 2 2nd Ed](https://www.goodreads.com/book/show/54109255-system-design-interview-an-insider-s-guide) 

## 🌐 Online Website

**GitHub Pages:** https://luckyjimlu.github.io/system-design-notes/

Check the notes here: https://pagefy.io/system-design/system-design-interview-by-alex-xu

**Note:** These notes are a work in progress. 

## 📖 内容驱动 WebUI 使用指南

本项目将知识内容与 WebUI 渲染分离。新增文档时，通常只需添加 Markdown 文件，不需要修改 React 页面代码。

### 1. 新增内容

在 `content/` 下创建一个主题目录：

```text
content/
└── 40-your-topic/
    ├── index.zh.md
    └── index.en.md
```

文件名使用 `index.zh.md` 或 `index.en.md`，系统会自动扫描、配对并加入导航、搜索和目录。

### 2. 配置 front matter

```md
---
id: your-topic
title: 中文标题
titleEn: English Title
order: 40
description: 文档摘要
tags: [RTOS, TCP/IP]
---

# 正文标题

这里直接编写 Markdown 内容。
```

`id` 应保持稳定，`order` 控制排序，`title` 和 `titleEn` 用于双语标题，`tags` 用于分类和检索。没有 front matter 的旧文档仍然兼容，但建议新文档完整配置元数据。

### 3. 使用语义块

目前支持 `callout`：

````md
```callout
type=warning title="注意"
这里是需要关注的内容。
```
````

可用类型：`info`、`warning`、`danger`、`success`。未来可扩展 `diagram`、`comparison`、`checklist` 等渲染插件。

### 4. 图片与资源

将图片放在主题目录下，并在 Markdown 中使用相对路径：

```text
content/40-your-topic/images/architecture.png
```

```md
![系统架构](./images/architecture.png)
```

### 5. 本地开发与构建

```bash
npm install
npm run dev       # 启动开发服务器
npm run validate:content # 校验 content/ 文档
npm run lint      # TypeScript 检查
npm run build     # 生产构建
```

导入链路为：

```text
Markdown → front matter Loader → ContentDocument
→ ContentCatalog → 导航 / 搜索 / 目录 / WebUI
```

### 6. 嵌入式资料入口

- [嵌入式系统总目录](./content/29.%20embedded-systems/README.md)
- [RTOS 研究报告](./content/29.%20embedded-systems/rtos/resource-constrained-embedded-rtos-architecture.md)
- [lwIP TCP/IP 协议栈](./content/29.%20embedded-systems/networking/lwip-tcpip-deepwiki.md)
- [Modem / 网络诊断](./content/29.%20embedded-systems/modemlog/README.md)

## 🔧 Embedded Systems

- [Embedded Systems 总目录](./content/29.%20embedded-systems/)
- [RTOS：资源受限嵌入式系统架构设计与 RTOS 核心机制研究报告](./content/29.%20embedded-systems/rtos/resource-constrained-embedded-rtos-architecture.md)
- [Modem / Networking：Modem 诊断与 MCU 网络架构](./content/29.%20embedded-systems/modemlog/)


 * [Chapter 1 - Scale From Zero To Millions Of Users](./content/01.%20Scaling/)
 * [Chapter 2 - Back-of-the-envelope Estimation](./content/02.%20Back%20Of%20the%20Envelope%20Estimation/)
 * [Chapter 3 - A Framework For System Design Interviews](./content/03.%20System%20Design%20Framework/)
 * [Chapter 4 - Design A Rate Limiter](./content/04.%20Rate%20Limiter/)
 * [Chapter 5 - Design Consistent Hashing](./content/05.%20Consistent%20Hashing/)
 * [Chapter 6 - Design A Key-Value Store](./content/06.%20Key-Value%20Store/)
 * [Chapter 7 - Design A Unique ID Generator In Distributed Systems](./content/07.%20Unique-Id%20Generator/)
 * [Chapter 8 - Design A URL Shortener](./content/08.%20URL%20Shortener/)
 * [Chapter 9 - Design A Web Crawler](./content/09.%20Web%20Crawler/)
 * [Chapter 10 - Design A Notification System](./content/10.%20Notification%20System/)
 * [Chapter 11 - Design A News Feed System](./content/11.%20News%20Feed%20System/)
 * [Chapter 12 - Design A Chat System](./content/12.%20Chat%20System/)
 * [Chapter 13 - Design A Search Autocomplete System](./content/13.%20Search%20Autocomplete/)
 * [Chapter 14 - Design YouTube](./content/14.%20Youtube/)
 * [Chapter 15 - Design Google Drive](./content/15.%20Google%20Drive/)
 * [Chapter 16 - Proximity Service](./content/16.%20Proximity%20Service/)
 * [Chapter 17 - Nearby Friends](./content/17.%20Nearby%20Friends/)
 * [Chapter 18 - Design Google Maps](./content/18.%20Google%20Maps/)
 * [Chapter 19 - Distributed Message Queue](./content/19.%20Distributed%20Message%20Queue/)
 * [Chapter 20 - Metrics Monitoring and Alerting System](./content/20.%20Metrics%20Monitoring%20and%20Alerting%20System/)
 * [Chapter 21 - Ad Click Event Aggregation](./content/21.%20Ad%20Click%20Event%20Aggregation/)
 * [Chapter 22 - Hotel Reservation System](./content/22.%20Hotel%20Reservation%20System/)
 * [Chapter 23 - Distributed Email Service](./content/23.%20Distributed%20Email%20Service/)
 * [Chapter 24 - S3-like Object Storage](./content/24.%20S3-like%20Object%20Storage/)
 * [Chapter 25 - Real-time Gaming Leaderboard](./content/25.%20Real-time%20Gaming%20Leaderboard/)
 * [Chapter 26 - Payment System](./content/26.%20Payment%20System/)
 * [Chapter 27 - Digital Wallet](./content/27.%20%20Digital%20Wallet/)
 * [Chapter 28 - Stock Exchange](./content/28.%20Stock%20Exchange/)


# Additonal Resources

### Rate Limiting
- [Circuit Breaker Algorithm](https://martinfowler.com/bliki/CircuitBreaker.html)
- [Uber Rate Limiter](https://github.com/uber-go/ratelimit/blob/master/ratelimit.go)


### Consistent Hashing
- [Consistent Hashing](https://tom-e-white.com/2007/11/consistent-hashing.html)
- [CS168: Introduction and Consistent Hashing:]( http://theory.stanford.edu/~tim/s16/l/l1.pdf)
- [Apache Cassandra](http://www.cs.cornell.edu/Projects/ladis2009/papers/Lakshman-ladis2009.PDF)
- [Scaling Discord](https://blog.discord.com/scaling-elixir-f9b8e1e7c29b)
- [Google Maglev](https://static.googleusercontent.com/media/research.google.com/en//pubs/archive/44824.pdf)


### Key-Value Store
- [Amazon Dynamo](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf)
- [Cassandra Architecture](https://docs.datastax.com/en/archived/cassandra/3.0/cassandra/architecture/archIntro.html)
- [Google BigTable Architecture](https://static.googleusercontent.com/media/research.google.com/en//archive/bigtable-osdi06.pdf)
- [Amazon Dynamo DB Internals](https://www.allthingsdistributed.com/2007/10/amazons_dynamo.html)
- [Design Patterns in Amazon Dynamo DB](https://www.youtube.com/watch?v=HaEPXoXVf2k)
- [Internals of Amazon Dynamo DB](https://www.youtube.com/watch?v=yvBR71D0nAQ)


### Unique-ID Generator
- [Ticket Servers: Distributed Unique Primary Keys on the Cheap](https://code.flickr.net/2010/02/08/ticket-servers-distributed-unique-primary-keys-on-the-cheap)
- [Snowflake](https://blog.twitter.com/engineering/en_us/a/2010/announcing-snowflake.html)


### Web Crawler
- [Web Crawling](http://infolab.stanford.edu/~olston/publications/crawling_survey.pdf)
- [Google Dynamic Rendering](https://developers.google.com/search/docs/guides/dynamic-rendering)



### Chat Systems
- [How Discord stores billions of messages](https://discord.com/blog/how-discord-stores-billions-of-messages)
- [Flannel: An Application-Level Edge Cache to Make Slack Scale](https://slack.engineering/flannel-an-application-level-edge-cache-to-make-slack-scale/)


### Search Autocomplete
- [How We Built Prefixy](https://medium.com/@prefixyteam/how-we-built-prefixy-a-scalable-prefix-search-service-for-powering-autocomplete-c20f98e2eff1)
- [Prefix Hash Tree](https://people.eecs.berkeley.edu/~sylvia/papers/pht.pdf)


### Youtube
- [YouTube Architecture](http://highscalability.com/youtube-architecture)
