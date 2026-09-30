# Repository Agent Instructions

## Project-local skills

This repository keeps reusable Codex skills under `.agents/skills/`. Codex CLI
does not reliably auto-discover that directory, so load the relevant skill
manually before performing a task that matches it:

- `.agents/skills/diagram-design/SKILL.md` — diagrams and visual system design
- `.agents/skills/frontend-design/SKILL.md` — frontend visual/product design
- `.agents/skills/icon-system/SKILL.md` — product UI icon systems
- `.agents/skills/react-best-practices/SKILL.md` — React + TypeScript structure
- `.agents/skills/web-design-guidelines/SKILL.md` — frontend UX/accessibility audit
- `.agents/skills/web-desktop-ui/SKILL.md` — shared browser/desktop WebUI
- `.agents/skills/webapp-ui-skill/SKILL.md` — web application/admin UI

When a task clearly matches one of these skills, read its complete `SKILL.md`
before taking task actions. If multiple skills apply, read the smallest set
that covers the task and use them in dependency order.

## Diagram authoring (PlantUML)

Do NOT embed ```plantuml code fences in markdown. Diagrams are committed as
image assets so they render on GitHub, in VS Code preview, in dev tools, and
on the site with no plugin:

- Source: `content/<chapter>/images/<name>.puml` (editable, the single source of truth)
- Rendered: `content/<chapter>/images/<name>.svg` (committed to git)
- Reference from markdown: `![Alt text](images/<name>.svg)`

Workflow for new or changed diagrams:

1. Write or edit `content/<chapter>/images/<name>.puml` (semantic file name, e.g. `socket-reactor-tasks.puml`)
2. `npm run render:diagrams` (only re-renders stale sources; add `-- --force` to render all)
3. `npm run validate:content` — fails on embedded PlantUML fences, missing `.svg`
   targets, orphaned `.svg` files without a `.puml` source, and warns when a
   `.puml` is newer than its `.svg`

Notes:

- `scripts/render-diagrams.mjs` injects the CJK font (`Noto Sans CJK SC`) at
  render time; keep `.puml` files free of environment-specific skinparams.
- The site bundles `content/[0-9]*/**/images/*.{png,svg}` via `import.meta.glob`,
  so the same relative `images/...` links work in the built site.

## Automated documentation rendering and delivery

Follow `docs/plantuml-rendering-automation.md` for the full pipeline and troubleshooting.

- Development-tool flowcharts follow the same `.puml` + committed `.svg` + Markdown image convention; keep executable examples and directory listings as code.
- Before editing CI, compare each referenced npm script and script file with the current repository. Do not retain removed `render:plantuml` or `scripts/plantuml.test.mjs` references.
- Runtime setup is centralized in `scripts/setup-plantuml.sh`. Keep PlantUML and font URLs pinned, verify SHA-256 on downloads and cache hits, and invalidate the Actions runtime cache by changing this script.
- Cache JAR and CJK font assets with Actions cache; do not commit runtime binaries. Install Java / Graphviz / fontconfig only when absent. SVG documentation images remain committed.
- For diagram changes: render, commit source and image together, then run `npm run validate:content`, `npm run lint`, and `npm run build`.
- PRs must validate committed assets, force-render every source, type-check, and build without publishing. Pushes to `main` and manual dispatch run the same checks before Pages deployment.
- A change is verified only with real command output and the matching commit's Action results. Report rendering failures from `plantuml-render-logs`; do not hide failures or claim a queued run succeeded.

## C++ teaching examples

- C++ architecture materials live under `content/33. Cpp System Architecture/` and `content/34. Boost Asio Deep Dive/`, with paired locale documents, PlantUML image assets, and self-contained examples.
- Compile and run changed C++ examples with `bash scripts/check-cpp-examples.sh`; this check is also required in Pages CI. Keep C++20 as the baseline unless the document explicitly labels a newer feature.
- Explain ownership, execution location, result delivery and shutdown contracts. Distinguish compilable examples from conceptual snippets and Java analogies from equivalent semantics.
- Do not describe `shared_ptr` as object synchronization, Future timeouts as cancellation, or coroutine syntax as a runtime scheduler. Preserve explicit limitations of teaching executors.

- Asio teaching examples use C++20 and Boost 1.83.0 with version assertions. Build CI uses Ubuntu 24.04 and `libboost1.83-dev`; source references are pinned. Update dependency, assertions, source links and documented contracts together when changing the baseline.
- Asio checks cover token adaptation, execution domains, cancellation completion, coroutine ownership and real loopback TCP. Keep timeout-based hang detection, and distinguish tests from production shutdown guarantees.
