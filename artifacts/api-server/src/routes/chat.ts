/**
 * POST /chat — public AI assistant for the HOPE2 ACADEMY website.
 *
 * Visitors (no auth) can ask questions about the school. The request carries the
 * recent conversation; we prepend a school-specific system prompt and call Gemini.
 * Returns { reply }. If no API key is configured, returns 503.
 */
import { Router, type IRouter, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import { gemini, GEMINI_MODEL } from "../lib/gemini.js";

const router: IRouter = Router();

// The chat endpoint is public and calls a paid AI API, so rate-limit per IP to
// protect the Gemini quota from abuse. Tunable via CHAT_RATE_LIMIT (req/min).
const chatLimiter = rateLimit({
  windowMs: 60_000,
  limit: Number(process.env.CHAT_RATE_LIMIT || 20),
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down and try again shortly." },
});

const SYSTEM_PROMPT = [
  "You are the friendly AI assistant for HOPE2 ACADEMY, a school in Liberia.",
  "Help prospective and current families, students, and staff with questions about",
  "the school: its mission, programs and departments, admissions, contact details,",
  "events, and general guidance. Be warm, concise, and encouraging.",
  "If you are unsure or a question needs an official answer (fees, specific dates,",
  "enrollment status), say so and suggest contacting the school via the Contact page.",
  "Never invent specific facts you do not know. Keep replies short and conversational.",
].join(" ");

const MAX_MESSAGES = 16;
const MAX_CONTENT = 4000;

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

router.post("/chat", chatLimiter, async (req: Request, res: Response) => {
  const body = req.body as { messages?: unknown };
  const incoming = Array.isArray(body?.messages) ? (body.messages as ChatMessage[]) : [];

  const history = incoming
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-MAX_MESSAGES)
    .map((m) => ({ role: m.role, content: String(m.content).slice(0, MAX_CONTENT) }));

  if (history.length === 0) {
    res.status(400).json({ error: "messages required" });
    return;
  }

  if (!gemini) {
    res.status(503).json({ error: "AI assistant is not configured yet." });
    return;
  }

  // Gemini uses "user"/"model" roles inside `contents`; the system prompt goes
  // into systemInstruction. Map the assistant role to "model".
  const contents = history.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  try {
    const result = await gemini.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        maxOutputTokens: 1024,
        // gemini-2.5-flash enables "thinking" by default, and thinking tokens
        // count against maxOutputTokens — which can exhaust the budget and yield
        // an empty reply. Disable it for this low-latency chat widget.
        thinkingConfig: { thinkingBudget: 0 },
      },
    });
    const reply = result.text?.trim() || "Sorry — I couldn't generate a response. Please try again.";
    res.json({ reply });
  } catch (error) {
    req.log.error({ err: error }, "Chat completion failed");
    res.status(500).json({ error: "The AI assistant ran into a problem. Please try again." });
  }
});

export default router;
