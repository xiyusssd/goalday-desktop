import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { flushData } from "./lib/storage";
import "./index.css";
import "./i18n";

// localStorage writes are debounced (see storage.ts); force any pending write
// out when the window is closing or backgrounded so no edit is lost.
window.addEventListener("pagehide", flushData);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") flushData();
});

// Suppress the webview's native right-click menu (which exposes "Inspect
// Element"/devtools), but keep it on editable fields so paste still works.
document.addEventListener("contextmenu", (event) => {
  const el = event.target as HTMLElement | null;
  const editable =
    el?.tagName === "INPUT" || el?.tagName === "TEXTAREA" || el?.isContentEditable;
  if (!editable) event.preventDefault();
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
