---
name: web-design-guidelines
description: Audit frontend work for accessibility, UX clarity, responsive behavior, interaction quality, forms, content hierarchy, localization, motion, and interface performance. Use after significant UI changes or when reviewing web interface quality.
metadata:
  category: ui
  origin: aihome-skills
  adapted_from: Vercel Web Interface Guidelines
---

# Web Design Guidelines

Use this Skill as a final quality gate for frontend work.

## Review order

1. accessibility blockers;
2. keyboard and focus behavior;
3. responsive and localized layout failures;
4. unclear or unrecoverable interactions;
5. content hierarchy problems;
6. visual inconsistency;
7. minor polish.

Prefer native HTML semantics before ARIA workarounds. Use buttons for actions and links for navigation.

## Accessibility

Check semantic landmarks and heading order, keyboard reachability and visible focus, accessible names for icon-only controls, label/control association, dialog/drawer focus containment and restoration, actionable errors, status that does not rely on color alone, sufficient contrast, and reduced-motion behavior.

Do not claim screen-reader or assistive-technology compatibility unless it was actually tested.

## Forms and recoverability

- Keep labels persistent for important controls.
- Make required/optional state understandable.
- Show field-level errors near the field and page/group summaries when errors may be outside the viewport.
- Preserve user input after recoverable failures.
- Keep save, retry, cancel, and destructive semantics explicit.
- Do not display success until the underlying operation actually succeeds.

## Responsive behavior

Review narrow, normal, and wide windows rather than one screenshot width.

- Preserve task priority when regions stack or collapse.
- Avoid page-level horizontal scrolling except where deliberately required for data structures.
- Give tables a deliberate small-screen strategy.
- Ensure sticky/fixed elements do not cover content.
- Keep important actions reachable in short viewports.
- Avoid device-name logic when available space is the real constraint.

## Content and localization resilience

Stress the UI with English and Chinese labels, long headings and identifiers, code-like strings, large numbers/timestamps, empty/loading/error states, and long status/error messages.

Check hard-coded user-visible strings when the surrounding product uses i18n. Critical information may be truncated only when the full value remains recoverable through wrapping, tooltip, detail view, copy action, or another clear path.

## Interaction quality

- Hover is enhancement, never the only discovery path for required actions.
- Destructive actions require consequence clarity and proportional confirmation.
- Disabled controls should explain why when the reason is not obvious.
- Loading indicators should correspond to real in-flight work.
- Toasts must not cover important controls or become the only record of a critical failure.

## Motion and performance

Use motion to explain state change, continuity, or spatial relationship; avoid decorative animation that competes with the task. Review large assets, heavy dependencies, expensive synchronous interaction work, huge unvirtualized lists, accidental layout thrashing, and route-level code that can be lazy-loaded when genuinely heavy.

## Finding format

For audits, prefer:

`severity — file:line — problem — recommended fix`

Use `Blocker`, `High`, `Medium`, or `Low`, and classify by user impact rather than aesthetic preference.

## Completion

For a fix task, make the smallest coherent corrections and rerun relevant validation. Report what was actually tested and distinguish verified behavior from inferred behavior. Use `frontend-design` for visual direction and `react-best-practices` for React implementation issues.