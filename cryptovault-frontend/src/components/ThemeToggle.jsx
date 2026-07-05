import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle({ darkMode, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="w-8 h-8 flex items-center justify-center rounded-xl bg-abyss-700/30 hover:bg-abyss-600/40 transition-all duration-200"
      aria-label="Toggle theme"
    >
      {darkMode ? (
        <Sun className="text-amber-400 w-5 h-5" />
      ) : (
        <Moon className="text-amber-200 w-5 h-5" />
      )}
    </button>
  );
}