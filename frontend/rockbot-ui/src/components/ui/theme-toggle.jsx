import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

/**
 * Global Theme Toggle Component
 * Toggles `dark` class on <html> and saves preference in localStorage.
 */
export default function ThemeToggle({ className = "" }) {
  const [theme, setTheme] = useState(() => {
    // Check saved preference or system preference
    if (typeof window === "undefined") return "light";
    const saved = localStorage.getItem("theme");
    if (saved) return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <button
      aria-label="Toggle theme"
      onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
      title="Toggle theme"
      className={`p-2 rounded-md border border-white/20 bg-white/10 hover:bg-white/20 dark:bg-gray-800/60 dark:hover:bg-gray-700/60 transition ${className}`}
    >
      {theme === "dark" ? (
        <Sun className="w-5 h-5 text-yellow-400" />
      ) : (
        <Moon className="w-5 h-5 text-gray-800" />
      )}
    </button>
  );
}
