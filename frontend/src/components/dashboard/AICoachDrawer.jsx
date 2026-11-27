import { Bot, Loader2, Send, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const STARTER_PROMPTS = [
  "Explain my latest trainer feedback",
  "Break down Step 2 of my Action Plan",
  "Why did my score change this week?",
  "Build a 30-min study plan for today",
];

export default function AICoachDrawer({
  isOpen,
  onClose,
  messages,
  isThinking,
  onSendMessage,
  contextLabel,
  draftPrompt,
}) {
  const [input, setInput] = useState("");
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Pre-load contextual prompt when triggered via a card's "Ask AI" button.
  useEffect(() => {
    if (draftPrompt?.text) {
      setInput(draftPrompt.text);
      if (isOpen) {
        const timer = setTimeout(() => {
          inputRef.current?.focus();
        }, 120);
        return () => clearTimeout(timer);
      }
    }
    return undefined;
  }, [draftPrompt, isOpen]);

  // Auto-scroll to latest message or thinking indicator.
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isThinking, isOpen]);

  function handleSubmit(event) {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isThinking) return;
    setInput("");
    onSendMessage(trimmed);
  }

  function handleStarterClick(prompt) {
    if (isThinking) return;
    setInput("");
    onSendMessage(prompt);
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          aria-hidden="true"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-ink-deep/55 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        aria-label="AI Study Coach"
        aria-hidden={!isOpen}
        className={`fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-ink/10 bg-white shadow-xl transition-all duration-300 dark:border-white/10 dark:bg-ink sm:w-[400px] lg:sticky lg:top-16 lg:z-20 lg:h-[calc(100vh-4rem)] lg:shrink-0 lg:shadow-none ${
          isOpen
            ? "translate-x-0 lg:w-[380px] xl:w-[400px]"
            : "pointer-events-none translate-x-full lg:w-0 lg:overflow-hidden lg:border-l-0"
        }`}
      >
        {/* Header */}
        <div className="shrink-0 border-b border-ink/10 px-5 py-4 dark:border-white/10">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-lagoon/10 text-lagoon dark:bg-emerald-500/15 dark:text-emerald-300">
                <Sparkles size={16} aria-hidden />
              </span>
              <h2 className="font-display text-lg font-semibold text-ink dark:text-white">
                AI Study Coach
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close AI Study Coach"
              className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-ink/5 hover:text-ink dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <X size={18} aria-hidden />
            </button>
          </div>

          <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-lagoon/20 bg-lagoon/8 px-2.5 py-1 text-[11px] font-medium text-lagoon dark:border-emerald-400/25 dark:bg-emerald-500/10 dark:text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-lagoon dark:bg-emerald-400" />
            <span>Aware of: {contextLabel}</span>
          </div>
        </div>

        {/* Message Thread / Empty State */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col justify-center space-y-5">
              <div className="rounded-xl border border-ink/10 bg-paper/55 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="flex items-center gap-2 text-xs font-semibold text-lagoon dark:text-emerald-300">
                  <Bot size={15} aria-hidden />
                  <span>Personalized Study Guidance</span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  Ask about your Action Plan steps, weekly evaluation scores, or recent trainer
                  notes. Try one of these starters:
                </p>
              </div>

              <div className="space-y-2">
                {STARTER_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleStarterClick(prompt)}
                    className="w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-left text-xs font-medium text-ink transition-colors hover:border-lagoon hover:bg-lagoon/5 dark:border-white/15 dark:bg-ink-deep/60 dark:text-slate-200 dark:hover:border-emerald-400/60 dark:hover:bg-emerald-500/10"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-line ${
                        isUser
                          ? "rounded-br-xs bg-lagoon text-white dark:bg-emerald-500 dark:text-ink-deep"
                          : "rounded-bl-xs border border-ink/10 bg-paper/70 text-ink dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-100"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })}

              {isThinking && (
                <div className="flex justify-start" role="status" aria-live="polite">
                  <div className="inline-flex items-center gap-2 rounded-2xl rounded-bl-xs border border-ink/10 bg-paper/70 px-3.5 py-2.5 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-300">
                    <Loader2 size={14} className="animate-spin text-lagoon dark:text-emerald-300" aria-hidden />
                    <span>Analyzing your progress...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input & Disclaimer Footer */}
        <div className="shrink-0 border-t border-ink/10 p-4 dark:border-white/10">
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <label htmlFor="ai-coach-input" className="sr-only">
              Message AI Study Coach
            </label>
            <textarea
              id="ai-coach-input"
              ref={inputRef}
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Ask about your progress, steps, or feedback…"
              className="flex-1 resize-none rounded-xl border border-ink/15 bg-paper/40 px-3 py-2 text-xs text-ink placeholder:text-slate-400 dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || isThinking}
              aria-label="Send message"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lagoon text-white transition-colors hover:bg-lagoon-deep disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-500 dark:text-ink-deep dark:hover:bg-emerald-400"
            >
              <Send size={16} aria-hidden />
            </button>
          </form>

          <p className="mt-2.5 text-center text-[11px] text-slate-500 dark:text-slate-400">
            AI can make mistakes—verify key targets with your trainer
          </p>
        </div>
      </aside>
    </>
  );
}
