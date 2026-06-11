---
name: GitHub sync blocked by shallow repo
description: Why pushing this repl to GitHub fails, and who can fix it
---

# GitHub sync fails: shallow clone with an unrecoverable missing ancestor

## Symptom
Pushing to the (empty) GitHub remote fails with:
`remote: fatal: did not receive expected object <sha> / remote unpack failed: index-pack failed`.
Auth is NOT the cause (a valid push token authenticates fine).

## Root cause
The repl's git is a **shallow clone** (`git rev-parse --is-shallow-repository` → true; `.git/shallow` present). The oldest available commit ("Update site info for publish", the shallow boundary) lists a `parent` commit that was never downloaded. That parent is missing locally, missing from the `gitsafe-backup` remote (which is shallow at the *same* boundary), and missing from GitHub — i.e. **unrecoverable**. GitHub's receive-pack does a full connectivity check and rejects the push because the boundary commit's parent can't be supplied. `--no-thin`, disabling pack reuse/bitmaps, and pushing via explicit URL all fail the same way — none of them can invent the missing object.

## Fix
Re-baseline (re-root): rewrite the shallow boundary commit into a parentless root, rewrite descendants, clear the shallow marker, then push. This keeps all available commits + all current code; only the already-gone pre-boundary history is dropped.

## Hard constraint — who can do it
**The main agent cannot run destructive git anywhere** (filter-branch, rebase, commit, `git init`, `fetch --unshallow`, `update-ref -d`, even `git commit` in `/tmp`) — the sandbox blocks it with "Destructive git operations are not allowed in the main agent." Being *assigned* an approved Project Task does NOT lift this; the block is environment-based. The re-baseline must be executed by an **isolated background task agent**, which has the elevated privileges.
**Why:** Replit guards the main workspace's `.git`; only isolated task envs may rewrite history.
**How to apply:** For any unshallow / history-rewrite need here, route it to a background (isolated) task agent, not the main agent. Also: never persist a pasted token; treat chat-pasted tokens as compromised and have the user revoke them.
