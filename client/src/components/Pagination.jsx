export default function Pagination({
  page,
  totalPages,
  total,
  onPageChange,
  disabled,
}) {
  if (totalPages <= 1) return null;
  return (
    <nav
      className="mt-4 flex items-center justify-between gap-3 text-sm"
      aria-label="Pagination"
    >
      <button
        type="button"
        className="btn-secondary"
        onClick={() => onPageChange(page - 1)}
        disabled={disabled || page <= 1}
      >
        ← Previous
      </button>
      <span className="text-slate-600">
        Page <strong>{page}</strong> of <strong>{totalPages}</strong>{" "}
        <span className="hidden sm:inline">· {total} tasks</span>
      </span>
      <button
        type="button"
        className="btn-secondary"
        onClick={() => onPageChange(page + 1)}
        disabled={disabled || page >= totalPages}
      >
        Next →
      </button>
    </nav>
  );
}
