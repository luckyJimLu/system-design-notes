---
name: react-best-practices
description: Refactor or review React + TypeScript frontend code for component boundaries, state ownership, rendering efficiency, async work, bundle discipline, and maintainability. Use when changing substantial React structure, splitting large components, fixing re-renders, or reviewing implementation quality.
metadata:
  category: ui
  origin: aihome-skills
  adapted_from: Vercel React Best Practices
---

# React Best Practices

Apply this skill to implementation quality during or after frontend work.

## Priorities

Use this order:

1. correctness,
2. clear state ownership,
3. understandable component boundaries,
4. elimination of avoidable work and waterfalls,
5. render efficiency,
6. bundle/load efficiency,
7. micro-optimization.

Do not optimize code that is already clear and fast enough merely to satisfy a pattern.

## Component architecture

- Keep state as close as practical to the components that own it.
- Lift state only when multiple branches genuinely need coordinated access.
- Avoid duplicated derived state; compute it from the source of truth when inexpensive.
- Split components around coherent responsibilities and stable data boundaries, not arbitrary line counts.
- Prefer explicit props and focused hooks over broad context for local concerns.
- Keep effects for synchronization with external systems; do not use effects as a substitute for normal data flow.
- Avoid components that mix data loading, mutation orchestration, layout, complex rendering, and unrelated interaction state when those concerns can be separated cleanly.

## Rendering performance

Before adding memoization, find the actual render coupling.

Prefer moving state downward, narrowing props, removing effect-driven state loops, virtualizing genuinely large lists/tables, and lazy-loading heavy routes or features when it improves real loading behavior.

Use `memo`, `useMemo`, and `useCallback` only when they prevent measured or clearly expensive repeated work or preserve a required reference identity.

## Async and data flow

- Start independent async work in parallel when possible.
- Avoid sequential request waterfalls that are not data-dependent.
- Keep loading, empty, error, retry, and stale states explicit.
- Cancel or ignore stale work when user navigation/input can supersede it.
- Do not mirror server state into multiple local stores without a concrete reason.

## Bundle discipline

- Prefer tree-shakeable named imports.
- Avoid large dependencies for small utilities or one visual effect.
- Lazy-load genuinely heavy or infrequently used features.
- Keep optional integrations out of the normal web path when practical.

## TypeScript boundaries

- Model component props and domain state explicitly.
- Prefer discriminated unions for multi-state UI over loosely related booleans.
- Keep `any` at integration boundaries only when unavoidable and normalize it quickly.
- Do not duplicate backend schema assumptions across many components.

## Workflow

1. Inspect the affected component tree, state flow, and data dependencies.
2. Preserve behavior before optimizing structure.
3. Fix ownership and component boundaries before adding memoization.
4. Remove duplicated state and avoidable render coupling.
5. Review async ordering and bundle impact.
6. Run relevant type, test, and build checks.

## Completion

Report affected component boundaries, behavioral guarantees preserved, validation performed, and any performance concern that remains unverified. Use `frontend-design` for visual direction and `web-design-guidelines` for final accessibility/UX review.