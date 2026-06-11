import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useBrand } from "@/lib/brand";
import { Logo } from "@/components/Logo";
import { apiClient } from "@/lib/api-client";

type Msg = { role: "user" | "assistant"; content: string };

const STORAGE_KEY = "h2l.chat.thread";

export function LiveChat() {
  const brand = useBrand();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Msg[]>(() => {
    if (typeof localStorage === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Msg[]) : [];
    } catch { return []; }
  });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages)); } catch {}
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setSending(true);
    try {
      const reply = await apiClient.chat(next);
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (e: any) {
      setMessages((m) => [...m, { role: "assistant", content: `Connection issue: ${e?.message ?? e}. Please try again.` }]);
    } finally {
      setSending(false);
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const greeting: Msg = { role: "assistant", content: brand.chatGreeting };
  const view = messages.length === 0 ? [greeting] : messages;

  return (
    <>
      <button
        aria-label="Open live chat"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-warm)] grid place-items-center hover:scale-105 transition"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-24 right-5 z-50 w-[calc(100vw-2.5rem)] max-w-sm h-[70vh] max-h-[560px] bg-card border border-border rounded-3xl shadow-[var(--shadow-warm)] flex flex-col overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-3 bg-primary text-primary-foreground">
              <Logo size={36} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold leading-tight truncate">{brand.name}</p>
                <p className="text-[11px] opacity-80">AI assistant • Online</p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 rounded-full hover:bg-white/10"><X className="h-4 w-4" /></button>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-muted/30">
              {view.map((m, i) => (
                <div key={i} className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground rounded-br-sm"
                    : "mr-auto bg-card border border-border rounded-bl-sm"
                }`}>
                  {m.content}
                </div>
              ))}
              {sending && (
                <div className="mr-auto bg-card border border-border rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
                </div>
              )}
            </div>
            <div className="border-t border-border p-2 flex items-end gap-2 bg-background">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKey}
                rows={1}
                placeholder="Ask anything about HOPE2…"
                className="flex-1 resize-none rounded-2xl bg-muted px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40 max-h-24"
              />
              <button
                onClick={send}
                disabled={!input.trim() || sending}
                className="h-10 w-10 grid place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}