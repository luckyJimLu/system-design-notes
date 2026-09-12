# Content boundary

`src/content` is the contract between imported knowledge and the WebUI shell.

For now, `catalog.ts` adapts the existing Vite glob loader in
`src/data/chaptersData.ts`. New UI code should import `contentCatalog` from
this directory rather than importing the legacy data module directly.

The next loader can produce the same `ContentDocument` shape from Markdown
files with front matter:

```md
---
id: rate-limiter
title: 设计限流器
titleEn: Design a Rate Limiter
order: 4
group: 基础组件
tags: [限流, Redis]
---
```

This keeps content ownership separate from routing, search, bookmarks,
responsive layout, and theme components.
