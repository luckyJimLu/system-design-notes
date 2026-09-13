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
