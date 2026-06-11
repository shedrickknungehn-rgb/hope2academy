---
name: AI chat provider (Gemini)
description: Why the public /chat assistant uses Google Gemini with the user's own key, and the thinking-budget gotcha
---

## Decision
The public website AI chat assistant (api-server `POST /chat`) uses **Google Gemini**
(`@google/genai` SDK) with the **user's own `GEMINI_API_KEY`** — NOT OpenAI, and NOT
the Replit AI proxy.

**Why:** The user explicitly chose to bring their own Google/Gemini key. The Replit
AI integration proxy (`setupReplitAIIntegrations`) is unavailable on this account —
it repeatedly returns `awaiting_phone_verification`, so do not rely on it. An earlier
OpenAI attempt also failed because the user's key was a Replit-gateway `AQ.` token,
which 401s against the standard OpenAI endpoint.

**How to apply:** Client lives in `src/lib/gemini.ts`; it is `null` when the key is
absent so `/chat` returns a clean 503 instead of crashing. Map message history into
Gemini `contents` with role `assistant`→`model`; put the system prompt in
`config.systemInstruction` (a plain string is accepted).

## Gotcha: thinking budget eats maxOutputTokens
`gemini-2.5-flash` has "thinking" ON by default, and thinking tokens count against
`maxOutputTokens`. With a small cap (e.g. 1024) a long answer can spend the whole
budget on reasoning and return empty `text` (finishReason MAX_TOKENS), which then
shows up as the fallback "Sorry — I couldn't generate a response."

**Fix:** pass `config.thinkingConfig = { thinkingBudget: 0 }` for this low-latency
chat widget. Required whenever using 2.5-flash/2.5-pro with a tight output cap.
