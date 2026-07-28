import { useMemo, useState } from "react";
import clsx from "clsx";
import { useStore } from "../store";
import { useT } from "../i18n";
import type { Note } from "../types";
import { StitchMascot } from "./stitch";

const NOTE_COLORS = ["#fde68a", "#fca5a5", "#a7f3d0", "#bfdbfe", "#ddd6fe", "#f5d0fe", "#e2e8f0"];

function PinIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7">
      <path d="M9 4h6l-1 6 3 3v2H7v-2l3-3-1-6zM12 15v5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function NotesView() {
  const { t } = useT();
  const notes = useStore((s) => s.notes);
  const addNote = useStore((s) => s.addNote);
  const updateNote = useStore((s) => s.updateNote);
  const toggleNotePin = useStore((s) => s.toggleNotePin);
  const deleteNote = useStore((s) => s.deleteNote);

  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notes
      .filter((n) => !n.deleted)
      .filter((n) => !q || n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q))
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt);
  }, [notes, query]);

  const editing: Note | undefined = notes.find((n) => n.id === editingId && !n.deleted);

  const createNote = () => {
    const id = addNote({ color: NOTE_COLORS[0] });
    setEditingId(id);
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center gap-2">
        <input
          data-search
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchNotes")}
          className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-brand-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        <button
          onClick={createNote}
          className="shrink-0 rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          + {t("newNote")}
        </button>
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-sm text-slate-400">
          <StitchMascot size={88} />
          {t("noNotes")}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 overflow-y-auto pb-2 md:grid-cols-3 xl:grid-cols-4">
          {visible.map((n) => (
            <button
              key={n.id}
              onClick={() => setEditingId(n.id)}
              className="group flex h-40 flex-col rounded-xl border border-black/5 p-3 text-left shadow-sm transition hover:shadow-md dark:border-white/5"
              style={{ backgroundColor: n.color }}
            >
              <div className="mb-1 flex items-start gap-1">
                <span className="flex-1 truncate text-sm font-semibold text-slate-800">
                  {n.title || t("noteTitlePlaceholder")}
                </span>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleNotePin(n.id);
                  }}
                  className={clsx(
                    "shrink-0 rounded p-0.5 transition",
                    n.pinned ? "text-slate-700" : "text-slate-400 opacity-0 group-hover:opacity-100",
                  )}
                  aria-label={n.pinned ? t("unpin") : t("pin")}
                >
                  <PinIcon filled={n.pinned} />
                </span>
              </div>
              <p className="flex-1 overflow-hidden whitespace-pre-wrap text-xs leading-relaxed text-slate-600">
                {n.body}
              </p>
            </button>
          ))}
        </div>
      )}

      {editing && (
        <NoteEditor
          note={editing}
          colors={NOTE_COLORS}
          onClose={() => setEditingId(null)}
          onChange={(patch) => updateNote(editing.id, patch)}
          onPin={() => toggleNotePin(editing.id)}
          onDelete={() => {
            deleteNote(editing.id);
            setEditingId(null);
          }}
        />
      )}
    </div>
  );
}

function NoteEditor({
  note,
  colors,
  onClose,
  onChange,
  onPin,
  onDelete,
}: {
  note: Note;
  colors: string[];
  onClose: () => void;
  onChange: (patch: Partial<Note>) => void;
  onPin: () => void;
  onDelete: () => void;
}) {
  const { t } = useT();
  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
      <div className="gd-backdrop absolute inset-0 bg-slate-900/30" />
      <div
        className="gd-drawer relative flex h-full w-full max-w-md flex-col gap-3 p-5 shadow-xl"
        style={{ backgroundColor: note.color }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <button onClick={onPin} className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-slate-700 hover:bg-black/5">
            <PinIcon filled={note.pinned} />
            {note.pinned ? t("pinned") : t("pin")}
          </button>
          <button onClick={onClose} className="rounded-lg px-2 py-1 text-slate-600 hover:bg-black/5">✕</button>
        </div>
        <input
          value={note.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder={t("noteTitlePlaceholder")}
          className="bg-transparent text-lg font-semibold text-slate-800 placeholder:text-slate-500/60 focus:outline-none"
        />
        <textarea
          value={note.body}
          onChange={(e) => onChange({ body: e.target.value })}
          placeholder={t("noteBodyPlaceholder")}
          className="flex-1 resize-none bg-transparent text-sm leading-relaxed text-slate-700 placeholder:text-slate-500/60 focus:outline-none"
        />
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600">{t("color")}</span>
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => onChange({ color: c })}
              className={clsx(
                "h-6 w-6 rounded-full border-2 transition",
                note.color === c ? "border-slate-600" : "border-white/60",
              )}
              style={{ backgroundColor: c }}
              aria-label={c}
            />
          ))}
          <button
            onClick={onDelete}
            className="ml-auto rounded-lg px-2 py-1 text-sm text-rose-600 hover:bg-rose-500/10"
          >
            {t("delete")}
          </button>
        </div>
      </div>
    </div>
  );
}
