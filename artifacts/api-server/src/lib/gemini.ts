/**
 * Google Gemini client — uses the school's own GEMINI_API_KEY (Google AI Studio).
 *
 * `gemini` is null when no key is configured, so the /chat route can return a
 * clean 503 instead of crashing. Set the GEMINI_API_KEY secret to enable it.
 */
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env["GEMINI_API_KEY"];

export const geminiEnabled: boolean = Boolean(apiKey);

export const gemini: GoogleGenAI | null = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const GEMINI_MODEL = "gemini-2.5-flash";
