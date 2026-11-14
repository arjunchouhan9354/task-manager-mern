export const STATUS_OPTIONS = [
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

export const PRIORITY_OPTIONS = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "due_soon", label: "Due soonest" },
  { value: "priority", label: "Priority (high → low)" },
];

export const statusLabel = (value) =>
  STATUS_OPTIONS.find((o) => o.value === value)?.label ?? value;
export const priorityLabel = (value) =>
  PRIORITY_OPTIONS.find((o) => o.value === value)?.label ?? value;

// Due dates are calendar dates (stored as midnight UTC), so compare and display them as dates, not times.
export const dateOnly = (iso) => (iso ? iso.slice(0, 10) : "");

function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

export function isOverdue(task) {
  return (
    Boolean(task.dueDate) &&
    task.status !== "done" &&
    dateOnly(task.dueDate) < todayLocal()
  );
}

export function isDueToday(task) {
  return (
    Boolean(task.dueDate) &&
    task.status !== "done" &&
    dateOnly(task.dueDate) === todayLocal()
  );
}

export function formatDueDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
