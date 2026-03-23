export default function AdminSettingsPage() {
  return (
    <div className="min-w-0">
      <h1 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">Settings</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Configure application and admin preferences.
      </p>
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:mt-6 sm:p-8">
        <p className="text-slate-500 dark:text-slate-400">
          Settings form — connect to your API.
        </p>
      </div>
    </div>
  );
}
