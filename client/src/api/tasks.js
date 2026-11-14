import api from "./axios";

// filters: { status, priority, q, sort, page } → returns { data: tasks[], meta: { page, totalPages, total, counts } }
// signal (optional): lets the page cancel this request if the filters change before it finishes.
export const getTasksApi = async (filters, signal) => {
  const params = {};
  Object.keys(filters).forEach((key) => {
    if (filters[key]) params[key] = filters[key]; // skip empty filters
  });
  const res = await api.get("/tasks", {
    params: { ...params, limit: 10 },
    signal,
  });
  return res.data;
};

export const createTaskApi = async (task) => {
  const res = await api.post("/tasks", task);
  return res.data.data;
};

export const updateTaskApi = async (id, changes) => {
  const res = await api.patch(`/tasks/${id}`, changes);
  return res.data.data;
};

export const deleteTaskApi = async (id) => {
  await api.delete(`/tasks/${id}`);
};
