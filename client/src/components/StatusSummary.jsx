import { STATUS_OPTIONS } from "../lib/format";

const STYLES = {
  todo: "text-slate-700",
  in_progress: "text-blue-700",
  done: "text-emerald-700",
};

// Count per status; clicking a card filters the list by that status (click again to clear).
export default function StatusSummary({ counts, active, onSelect }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {STATUS_OPTIONS.map(({ value, label }) => {
        const isActive = active === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onSelect(isActive ? "" : value)}
            className={`rounded-xl border bg-white p-3 text-left shadow-sm transition hover:border-indigo-300 sm:p-4 ${
              isActive
                ? "border-indigo-500 ring-2 ring-indigo-200"
                : "border-slate-200"
            }`}
          >
            <span className="block text-xs font-medium uppercase tracking-wide text-slate-500">
              {label}
            </span>
            <span className={`mt-1 block text-2xl font-bold ${STYLES[value]}`}>
              {counts?.[value] ?? "–"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
