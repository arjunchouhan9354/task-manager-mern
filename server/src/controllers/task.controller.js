const mongoose = require("mongoose");
const { Task, formatTask } = require("../models/Task");

// Find one task that belongs to the logged-in user (another user's task is treated as "not found").
const findOwnTask = async (taskId, userId) => {
  if (!mongoose.isValidObjectId(taskId)) return null;
  return Task.findOne({ _id: taskId, userId });
};

const notFound = (res) =>
  res
    .status(404)
    .json({ error: true, status: 404, message: "Task not found." });

// Make search text safe to use inside a regex (e.g. "(Q1)" is searched literally).
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Get my tasks (with filters, search, sorting and pagination)
// Route: GET /api/tasks?status=&priority=&q=&sort=&page=&limit=
// Access: logged-in user
const getTasks = async (req, res) => {
  try {
    const { status, priority, q, sort, page, limit } = req.validQuery;
    const userId = new mongoose.Types.ObjectId(req.user.id);

    // 1. Filters: always only this user's tasks
    const filter = { userId };
    if (priority) filter.priority = priority;
    if (q) filter.title = { $regex: escapeRegex(q), $options: "i" };
    const listFilter = status ? { ...filter, status } : filter;

    // 2. Sorting
    //    due_soon → tasks with a due date first (earliest first), tasks without one last
    //    priority → high, medium, low (not alphabetical)
    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      due_soon: { noDueDate: 1, dueDate: 1, createdAt: -1 },
      priority: { priorityRank: 1, createdAt: -1 },
    };

    // 3. Run three queries at the same time: the page of tasks, the total, and the count per status
    const [tasks, total, statusCounts] = await Promise.all([
      Task.aggregate([
        { $match: listFilter },
        {
          $addFields: {
            noDueDate: { $cond: [{ $ifNull: ["$dueDate", false] }, 0, 1] },
            priorityRank: {
              $indexOfArray: [["high", "medium", "low"], "$priority"],
            },
          },
        },
        { $sort: sortOptions[sort] },
        { $skip: (page - 1) * limit },
        { $limit: limit },
      ]),
      Task.countDocuments(listFilter),
      // Counts ignore the status filter, so the summary always shows every status
      Task.aggregate([
        { $match: filter },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    const counts = { todo: 0, in_progress: 0, done: 0 };
    statusCounts.forEach((item) => {
      counts[item._id] = item.count;
    });

    return res.status(200).json({
      error: false,
      status: 200,
      message: "Tasks fetched successfully.",
      data: tasks.map(formatTask),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        counts,
      },
    });
  } catch (err) {
    console.error("getTasks error:", err);
    return res
      .status(500)
      .json({ error: true, status: 500, message: "Could not fetch tasks." });
  }
};

// Create a task
// Route: POST /api/tasks
// Access: logged-in user
const createTask = async (req, res) => {
  try {
    const { title, description, status = "todo", priority, dueDate } = req.body;

    const task = await Task.create({
      userId: req.user.id, // owner always comes from the login cookie, never from the request body
      title,
      description,
      status,
      priority,
      dueDate,
      completedAt: status === "done" ? new Date() : null,
    });

    return res.status(201).json({
      error: false,
      status: 201,
      message: "Task created successfully.",
      data: formatTask(task),
    });
  } catch (err) {
    console.error("createTask error:", err);
    return res.status(500).json({
      error: true,
      status: 500,
      message: "Could not create the task.",
    });
  }
};

// Get one task
// Route: GET /api/tasks/:id
// Access: logged-in user (own tasks only)
const getTask = async (req, res) => {
  try {
    const task = await findOwnTask(req.params.id, req.user.id);
    if (!task) return notFound(res);

    return res.status(200).json({
      error: false,
      status: 200,
      message: "Task fetched successfully.",
      data: formatTask(task),
    });
  } catch (err) {
    console.error("getTask error:", err);
    return res
      .status(500)
      .json({ error: true, status: 500, message: "Could not fetch the task." });
  }
};

// Update a task (any of: title, description, status, priority, dueDate)
// Route: PATCH /api/tasks/:id
// Access: logged-in user (own tasks only)
const updateTask = async (req, res) => {
  try {
    const task = await findOwnTask(req.params.id, req.user.id);
    if (!task) return notFound(res);

    const { status, ...fields } = req.body;
    task.set(fields);

    // Remember when a task was finished; clear it if it's moved back
    if (status && status !== task.status) {
      task.status = status;
      task.completedAt = status === "done" ? new Date() : null;
    }

    await task.save();
    return res.status(200).json({
      error: false,
      status: 200,
      message: "Task updated successfully.",
      data: formatTask(task),
    });
  } catch (err) {
    console.error("updateTask error:", err);
    return res.status(500).json({
      error: true,
      status: 500,
      message: "Could not update the task.",
    });
  }
};

// Delete a task
// Route: DELETE /api/tasks/:id
// Access: logged-in user (own tasks only)
const deleteTask = async (req, res) => {
  try {
    const task = await findOwnTask(req.params.id, req.user.id);
    if (!task) return notFound(res);

    await task.deleteOne();
    return res.status(200).json({
      error: false,
      status: 200,
      message: "Task deleted successfully.",
    });
  } catch (err) {
    console.error("deleteTask error:", err);
    return res.status(500).json({
      error: true,
      status: 500,
      message: "Could not delete the task.",
    });
  }
};

module.exports = { getTasks, createTask, getTask, updateTask, deleteTask };
