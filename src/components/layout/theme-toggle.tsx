"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { useState, useEffect } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent transition-colors">
        <Monitor className="h-4 w-4" />
      </button>
    );
  }

  function toggle() {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  }

  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

  return (
    <button
      onClick={toggle}
      className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent transition-colors"
      title={`Tema: ${theme === "dark" ? "Oscuro" : theme === "light" ? "Claro" : "Sistema"}`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
