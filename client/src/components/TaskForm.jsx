import { useState } from "react";
import { getErrorMessage, getFieldErrors } from "../api/axios";
import { validateTask } from "../lib/validate";
import { dateOnly, PRIORITY_OPTIONS, STATUS_OPTIONS } from "../lib/format";

// Form for "New task" and "Edit task". onSave(task) is given by the page and does the API call.
export default function TaskForm({ task, onSave, onCancel, submitLabel }) {
  const [form, setForm] = useState({
    title: task?.title || "",
    description: task?.description || "",
    status: task?.status || "todo",
    priority: task?.priority || "medium",
    dueDate: dateOnly(task?.dueDate), // 'YYYY-MM-DD' or ''
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" }); // clear the error of the field being edited
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    const formErrors = validateTask(form);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setSaving(true);
    try {
      await onSave({
        ...form,
        title: form.title.trim(),
        dueDate: form.dueDate || null,
      });
    } catch (err) {
      setErrors(getFieldErrors(err)); // e.g. { title: 'Title is required' } from the server
      setServerError(getErrorMessage(err));
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {serverError && (
        <p
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          {serverError}
        </p>
      )}

      <div>
        <label htmlFor="title" className="label">
          Title *
        </label>
        <input
          id="title"
          name="title"
          value={form.title}
          onChange={handleChange}
          autoFocus
          maxLength={120}
          placeholder="e.g. Prepare sprint report"
          className={`input ${errors.title ? "input-error" : ""}`}
        />
        {errors.title && <p className="field-error">{errors.title}</p>}
      </div>

      <div>
        <label htmlFor="description" className="label">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={3}
          maxLength={1000}
          placeholder="Optional details"
          className={`input resize-y ${
            errors.description ? "input-error" : ""
          }`}
        />
        {errors.description && (
          <p className="field-error">{errors.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="status" className="label">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={form.status}
            onChange={handleChange}
            className="input"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="priority" className="label">
            Priority
          </label>
          <select
            id="priority"
            name="priority"
            value={form.priority}
            onChange={handleChange}
            className="input"
          >
            {PRIORITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="dueDate" className="label">
            Due date
          </label>
          <input
            id="dueDate"
            name="dueDate"
            type="date"
            value={form.dueDate}
            onChange={handleChange}
            className={`input ${errors.dueDate ? "input-error" : ""}`}
          />
          {errors.dueDate && <p className="field-error">{errors.dueDate}</p>}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          className="btn-secondary"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
