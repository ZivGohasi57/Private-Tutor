export function Input({ label, value, onChange, type = "text", placeholder, autoFocus, required }) {
  return (
    <div className="mb-4">
      {label && <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        required={required}
        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
      />
    </div>
  );
}