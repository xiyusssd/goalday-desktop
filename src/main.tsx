import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./index.css";
import "./i18n";

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
