---
name: Pre-existing TypeScript error in resizable.tsx
description: The shadcn resizable.tsx component has a TS error that predates all current work; it is not a regression.
---

`artifacts/hope2-academy/src/components/ui/resizable.tsx` has two errors:
- `Module '"react-resizable-panels"' has no exported member 'Group'`
- `Module '"react-resizable-panels"' has no exported member 'Separator'`

**Why:** The installed version of `react-resizable-panels` changed its export names; the shadcn-generated stub was not updated. This is a pre-existing issue.

**How to apply:** When running `tsc --noEmit` to check for regressions, filter out `resizable.tsx` lines. Any other `error TS` line is a real regression. Do not attempt to fix this unless explicitly asked.
