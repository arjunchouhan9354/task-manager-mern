import { Badge } from "./ui";
import {
  formatDueDate,
  isDueToday,
  isOverdue,
  priorityLabel,
  STATUS_OPTIONS,
} from "../lib/format";

const STATUS_SELECT_STYLES = {
  todo: "border-slate-300 bg-white text-slate-700",
  in_progress: "border-blue-300 bg-blue-50 text-blue-700",
  done: "border-emerald-300 bg-emerald-50 text-emerald-700",
};

export default function TaskCard({ task, onStatusChange, onEdit, onDelete }) {
  const done = task.status === "done";
  const overdue = isOverdue(task);

  return (
    <li
      className={`rounded-xl border bg-white p-4 shadow-sm transition hover:shadow ${
        overdue ? "border-red-200" : "border-slate-200"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h3
            className={`break-words font-semibold ${
              done ? "text-slate-400 line-through" : "text-slate-900"
            }`}
          >
            {task.title}
          </h3>
          {task.description && (
            <p
              className={`mt-1 line-clamp-2 break-words text-sm ${
                done ? "text-slate-400" : "text-slate-600"
              }`}
            >
              {task.description}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge tone={task.priority}>
              {priorityLabel(task.priority)} priority
            </Badge>
            {task.dueDate && (
              <span
                className={`text-xs ${
                  overdue ? "font-medium text-red-600" : "text-slate-500"
                }`}
              >
                Due {formatDueDate(task.dueDate)}
              </span>
            )}
            {overdue && <Badge tone="overdue">Overdue</Badge>}
            {isDueToday(task) && <Badge tone="today">Due today</Badge>}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:flex-col sm:items-end sm:gap-2">
          <label className="sr-only" htmlFor={`status-${task.id}`}>
            Status
          </label>
          <select
            id={`status-${task.id}`}
            value={task.status}
            onChange={(e) => onStatusChange(task, e.target.value)}
            className={`rounded-lg border px-2 py-1.5 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-200 ${
              STATUS_SELECT_STYLES[task.status]
            }`}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <div className="ml-auto flex gap-1 sm:ml-0">
            <button
              type="button"
              className="btn-ghost text-sm"
              onClick={() => onEdit(task)}
            >
              Edit
            </button>
            <button
              type="button"
              className="btn-ghost text-sm text-red-600 hover:bg-red-50"
              onClick={() => onDelete(task)}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}
