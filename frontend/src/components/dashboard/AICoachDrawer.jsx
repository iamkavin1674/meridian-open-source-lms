import { Bot, Loader2, Send, Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const STARTER_PROMPTS = [
  "Explain my latest trainer feedback",
  "Break down Step 2 of my Action Plan",
  "Why did my score change this week?",
  "Build a 30-min study plan for today",
];

const BUTTON_SIZE = 52;
const EDGE_MARGIN = 12;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getInitialIconPos() {
  if (typeof window === "undefined") {
    return { x: 16, y: 340 };
  }
  return {
    x: 16,
    y: clamp(Math.round(window.innerHeight * 0.55), 80, window.innerHeight - BUTTON_SIZE - EDGE_MARGIN),
  };
}

export default function AICoachDrawer({
  isOpen,
  onToggle,
  onClose,
  messages,
  isThinking,
  onSendMessage,
  contextLabel,
  draftPrompt,
}) {
  const [input, setInput] = useState("");
  const [iconPos, setIconPos] = useState(getInitialIconPos);
  const [isDragging, setIsDragging] = useState(false);
  const [viewport, setViewport] = useState(() => ({
    width: typeof window !== "undefined" ? window.innerWidth : 1280,
    height: typeof window !== "undefined" ? window.innerHeight : 800,
  }));

  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const dragRef = useRef({
    active: false,
    moved: false,
    startClientX: 0,
    startClientY: 0,
    startX: 0,
    startY: 0,
  });

  // Track viewport size and keep floating icon clamped inside bounds.
  useEffect(() => {
    function handleResize() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setViewport({ width, height });
      setIconPos((prev) => ({
        x: clamp(prev.x, EDGE_MARGIN, width - BUTTON_SIZE - EDGE_MARGIN),
        y: clamp(prev.y, EDGE_MARGIN, height - BUTTON_SIZE - EDGE_MARGIN),
      }));
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close popup on Escape key.
  useEffect(() => {
    if (!isOpen) return undefined;
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Pre-load contextual prompt when triggered via a card's "Ask AI" button.
  useEffect(() => {
    if (draftPrompt?.text) {
      setInput(draftPrompt.text);
      if (isOpen) {
        const timer = setTimeout(() => {
          inputRef.current?.focus();
        }, 160);
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

  const handlePointerDown = useCallback(
    (event) => {
      if (event.button !== 0 && event.pointerType === "mouse") return;
      event.currentTarget.setPointerCapture(event.pointerId);
      dragRef.current = {
        active: true,
        moved: false,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startX: iconPos.x,
        startY: iconPos.y,
      };
      setIsDragging(true);
    },
    [iconPos]
  );

  const handlePointerMove = useCallback(
    (event) => {
      const drag = dragRef.current;
      if (!drag.active) return;
      const dx = event.clientX - drag.startClientX;
      const dy = event.clientY - drag.startClientY;
      if (!drag.moved && Math.hypot(dx, dy) > 5) {
        drag.moved = true;
      }
      if (drag.moved) {
        setIconPos({
          x: clamp(drag.startX + dx, EDGE_MARGIN, viewport.width - BUTTON_SIZE - EDGE_MARGIN),
          y: clamp(drag.startY + dy, EDGE_MARGIN, viewport.height - BUTTON_SIZE - EDGE_MARGIN),
        });
      }
    },
    [viewport]
  );

  const handlePointerUp = useCallback(() => {
    const drag = dragRef.current;
    if (!drag.active) return;
    const wasMoved = drag.moved;
    drag.active = false;
    setIsDragging(false);
    if (!wasMoved) {
      onToggle?.();
    }
  }, [onToggle]);

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

  // Compute floating popup position & transformOrigin so it originates directly from the icon.
  const popupWidth = Math.min(390, viewport.width - EDGE_MARGIN * 2);
  const popupHeight = Math.min(540, viewport.height - EDGE_MARGIN * 2);
  const iconCenterX = iconPos.x + BUTTON_SIZE / 2;
  const iconCenterY = iconPos.y + BUTTON_SIZE / 2;

  const openToRight = iconCenterX < viewport.width / 2;
  const rawLeft = openToRight ? iconPos.x : iconPos.x + BUTTON_SIZE - popupWidth;
  const popupLeft = clamp(rawLeft, EDGE_MARGIN, viewport.width - popupWidth - EDGE_MARGIN);

  const openDownward = iconCenterY < viewport.height / 2;
  const rawTop = openDownward ? iconPos.y : iconPos.y + BUTTON_SIZE - popupHeight;
  const popupTop = clamp(rawTop, EDGE_MARGIN, viewport.height - popupHeight - EDGE_MARGIN);

  const originX = clamp(iconCenterX - popupLeft, 16, popupWidth - 16);
  const originY = clamp(iconCenterY - popupTop, 16, popupHeight - 16);

  return (
    <>
      {/* Draggable Floating AI Coach Icon */}
      <button
        type="button"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        aria-label={isOpen ? "Close AI Study Coach" : "Open AI Study Coach (drag to move)"}
        aria-expanded={isOpen}
        title="AI Study Coach · Drag anywhere"
        style={{
          left: `${iconPos.x}px`,
          top: `${iconPos.y}px`,
          width: `${BUTTON_SIZE}px`,
          height: `${BUTTON_SIZE}px`,
          touchAction: "none",
        }}
        className={`fixed z-50 flex select-none items-center justify-center rounded-full border shadow-lg transition-shadow ${
          isDragging ? "cursor-grabbing scale-105 shadow-xl" : "cursor-grab hover:shadow-xl"
        } ${
          isOpen
            ? "border-lagoon bg-ink text-white dark:border-emerald-400 dark:bg-white dark:text-ink"
            : "border-lagoon/30 bg-lagoon text-white hover:bg-lagoon-deep dark:border-emerald-300/40 dark:bg-emerald-500 dark:text-ink-deep dark:hover:bg-emerald-400"
        }`}
      >
        <Sparkles size={22} aria-hidden />
      </button>

      {/* Overlapping Floating AI Coach Pop-up originating from the icon */}
      <aside
        aria-label="AI Study Coach"
        aria-hidden={!isOpen}
        style={{
          left: `${popupLeft}px`,
          top: `${popupTop}px`,
          width: `${popupWidth}px`,
          height: `${popupHeight}px`,
          transformOrigin: `${originX}px ${originY}px`,
        }}
        className={`fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-ink/15 bg-white shadow-2xl transition-all duration-250 ease-out dark:border-white/15 dark:bg-ink ${
          isOpen
            ? "scale-100 opacity-100"
            : "pointer-events-none scale-0 opacity-0"
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
