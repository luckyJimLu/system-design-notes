---
name: web-desktop-ui
description: Design, implement, review, or refactor one shared WebUI so it works coherently in normal browsers and desktop application shells such as Tauri or Electron. Use for shared web/desktop architecture, arbitrary window resizing, runtime capability adapters, shortcuts, file/external-link flows, and preventing UI forks.
metadata:
  category: ui
  pattern: Shared WebUI + Runtime Adapter + Responsive Shell
  origin: aihome-skills
---

# Web + Desktop Shared UI

Maintain one product UI, not a web UI and a desktop UI that slowly diverge.

## Core architecture

```text
Shared Product UI
React/components/routes/tokens/forms/tables/product state
                    ↓
Runtime Capability Adapter
openExternal / filePicker / notifications / shortcuts / window controls
                    ↓
Runtime Shell
Browser                         Desktop shell
Web APIs                         Tauri / Electron / other host APIs
```

Product components may request capabilities through a narrow adapter, but should not import shell-specific APIs throughout the component tree.

## Default rule

```text
same task + same information
  -> same component and same layout system

different available space
  -> responsive composition

different runtime capability
  -> capability adapter

different operating-system chrome
  -> shell-only treatment
```

Do not create separate web and desktop pages for equivalent workflows without a real product reason.

## Responsive by space

A desktop application window may be narrower than a browser tab. A browser window may be wider than a desktop app.

- choose layout from available width/height, not runtime labels;
- prefer Grid/Flexbox and container queries for local adaptation;
- use viewport queries for true page-shell transitions;
- treat breakpoints as layout thresholds, not device categories;
- support continuous resizing without reload;
- preserve reading order when panes collapse or stack.

## Window-safe layout

Design for arbitrary window geometry, including short windows.

- use one intentional scrolling owner per major pane;
- give flex/grid children `min-width: 0` and `min-height: 0` when they own overflow;
- avoid accidental body scroll plus nested panel scroll;
- keep dialogs, dropdowns, drawers, and command palettes within the visible work area;
- avoid fixed heights for data/forms when the window can resize.

## Runtime capability adapter

Use capability detection when behavior genuinely differs. Keep browser-safe implementations for shared capabilities and make unsupported capabilities explicit.

Do not scatter Tauri globals, Electron preload APIs, Node APIs, filesystem calls, or shell imports across feature components. Treat privileged native APIs as a security boundary and expose the smallest possible command surface.

## Navigation

Keep one route/navigation model where practical. Browser back/forward and refresh/deep-link behavior should remain deterministic. Desktop deep links, menus, or tray actions should enter through one boundary and resolve into existing routes/actions rather than a second navigation tree.

## Files, clipboard, external links

Keep the user intent common while adapting the mechanism:

- file selection -> browser File API or native picker -> normalized application payload;
- external resource -> browser link/window behavior or shell opener -> one application-level intent;
- clipboard -> Web API when sufficient; native privilege only when required;
- drag/drop -> one visible interaction model, runtime metadata normalized at the edge.

Do not leak native filesystem paths or shell-specific objects deep into product components.

## Keyboard and desktop enhancements

Shortcuts are progressive enhancement. Core actions must remain available through visible UI. Avoid browser-reserved shortcuts in web builds, scope shortcuts to context, and disable them while typing when appropriate. Native/global shortcuts belong behind the runtime adapter.

## Design consistency

Web and desktop builds should share typography, spacing, color/status semantics, icon vocabulary, component variants, focus behavior, forms, loading/error/empty states, and localization rules.

## Shell choice

This Skill does not automatically introduce Tauri or Electron. Choose a desktop shell only when desktop packaging/native capability is explicitly required. Keep the WebUI shell-neutral either way.

## Security

For desktop shells, expose the smallest native API surface, validate privileged-boundary arguments, avoid broad process/shell/filesystem exposure, validate external URLs, isolate credentials/privileged storage, and review updater/deep-link behavior as security-sensitive surfaces.

## Validation matrix

Meaningful cross-platform changes should test representative browser widths, zoom/localized content, and—when a desktop shell exists—minimum/default/maximized/arbitrary window sizes. Also exercise keyboard/pointer flows, live resize, short viewports, overlays, loading/error/dirty states.

Do not claim desktop compatibility if only the browser build was tested.

## Completion

Report shared UI boundaries, runtime-specific capabilities and where they are isolated, responsive/window behavior, browser/desktop validation actually performed, shell dependencies introduced, security implications, and remaining platform-specific debt.