---
name: Mock backend split
description: Client and server each have their own separate mock data stores; users are stored in a separate sub-store from other collections.
---

Two parallel mock stores exist:

- **Client** (`artifacts/hope2-academy/src/lib/mock-backend.ts`): `mockAuth` (users, auth, localStorage) + `mockDb` (all other collections, localStorage). Users are NOT accessible via `mockDb.list("users")` — use `mockAuth.listUsers()` instead.
- **Server** (`artifacts/api-server/src/lib/mock-store.ts`): single `mockStore` with all data including users in one `DB` object. `mockStore.findUserByEmail()` / `mockStore.findUserById()` for user lookups.

**Why:** The client mock pre-existed; the server mock mirrors its shape for API parity without a real DB.

**How to apply:** In portal components, never call `mockDb.list("users")` — always `mockAuth.listUsers()`. On the server, always use `mockStore` methods.
