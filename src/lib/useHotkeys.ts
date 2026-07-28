import { useEffect } from "react";
import type { View } from "../components/Sidebar";

const VIEW_KEYS: Record<string, View> = {
  "1": "home",
  "2": "daily",
  "3": "week",
  "4": "journal",
  "5": "money",
  "6": "fitness",
  "7": "notes",
  "8": "stats",
  "9": "settings",
};

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

function focusBySelector(selector: string): void {
  const el = document.querySelector<HTMLElement>(selector);
  el?.focus();
}

interface Options {
  setView: (v: View) => void;
  toggleHelp: () => void;
  closeHelp: () => void;
}

/** Global keyboard shortcuts for navigation and quick actions. */
export function useHotkeys({ setView, toggleHelp, closeHelp }: Options): void {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      // Escape always dismisses the help overlay, even from a field.
      if (event.key === "Escape") {
        closeHelp();
        return;
      }
      // Don't hijack keys while the user is typing.
      if (isTyping(event.target)) return;

      const view = VIEW_KEYS[event.key];
      if (view) {
        event.preventDefault();
        setView(view);
        return;
      }
      switch (event.key) {
        case "n":
          event.preventDefault();
          focusBySelector("[data-quickadd]");
          break;
        case "/":
          event.preventDefault();
          focusBySelector("[data-search]");
          break;
        case "?":
          event.preventDefault();
          toggleHelp();
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setView, toggleHelp, closeHelp]);
}
