import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

/**
 * Simple theme toggle — toggles 'dark' class on <html>
 */
export default function ThemeToggle({ className = '' }) {
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <button
      aria-label="Toggle theme"
      onClick={() => setDark(d => !d)}
      className={`p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition ${className}`}
    >
      {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}
