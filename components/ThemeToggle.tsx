"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

/**
 * Light/dark switch for the header. The class is set pre-paint by the inline
 * script in app/layout.tsx (no flash); this reflects + flips it and persists
 * the choice to localStorage.
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
      className="p-2 rounded-xl border border-line text-muted hover:text-ink hover:bg-accentfg/[0.08] transition-colors"
    >
      {/* Render the icon only after mount so SSR markup matches the client. */}
      {mounted ? (
        dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />
      ) : (
        <span className="block w-5 h-5" />
      )}
    </button>
  );
}
