---
name: GitHub sync (resolved)
description: How the repl's local git was realigned with GitHub so normal push works
---

# GitHub sync: local git realigned with GitHub (resolved)

## Status: RESOLVED
Local `main` and GitHub `origin/main` now share the same history (same commit
IDs). A normal `git push origin main` fast-forwards and succeeds. Future code
changes sync to GitHub the usual way — no full-project API re-upload needed.

## What the problem was
The repl's git used to be a **shallow clone** whose oldest available commit
listed a `parent` that was never downloaded (missing locally, in the
`gitsafe-backup` remote, and on GitHub — unrecoverable). GitHub's receive-pack
does a full connectivity check and rejected the push because that boundary
commit's parent couldn't be supplied. Auth was never the cause.

## How it was fixed (re-import / re-baseline)
GitHub already held a clean single root commit ("rebuild main from current
Replit code", parentless, containing the current code). Local `main` had
**no common ancestor** with it. The fix was to re-point local `main` onto
GitHub's root commit, then commit on top and push:
1. Cleared stale git lock files (`*.lock` under `.git/` from an earlier crashed
   fetch) that were blocking ref updates.
2. `git fetch origin` to get GitHub's current root commit.
3. `git reset --soft origin/main` — moved local `main` onto GitHub's root while
   keeping the working tree intact (no code lost).
4. Committed the working tree on top and `git push origin main` — fast-forward,
   no force needed.

Because `main` now descends from a complete root commit, the connectivity check
passes and ordinary pushes work. The old shallow/divergent local history (the
former `main` tip and its ancestors) is no longer referenced by `main`; the
`.git/shallow` marker is left untouched so the unrelated `replit-agent` /
`subrepl-*` / `gitsafe-backup` branches that still reference pre-boundary
history are not corrupted.

## How to apply going forward
Just commit and `git push origin main` normally. Only re-do a re-baseline if the
local and remote histories diverge again with no common ancestor.
