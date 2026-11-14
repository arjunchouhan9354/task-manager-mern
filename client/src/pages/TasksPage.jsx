import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import StatusSummary from "../components/StatusSummary";
import FiltersBar from "../components/FiltersBar";
import TaskCard from "../components/TaskCard";
import TaskForm from "../components/TaskForm";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import Pagination from "../components/Pagination";
import { Spinner, TaskSkeleton } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../api/axios";
import {
  createTaskApi,
  deleteTaskApi,
  getTasksApi,
  updateTaskApi,
} from "../api/tasks";
import { statusLabel } from "../lib/format";

export default function TasksPage() {
  const { setUser } = useAuth();

  // 1. Filters are kept in the URL (?status=done&sort=due_soon&page=2), so a refresh keeps them.
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get("status") || "";
  const priority = searchParams.get("priority") || "";
  const q = searchParams.get("q") || "";
  const sort = searchParams.get("sort") || "newest";
  const page = Number(searchParams.get("page")) || 1;

  // 2. Page data
  const [tasks, setTasks] = useState([]);
  const [meta, setMeta] = useState(null); // { page, totalPages, total, counts }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState(q); // what is typed in the search box

  // 3. Dialogs
  const [editingTask, setEditingTask] = useState(null); // null = closed, {} = new task, task = edit
  const [deletingTask, setDeletingTask] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Change one or more filters in the URL. Changing a filter (not the page) goes back to page 1.
  const updateFilters = (changes) => {
    const params = new URLSearchParams(searchParams);
    Object.keys(changes).forEach((key) => {
      if (changes[key]) params.set(key, changes[key]);
      else params.delete(key);
    });
    if (!("page" in changes)) params.delete("page");
    setSearchParams(params, { replace: true });
  };

  const clearFilters = () => {
    setSearch("");
    setSearchParams({}, { replace: true });
  };

  // Load the tasks from the API with the current filters.
  // signal (optional) comes from the useEffect below, so an old request can be cancelled.
  const loadTasks = async (signal) => {
    setLoading(true);
    setError("");
    try {
      const result = await getTasksApi(
        { status, priority, q, sort, page },
        signal
      );
      setTasks(result.data);
      setMeta(result.meta);
      // If the page is now empty (e.g. last task on it deleted), go back to the last page.
      if (page > result.meta.totalPages)
        updateFilters({ page: result.meta.totalPages });
    } catch (err) {
      if (err.name === "CanceledError") return; // replaced by a newer request: ignore
      if (err.response?.status === 401) setUser(null); // session expired → back to login
      setError(getErrorMessage(err));
    }
    setLoading(false);
  };

  // Reload whenever a filter changes. If the filters change again before the answer arrives,
  // the cleanup cancels the old request, so an old (slower) answer can't replace the new list.
  useEffect(() => {
    const controller = new AbortController();
    loadTasks(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, priority, q, sort, page]);

  // Search: wait until the user stops typing for 400 ms, then update the URL (this triggers loadTasks).
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.trim() !== q) updateFilters({ q: search.trim() });
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Change status from the card: update the screen first, then save. If saving fails, put it back.
  const handleStatusChange = async (task, newStatus) => {
    const previousTasks = tasks;
    setTasks(
      tasks.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
    );
    try {
      await updateTaskApi(task.id, { status: newStatus });
      toast.success(`Moved to ${statusLabel(newStatus)}`);
      loadTasks(); // refresh counts and sorting
    } catch (err) {
      setTasks(previousTasks);
      toast.error(getErrorMessage(err));
    }
  };

  // Called by TaskForm. Errors are thrown back to the form so it can show them.
  const handleSave = async (values) => {
    if (editingTask.id) {
      await updateTaskApi(editingTask.id, values);
      toast.success("Task updated");
    } else {
      await createTaskApi(values);
      toast.success("Task created");
    }
    setEditingTask(null);
    loadTasks();
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteTaskApi(deletingTask.id);
      toast.success("Task deleted");
      setDeletingTask(null);
      loadTasks();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const hasFilters = Boolean(status || priority || q || sort !== "newest");
  const firstLoad = loading && !meta;

  return (
    <Layout>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My tasks</h1>
          <p className="text-sm text-slate-500">
            Create, track and finish your work.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => setEditingTask({})}
        >
          + New task
        </button>
      </div>

      <div className="space-y-4">
        <StatusSummary
          counts={meta?.counts}
          active={status}
          onSelect={(value) => updateFilters({ status: value })}
        />
        <FiltersBar
          search={search}
          onSearchChange={setSearch}
          filters={{ status, priority, sort }}
          onChange={updateFilters}
          onClear={clearFilters}
          hasFilters={hasFilters}
        />

        <div className="flex h-5 items-center justify-between text-sm text-slate-500">
          <span>
            {meta ? `${meta.total} ${meta.total === 1 ? "task" : "tasks"}` : ""}
          </span>
          {loading && !firstLoad && <Spinner className="h-4 w-4" />}
        </div>

        {firstLoad ? (
          <TaskSkeleton />
        ) : error ? (
          <div
            className="rounded-xl border border-red-200 bg-red-50 p-6 text-center"
            role="alert"
          >
            <p className="font-medium text-red-700">
              Could not load your tasks.
            </p>
            <p className="mt-1 text-sm text-red-600">{error}</p>
            <button
              type="button"
              className="btn-secondary mt-4"
              onClick={() => loadTasks()}
            >
              Try again
            </button>
          </div>
        ) : tasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
            {hasFilters ? (
              <>
                <p className="font-medium text-slate-800">
                  No tasks match your filters.
                </p>
                <button
                  type="button"
                  className="btn-secondary mt-4"
                  onClick={clearFilters}
                >
                  Clear filters
                </button>
              </>
            ) : (
              <>
                <p className="text-lg font-semibold text-slate-800">
                  No tasks yet
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Create your first task to get started.
                </p>
                <button
                  type="button"
                  className="btn-primary mt-4"
                  onClick={() => setEditingTask({})}
                >
                  + New task
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            <ul className="space-y-3">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={handleStatusChange}
                  onEdit={setEditingTask}
                  onDelete={setDeletingTask}
                />
              ))}
            </ul>
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              total={meta.total}
              disabled={loading}
              onPageChange={(newPage) => updateFilters({ page: newPage })}
            />
          </>
        )}
      </div>

      {editingTask && (
        <Modal
          title={editingTask.id ? "Edit task" : "New task"}
          onClose={() => setEditingTask(null)}
        >
          <TaskForm
            task={editingTask.id ? editingTask : null}
            submitLabel={editingTask.id ? "Save changes" : "Create task"}
            onSave={handleSave}
            onCancel={() => setEditingTask(null)}
          />
        </Modal>
      )}

      {deletingTask && (
        <ConfirmDialog
          title="Delete task?"
          message={`"${deletingTask.title}" will be permanently deleted.`}
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeletingTask(null)}
        />
      )}
    </Layout>
  );
}
