"use client";

import { useTheme, type Theme } from "@/components/ThemeProvider";

const themeOptions: { value: Theme; label: string; description: string }[] = [
  {
    value: "light",
    label: "White mode",
    description: "Bright background with dark text for daytime use.",
  },
  {
    value: "dark",
    label: "Dark mode",
    description: "Low-light theme that is easier on your eyes at night.",
  },
];

export default function AdminSettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-w-0">
      <h1 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">Settings</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Configure application and admin preferences.
      </p>

      <section className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:mt-6 sm:p-6">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Theme</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Choose your admin panel appearance. The selected mode is saved automatically.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {themeOptions.map((option) => {
            const selected = theme === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setTheme(option.value)}
                className={`rounded-lg border p-4 text-left transition-colors ${
                  selected
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                    : "border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/40 dark:hover:bg-slate-900/70"
                }`}
                aria-pressed={selected}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{option.label}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {option.description}
                    </p>
                  </div>
                  {selected && (
                    <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-xs font-semibold text-white">
                      ON
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
