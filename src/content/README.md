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

`frontmatter.ts` provides the first dependency-free parser and validation
boundary. It is intentionally small: importing a document with invalid
navigation metadata can produce a diagnostic instead of breaking the entire
site. The next integration step is replacing the legacy chapter metadata
builder with a glob over `content/**/index*.md` that calls these functions.

`loadImportedContentWithDiagnostics()` exposes structured diagnostics for an
import screen or CI check. Errors include invalid metadata and duplicate IDs;
warnings include generated fallback IDs and missing language variants.
