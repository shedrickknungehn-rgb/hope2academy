---
name: API server port
description: The dev workflow for the API server listens on port 8080 (not 5000 as the replit.md says).
---

The API server listens on whatever `PORT` env var is assigned by the Replit workflow — in practice this is **8080** during dev, not 5000.

**Why:** The workflow injects PORT; the Express app reads `process.env.PORT ?? 5000`, and Replit assigns 8080 for this artifact slot.

**How to apply:** When curl-testing the API server locally, always use `http://localhost:8080/api/...`. Do not use 5000.
