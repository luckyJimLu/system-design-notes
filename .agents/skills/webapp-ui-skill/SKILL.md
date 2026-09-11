---
name: webapp-ui-skill
description: Architecture, layout, and implementation standards for modern web application interfaces, admin control planes, dashboards, configuration panels, master-detail workspaces, and command bars. Use when building, restructuring, or polishing dense operational UIs.
metadata:
  category: ui
  standard: Developer Control Plane & WebApp UI Specification
  origin: aihome-skills
---

# WebApp UI & Admin Dashboard Skill

Use this skill for technical products, admin dashboards, developer control planes, operational cockpits, telemetry panels, and configuration surfaces.

## Core philosophy

Operational interfaces should feel like precise instruments, not marketing pages or generic SaaS templates.

```text
Operational intent
  -> current state / health
  -> topology / resources / data
  -> primary actions
  -> dense but structured details
  -> explicit persistence and feedback
```

## Dashboard architecture

Choose only the layers the product actually needs:

1. **Status / health region** — connection, environment, sync/version, policy or system health.
2. **Metrics / telemetry** — actionable values backed by real state; avoid vanity cards.
3. **Command region** — primary operational actions, sync/test/run/open-detail actions, clearly separated destructive actions.
4. **Topology / matrix / registry** — relationships, routes, resources, dependencies, fleet state, or other core entities.
5. **Activity / audit stream** — meaningful recent events, changes, failures, retries, or operator actions.

Do not force every page to contain all five layers.

## Density and layout

Prefer dense but structured layouts: compact headings and labels, tabular numerals for comparable values, monospace only for technical identifiers, fine borders and restrained surfaces, consistent row alignment, strong spacing between groups, and one primary scroll owner per work area.

Avoid cards-inside-cards and decorative KPI grids. Use cards only for meaningful independent objects or strong grouping boundaries.

## Semantic state

Define a small semantic palette for healthy/success, warning/degraded, error/blocked, primary selection/action, and neutral secondary information. Do not use color alone; important state requires text or another explicit signal.

## Command and action design

- keep primary actions near the objects they affect;
- separate inspection from mutation;
- separate routine mutation from destructive actions;
- show loading/progress only for real in-flight operations;
- provide success/failure feedback without covering important controls;
- retain an audit/history path for consequential changes when the underlying system supports one.

## Configuration surfaces

For settings/configuration:

- default to clear single-column forms;
- use master-detail when users switch among many resources/categories;
- use drawers for focused row-level edits that should preserve list context;
- use wizards only for sequential initialization/dependency flows;
- use progressive disclosure for advanced options;
- make save semantics, dirty state, validation, and failure states explicit;
- isolate destructive operations in a dedicated danger area.

Configuration UI is not a dashboard. Precision and recoverability matter more than visual density.

## Tables and registries

Use real table semantics when data is tabular. Align comparable numbers, place identity first and status nearby, preserve sorting/filtering/search context when opening details, and choose a deliberate small-screen strategy. Do not convert every table into unrelated cards on mobile.

## Responsive behavior

```text
compact  -> stacked content, collapsible navigation, focused dialogs/sheets
standard -> persistent navigation + main work area
wide     -> main work area + optional secondary inspector/detail pane
```

Choose actual thresholds from content constraints. Test short windows as well as narrow windows.

## Anti-generic discipline

Avoid decorative hero sections in admin tools, default purple/blue gradients, glow-heavy dark themes, oversized radii/pills, icon tiles before every heading, decorative charts without actionable data, and equal visual weight for every metric unless the product specifically calls for them.

## Accessibility and i18n

All primary flows must work by keyboard; focus-visible must be obvious; icon-only controls need accessible names; state must not rely on color alone; long English/Chinese labels, identifiers, and errors must remain usable; critical truncated values need a clear way to reveal or copy the full content.

## Verification checklist

Verify metrics/state come from real application data, actions trigger real handlers, links reach intended targets, narrow/wide layouts remain usable, language expansion does not break important controls, relevant loading/error/empty/dirty states exist, generic decoration is removed where it does not serve the product, and relevant build/type/test checks pass.

Use `frontend-design` for overall visual direction, `icon-system` for icon language, `react-best-practices` for React structure, and `web-design-guidelines` for final UX/accessibility review.