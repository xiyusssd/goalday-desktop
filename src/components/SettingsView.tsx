import { useRef, useState } from "react";
import clsx from "clsx";
import { useStore } from "../store";
import { useT } from "../i18n";
import { useSync } from "../lib/useSync";
import { exportData, importData } from "../lib/backup";

const GOAL_COLORS = [
  "#6366f1", "#ec4899", "#f59e0b", "#10b981",
  "#3b82f6", "#ef4444", "#8b5cf6", "#14b8a6",
];

const THEMES = [
  { value: "light", key: "themeLight" },
  { value: "dark", key: "themeDark" },
  { value: "system", key: "themeSystem" },
] as const;

const PALETTE_META = [
  { value: "stitch", key: "paletteStitch", swatch: "#1897d6" },
  { value: "sunset", key: "paletteSunset", swatch: "#f6501b" },
  { value: "forest", key: "paletteForest", swatch: "#12a670" },
  { value: "grape", key: "paletteGrape", swatch: "#8b4fe8" },
  { value: "rose", key: "paletteRose", swatch: "#ec3f75" },
  { value: "indigo", key: "paletteIndigo", swatch: "#6366f1" },
] as const;

export function SettingsView() {
  const settings = useStore((s) => s.settings);
  const setLanguage = useStore((s) => s.setLanguage);
  const setSettings = useStore((s) => s.setSettings);
  const user = useStore((s) => s.user);
  const goals = useStore((s) => s.goals);
  const addGoal = useStore((s) => s.addGoal);
  const deleteGoal = useStore((s) => s.deleteGoal);
  const getData = useStore((s) => s.getData);
  const replaceAll = useStore((s) => s.replaceAll);
  const { t } = useT();
  const { configured, signIn, signUp, signOut, runSync } = useSync();

  const fileInput = useRef<HTMLInputElement>(null);
  const [backupMsg, setBackupMsg] = useState("");

  const onImportFile = async (file: File) => {
    try {
      const merged = importData(getData(), await file.text());
      replaceAll(merged);
      setBackupMsg(t("importDone"));
    } catch {
      setBackupMsg(t("importFailed"));
    }
  };

  const [url, setUrl] = useState(settings.supabaseUrl);
  const [key, setKey] = useState(settings.supabaseAnonKey);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalColor, setGoalColor] = useState(GOAL_COLORS[0]);

  const activeGoals = goals.filter((goal) => !goal.deleted);

  const submitGoal = () => {
    if (!goalTitle.trim()) return;
    addGoal(goalTitle, goalColor);
    setGoalTitle("");
  };

  const doAuth = async (mode: "in" | "up") => {
    setError("");
    setBusy(true);
    try {
      if (mode === "in") await signIn(email, password);
      else await signUp(email, password);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex h-full max-w-xl flex-col gap-5 overflow-y-auto">
      {/* Language */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">{t("language")}</h3>
        <div className="flex gap-2">
          {(["zh", "en"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLanguage(l)}
              className={clsx(
                "rounded-lg border px-4 py-1.5 text-sm transition",
                settings.language === l
                  ? "border-brand-400 bg-brand-50 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300"
                  : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700",
              )}
            >
              {l === "zh" ? t("chinese") : t("english")}
            </button>
          ))}
        </div>
      </section>

      {/* Theme */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">{t("theme")}</h3>
        <div className="flex gap-2">
          {THEMES.map((option) => (
            <button
              key={option.value}
              onClick={() => setSettings({ theme: option.value })}
              className={clsx(
                "rounded-lg border px-4 py-1.5 text-sm transition",
                settings.theme === option.value
                  ? "border-brand-400 bg-brand-50 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300"
                  : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700",
              )}
            >
              {t(option.key)}
            </button>
          ))}
        </div>
      </section>

      {/* Palette */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">{t("colorTheme")}</h3>
        <div className="grid grid-cols-3 gap-2">
          {PALETTE_META.map((p) => (
            <button
              key={p.value}
              onClick={() => setSettings({ palette: p.value })}
              className={clsx(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition",
                settings.palette === p.value
                  ? "border-brand-400 bg-brand-50 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300"
                  : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700",
              )}
            >
              <span className="h-4 w-4 shrink-0 rounded-full" style={{ backgroundColor: p.swatch }} />
              {t(p.key)}
            </button>
          ))}
        </div>
      </section>

      {/* Goals */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">{t("goals")}</h3>
        <div className="mb-3 flex flex-col gap-1.5">
          {activeGoals.length === 0 ? (
            <p className="text-xs text-slate-400">{t("noGoals")}</p>
          ) : (
            activeGoals.map((goal) => (
              <div
                key={goal.id}
                className="group flex items-center gap-2 rounded-lg border border-slate-100 px-2.5 py-1.5 dark:border-slate-700"
              >
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: goal.color }} />
                <span className="flex-1 text-sm text-slate-700 dark:text-slate-200">{goal.title}</span>
                <button
                  onClick={() => deleteGoal(goal.id)}
                  className="text-slate-300 opacity-0 transition hover:text-rose-500 group-hover:opacity-100"
                  aria-label={t("delete")}
                >
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
                    <path d="M6 7h8l-.7 9.1a1 1 0 01-1 .9H7.7a1 1 0 01-1-.9L6 7zm2.5-3h3l.5 1H14a1 1 0 110 2H6a1 1 0 110-2h2l.5-1z" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            value={goalTitle}
            onChange={(event) => setGoalTitle(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && submitGoal()}
            placeholder={t("goalNamePlaceholder")}
            className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-brand-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          <div className="flex gap-1">
            {GOAL_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setGoalColor(color)}
                className={clsx(
                  "h-6 w-6 rounded-full border-2 transition",
                  goalColor === color ? "border-slate-400 dark:border-slate-300" : "border-transparent",
                )}
                style={{ backgroundColor: color }}
                aria-label={color}
              />
            ))}
          </div>
          <button
            onClick={submitGoal}
            className="shrink-0 rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            {t("addGoal")}
          </button>
        </div>
      </section>

      {/* Data backup */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <h3 className="mb-1 text-sm font-semibold text-slate-700 dark:text-slate-200">{t("dataBackup")}</h3>
        <p className="mb-3 text-xs text-slate-400 dark:text-slate-500">{t("backupHint")}</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportData(getData())}
            className="rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            {t("exportData")}
          </button>
          <button
            onClick={() => fileInput.current?.click()}
            className="rounded-lg border border-slate-200 px-4 py-1.5 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700"
          >
            {t("importData")}
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onImportFile(file);
              e.target.value = "";
            }}
          />
          {backupMsg && <span className="text-xs text-slate-500 dark:text-slate-400">{backupMsg}</span>}
        </div>
      </section>

      {/* Cloud sync */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <h3 className="mb-1 text-sm font-semibold text-slate-700 dark:text-slate-200">{t("cloudSync")}</h3>
        <p className="mb-3 text-xs text-slate-400 dark:text-slate-500">{t("supabaseHint")}</p>

        <div className="flex flex-col gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://xxxx.supabase.co"
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-brand-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          <input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="anon public key"
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-brand-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          <button
            onClick={() => setSettings({ supabaseUrl: url.trim(), supabaseAnonKey: key.trim() })}
            className="self-start rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            {t("save")}
          </button>
        </div>

        {configured && (
          <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-700">
            {user ? (
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600 dark:text-slate-300">
                  {t("loggedInAs")} <span className="font-medium">{user.email}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => void runSync()}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700"
                  >
                    {t("syncNow")}
                  </button>
                  <button
                    onClick={() => void signOut()}
                    className="rounded-lg border border-rose-200 px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-50"
                  >
                    {t("signOut")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("email")}
                  type="email"
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-brand-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("password")}
                  type="password"
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-brand-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
                {error && <p className="text-xs text-rose-500">{error}</p>}
                <div className="flex gap-2">
                  <button
                    disabled={busy}
                    onClick={() => void doAuth("in")}
                    className="rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                  >
                    {t("signIn")}
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => void doAuth("up")}
                    className="rounded-lg border border-slate-200 px-4 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-700"
                  >
                    {t("signUp")}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
