---
version: alpha
name: "System Design Notes"
description: "A bilingual technical reading workspace with restrained editorial hierarchy and highly legible architecture diagrams."
colors:
  primary: "#2563eb"
  ink: "#171717"
  text-muted: "#475569"
  canvas: "#fafafa"
  surface: "#ffffff"
  surface-subtle: "#f8fafc"
  border: "#e2e8f0"
  focus: "#2563eb"
  success: "#059669"
  error: "#b91c1c"
  note: "#fffbeb"
typography:
  sans:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace"
rounded:
  sm: "0.25rem"
  md: "0.375rem"
  lg: "0.5rem"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  section: "2.5rem"
components:
  reader: { }
  button: { }
  mermaid-diagram: { }
  dialog: { }
---

# System Design Notes Design System

## Overview

### Creative North Star

The interface follows a well-edited engineering handbook: a quiet paper-like reading canvas, compact navigation, precise controls, and diagrams that carry the visual emphasis. It should feel closer to technical documentation than to a SaaS dashboard.

### Product context and register

- **Audience and primary job:** Chinese- and English-reading engineers studying system design, RTOS, networking, and modem architecture.
- **Target markets and evidence:** Global technical readers; bilingual content and the existing language switch are the repository evidence.
- **Locales and language policy:** Chinese and English content share one visual system. UI labels follow the active language and system-font fallbacks must cover CJK.
- **Usage scene:** Long desktop reading sessions with occasional phone review; dense diagrams need zoom, scrolling, fullscreen inspection, and SVG export.
- **Register:** Product utility with an editorial document surface.
- **Memorable signature:** Architecture diagrams remain complete, calm, and directly explorable inside the reading flow.
- **Restraint:** Navigation and reader controls stay neutral so they do not compete with technical content.
- **Anti-references:** Avoid dashboard card grids, glow-heavy developer themes, decorative gradients, and diagram palettes with many unrelated accent colors.
- **Token ownership/runtime mapping:** Existing Tailwind utilities and `src/index.css` remain canonical. This file mirrors accepted runtime values; shared components such as `MermaidDiagram` own repeated behavior.

## Colors

Neutral canvas and white surfaces establish the reading hierarchy. Slate is used for secondary text, diagram connectors, and borders. Blue is reserved for focus and actionable emphasis; success and error colors retain their semantic roles. Mermaid clusters use `surface-subtle`, nodes use `surface`, and notes use `note`.

## Typography

Human-readable content and diagram labels use the locale-capable sans stack. Code, percentages, technical identifiers, and compact metadata use the mono stack. Body content preserves comfortable line height; diagrams use a 14px base before responsive fitting and remain zoomable when the fitted result becomes too small.

## Layout

The document reader is a bounded single-column flow with stable side navigation. Diagrams may use the full reading width. SVG view boxes determine aspect ratio; wide or dense diagrams retain a readable minimum working width on narrow screens and use an owned scroll surface instead of clipping. Fullscreen diagrams fit at 100% and grow through real stage dimensions when zoomed.

## Elevation & Depth

Hierarchy is primarily expressed through spacing, tonal surfaces, and one-pixel borders. Static diagram nodes and clusters do not use drop shadows. The fullscreen overlay may use backdrop dimming to separate the focused diagram from the reader.

## Shapes

Controls and technical containers use 4–8px radii. Diagram clusters use a 6px radius; icon buttons use the same compact geometry. Pills are reserved for genuine status or metadata, not general controls.

## Components

### Foundational visual states

Interactive controls provide default, hover, focus-visible, active, disabled, and busy states without changing their geometry. Loading regions reserve space. Errors remain inline with a retry action. Reduced-motion preferences remove nonessential animation.

### Buttons and actions

Utility icon buttons use neutral emphasis, localized accessible names, and at least a 28px inline target or 32px fullscreen target. Disabled zoom limits are both visually and semantically disabled.

### Navigation and data display

Reader navigation remains visually subordinate to article content. Tables and diagrams own their overflow; neither may widen or clip the document shell. The resource filter uses a native select intentionally because platform-owned popup behavior is acceptable for this lightweight reader.

### Forms and overlays

The fullscreen diagram is an app-owned modal with focus trapping, Escape dismissal, focus restoration, a scrollable canvas, and non-drag zoom controls. Editable text flowcharts use a fixed-layout, non-resizable source editor.

### Iconography

Lucide is the canonical icon family. Icons use consistent strokes and remain paired with text when the action is not universally understood.

### Motion

Motion is short and functional: 150ms color and size transitions communicate state. Dragging disables easing. Reduced-motion users receive immediate state changes.

### Content and data visualization

Technical copy is direct and bilingual. Diagrams use white/slate foundations, one quiet blue family for emphasis, amber for notes, and text alternatives through SVG title and description elements.

## Do's and Don'ts

- **Do:** Keep every diagram boundary reachable through fit, scroll, zoom, and fullscreen inspection.
- **Do:** Reuse the shared Mermaid renderer for all Markdown content domains.
- **Don't:** Apply transform-only zoom inside a clipped container.
- **Don't:** Add decorative shadows, gradients, or competing saturated colors to technical diagrams.
