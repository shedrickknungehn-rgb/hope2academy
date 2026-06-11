---
name: Reveal/StaggerGroup animate on mount
description: Why the shared scroll-reveal components animate on mount instead of whileInView
---

# Reveal / StaggerGroup animate on mount (not whileInView)

`src/components/Motion.tsx` `Reveal` and `StaggerGroup` use `initial="hidden" animate="show"`
(animate on mount), NOT framer-motion `whileInView` + IntersectionObserver.

**Why:** The hero on the home page is full-viewport-height, and the canvas/preview iframe
does not scroll. With `whileInView`, any below-the-fold section never enters the viewport, so
the IntersectionObserver never fires and the content stays stuck at `initial` (opacity:0) =
permanently invisible. This is the same class of render-environment fragility as the oklch
gradient gotcha. Animate-on-mount guarantees every section becomes visible regardless of scroll.

**Trade-off accepted:** the scroll-triggered reveal effect is gone — sections fade in once on
load rather than as you scroll to them. Reliability was chosen over the flourish.

**How to apply:** Do NOT reintroduce `whileInView`/`viewport={{...}}` on these shared
components or on section-level entrance animations. Inline decorative `motion.*` elements in
routes should also use `animate` (mount), not `whileInView`, for the same reason.

**Also:** `Reveal` must apply the caller's `className` (`className={className}`). A visual-editor
edit once hardcoded a fixed className into the component, silently overriding every section's
styling app-wide (home + all portal pages) — watch for this if section styling breaks globally.
