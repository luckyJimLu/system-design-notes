---
name: frontend-design
description: Design, critique, polish, normalize, or substantially refactor a product frontend. Use for page layout, information hierarchy, typography, spacing, responsive structure, settings/admin/configuration pages, visual-system cleanup, and anti-generic UI review.
metadata:
  category: ui
  origin: aihome-skills
---

# Frontend Design

Treat visual design as a product decision, not decoration.

## Workflow

1. Confirm UI work is in scope.
2. Inspect the affected routes, components, styles, design tokens, i18n conventions, and existing interaction patterns.
3. Identify the primary user job and the information that must be understood first.
4. Fix information architecture, grouping, reading order, alignment, persistence, validation, and responsive behavior before decoration.
5. Choose one coherent visual direction and keep it consistent.
6. Reuse the existing framework, component primitives, icon language, and design tokens unless a change has a concrete engineering benefit.
7. Implement relevant loading, empty, error, dirty, saving, saved, selected, disabled, hover, focus-visible, and destructive states.
8. Apply `react-best-practices` for substantial React structure changes, `icon-system` for icon decisions, and `web-design-guidelines` as the final UX/accessibility gate.

## Design priorities

```text
product intent
  > information architecture
  > grouping / reading order / alignment
  > interaction and persistence clarity
  > typography and spacing
  > restrained surfaces and color
  > decorative effects
```

Prefer proximity and whitespace before extra containers, typography before effects, subtle borders before heavy shadows, and one controlled accent before unrelated saturated colors.

## Layout engineering

Use a small number of structural patterns chosen from the task topology:

- single-column reading flow for documents and forms;
- sidebar + content for stable navigation hierarchies;
- master-detail for repeated list/detail workflows;
- split pane when simultaneous comparison is essential;
- grid only when two-dimensional alignment is meaningful;
- drawer/modal for focused secondary tasks;
- tabs only for genuine peer groups.

Responsive behavior should follow available space and task priority, not device names. Preserve reading order when regions collapse. Avoid unnecessary breakpoint proliferation.

## Configuration UI

Treat settings/configuration UI as an input-and-decision workflow, not a dashboard.

- default forms to a clear single-column flow;
- bound form width on large screens;
- use progressive disclosure for advanced settings;
- keep save semantics consistent within a configuration domain;
- expose dirty, saving, saved, validation, and failure states explicitly;
- surface errors hidden in tabs/accordions at the container level;
- physically separate destructive actions from normal maintenance actions;
- never claim a value is persisted, deployed, rolled back, or safe unless the underlying system provides that guarantee.

## Anti-generic UI boundary

Do not default to common generated-UI clichés without a product reason:

- purple/indigo gradients as default branding;
- glow-heavy dark themes;
- glassmorphism on ordinary surfaces;
- cards inside cards;
- oversized radii everywhere;
- decorative KPI grids;
- pill/badge overload;
- rounded icon tiles before every heading;
- animation without state or spatial meaning.

Remove one layer of unnecessary containers before adding polish. A strong result should feel designed for the product, not generated from a generic SaaS template.

## Visual system

Keep a small, intentional vocabulary for type scale, spacing rhythm, radius sizes, borders/elevation, neutral surfaces, primary accent, semantic states, icon sizes, and interaction states.

Use color for meaning, action, selection, or categorization. Do not use color alone for status.

## Content and localization resilience

Stress important layouts with long identifiers, error messages, code-like strings, English/Chinese labels, loading/empty states, and narrow windows. Critical information must always have a recovery path when truncated.

## Completion checklist

Verify the primary task is obvious, grouping/alignment is intentional, secondary information is subordinate, important actions remain reachable at narrow widths, tables/forms preserve semantics, keyboard/focus behavior remains usable, localized content survives, backend semantics were not changed for styling convenience, and relevant build/type checks pass.

Report changed files, design direction, major layout decisions, responsive/accessibility considerations, validation performed, and remaining visual debt.