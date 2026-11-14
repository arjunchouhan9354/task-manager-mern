import { PRIORITY_OPTIONS, SORT_OPTIONS, STATUS_OPTIONS } from "../lib/format";

export default function FiltersBar({
  search,
  onSearchChange,
  filters,
  onChange,
  onClear,
  hasFilters,
}) {
  return (
    <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:grid-cols-[2fr_1fr_1fr_1.3fr_auto]">
      <div className="col-span-2 md:col-span-1">
        <label htmlFor="search" className="sr-only">
          Search tasks
        </label>
        <input
          id="search"
          type="search"
          className="input"
          placeholder="Search by title…"
          maxLength={100}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="filter-status" className="sr-only">
          Status
        </label>
        <select
          id="filter-status"
          className="input"
          value={filters.status}
          onChange={(e) => onChange({ status: e.target.value })}
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="filter-priority" className="sr-only">
          Priority
        </label>
        <select
          id="filter-priority"
          className="input"
          value={filters.priority}
          onChange={(e) => onChange({ priority: e.target.value })}
        >
          <option value="">All priorities</option>
          {PRIORITY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="col-span-2 md:col-span-1">
        <label htmlFor="sort" className="sr-only">
          Sort
        </label>
        <select
          id="sort"
          className="input"
          value={filters.sort}
          onChange={(e) => onChange({ sort: e.target.value })}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        className="btn-secondary col-span-2 md:col-span-1"
        onClick={onClear}
        disabled={!hasFilters}
      >
        Clear
      </button>
    </div>
  );
}
