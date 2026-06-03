"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

/**
 * Floating light/dark toggle. The actual class is set pre-paint by the inline
 * script in app/layout.tsx (no flash); this just reflects + flips it and
 * persists the choice to localStorage.
 */
export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    setMounted(true);
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
    setDark(next);
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className="fixed bottom-5 right-5 z-[60] w-10 h-10 rounded-full bg-surface border border-line shadow-soft flex items-center justify-center text-muted hover:text-ink hover:border-accentfg/40 transition-colors"
    >
      {/* Render an icon only after mount so SSR markup matches the client. */}
      {mounted && (dark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />)}
    </button>
  );
}
