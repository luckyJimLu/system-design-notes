# Content boundary

`src/content` is the contract between imported knowledge and the WebUI shell.

`catalog.ts` is the single application-facing catalog. It combines the
legacy Vite loader in `src/data/chaptersData.ts` with front-matter documents
under `content/`. New UI code should import `contentCatalog` from this
directory rather than importing the legacy data module directly.

Front-matter documents use the same `ContentDocument` shape as legacy
documents:

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
responsive layout, and theme components. The document source is exposed as
`document.source`, which makes the migration boundary observable.

`frontmatter.ts` provides the first dependency-free parser and validation
boundary. It is intentionally small: importing a document with invalid
navigation metadata can produce a diagnostic instead of breaking the entire
site. The next integration step is replacing the legacy chapter metadata
builder with a glob over `content/**/index*.md` that calls these functions.

`loadImportedContentWithDiagnostics()` exposes structured diagnostics for an
import screen or CI check. Errors include invalid metadata and duplicate IDs;
warnings include generated fallback IDs and missing language variants.

The catalog uses a startup safety boundary: if imported content cannot be
loaded, the existing legacy catalog remains available and the failure is
recorded as `LOAD_FAILED` instead of leaving the entire WebUI blank.

Run `npm run validate:content` before publishing. The production build runs
this validation automatically and checks front matter, duplicate IDs per
locale, locale pairs, ordering conflicts, and local image references.
