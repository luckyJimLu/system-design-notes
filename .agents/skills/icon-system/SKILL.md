---
name: icon-system
description: Design, select, normalize, review, or refactor icons in a product UI. Use for navigation, actions, status, empty states, brand marks, icon-only controls, icon sizing/stroke/color rules, and icon-library decisions.
metadata:
  category: ui
  origin: aihome-skills
---

# Icon System

Treat icons as a semantic interface system, not decoration.

## Library policy

1. Reuse the project's existing functional icon family first.
2. If Lucide is already installed, keep it as the default functional language.
3. Use another outline family only when the existing set lacks a clear semantic match and the dependency is justified.
4. Use brand-icon libraries only for recognizable brand identity, never as generic functional controls.
5. Do not add a dynamic multi-library abstraction unless the product actually needs runtime icon selection.

## Workflow

1. Identify the icon's job: navigation, action, status, domain concept, brand, or decoration.
2. Inspect nearby icons and existing conventions.
3. Prefer the clearest familiar metaphor, not the most visually interesting glyph.
4. Verify the icon actually exists in the installed package version; never invent export names.
5. Reuse one stable metaphor for one concept across the product.
6. Normalize size, stroke, alignment, color, hover, selected, disabled, loading, and destructive states.
7. Add accessible labeling to icon-only controls.
8. Review the page for ambiguous metaphors, duplicate meanings, excessive icon density, and mixed visual languages.

## Semantic rules

Navigation icons support scanning and location recognition. Keep the same glyph in normal and selected states; express selection through surrounding UI state.

Action icons represent verbs. Prefer conventional meanings for add, edit, delete, copy, refresh, search, filter, external-link, expand/collapse, run/test, and save. High-consequence or unfamiliar actions should retain visible text where it reduces mistakes.

Status icons reinforce state; they must never be the only status signal. Pair important state with text and, when appropriate, semantic color.

## Geometry

Use a restrained scale rather than one-off values:

```text
14-16 px  dense metadata / compact controls
16 px     normal button glyphs
18 px     sidebar/navigation and toolbars
20-24 px  prominent actions or section symbols
32-48 px  empty-state illustration icons
```

Glyph size is not click-target size. Interactive targets must remain comfortably clickable and keyboard-focusable.

Keep functional line icons near one visual weight. Avoid arbitrary per-icon transforms unless a proven optical alignment issue exists.

## Color and state

Default functional icons to the same neutral hierarchy as adjacent text. Use accent color for selected/primary state and semantic colors only for real meaning. Avoid rainbow navigation.

Disabled icons must visually follow disabled controls. Destructive styling should become prominent at the appropriate interaction stage rather than turning every trash icon bright red by default.

## Accessibility

An icon is not an accessible name.

For icon-only controls:

- use a real semantic interactive element;
- provide an accessible name such as `aria-label` when visible text is absent;
- keep focus indication on the interactive target;
- provide tooltip/help text when meaning is not obvious;
- hide purely decorative SVGs from assistive technology when appropriate.

Do not attach click handlers directly to decorative SVGs when a button is the correct element.

## Density discipline

Prefer icons for stable navigation, familiar compact actions, important state reinforcement, and restrained empty states.

Avoid decorative icons beside every label, icon tiles before every heading, emoji as production controls, raster images for ordinary glyphs, font-icon systems in new code, and arbitrary mixing of filled/duotone/outline families.

## React implementation

Prefer named imports so bundlers can tree-shake unused icons. A small application-level semantic mapping is fine when it represents stable concepts. Do not create a generic icon registry solely for hypothetical future library swapping.

## Completion checklist

Verify that:

- one concept uses one stable metaphor;
- the existing icon family remains the default unless there is a clear reason to change;
- no invented export names were added;
- icon sizes and strokes follow the local scale;
- dangerous/unfamiliar actions retain text where needed;
- status remains understandable without color or icon alone;
- icon-only buttons have accessible names;
- no unnecessary icon dependency or abstraction was introduced.

Report affected components, icon vocabulary changes, any dependency added and why, accessibility changes, and validation performed.