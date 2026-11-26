import { Moon, Sun } from "lucide-react";

export default function ThemeToggle({ isDark, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="fixed right-5 top-5 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 bg-white/90 text-ink shadow-sm backdrop-blur transition-colors hover:bg-white dark:border-white/20 dark:bg-ink-deep/90 dark:text-amber-200 dark:hover:bg-ink"
    >
      {isDark ? <Sun size={18} aria-hidden /> : <Moon size={18} aria-hidden />}
    </button>
  );
}
