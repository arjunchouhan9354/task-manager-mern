// Creates (or resets) the demo account with sample tasks. Usage: npm run seed
const bcrypt = require("bcryptjs");
const env = require("../config/env");
const { connectDB, disconnectDB } = require("../db/connect");
const User = require("../models/User");
const { Task } = require("../models/Task");

const DEMO = {
  name: "Demo User",
  email: "demo@taskmanager.dev",
  password: "Demo@1234",
};

const day = 24 * 60 * 60 * 1000;
// Calendar date only (midnight UTC), the same format the app stores for dates picked in the form.
const inDays = (n) =>
  new Date(new Date(Date.now() + n * day).toISOString().slice(0, 10));

const SAMPLE_TASKS = [
  {
    title: "Prepare sprint planning notes",
    description: "List priorities and blockers for next sprint.",
    status: "todo",
    priority: "high",
    dueDate: inDays(1),
  },
  {
    title: "Fix login rate-limit message",
    description: "Show a friendly message when too many attempts are made.",
    status: "in_progress",
    priority: "medium",
    dueDate: inDays(3),
  },
  {
    title: "Review pull request #42",
    description: "Check validation and error handling changes.",
    status: "todo",
    priority: "medium",
    dueDate: inDays(-2),
  },
  {
    title: "Update project README",
    description: "Add setup steps and API reference.",
    status: "done",
    priority: "low",
    dueDate: inDays(-1),
  },
  {
    title: "Write tests for task filters",
    description: "Status, priority, search and pagination.",
    status: "in_progress",
    priority: "high",
    dueDate: inDays(2),
  },
  {
    title: "Plan database backup strategy",
    description: "",
    status: "todo",
    priority: "low",
    dueDate: null,
  },
  {
    title: "Optimise task list query",
    description: "Check indexes with explain().",
    status: "done",
    priority: "medium",
    dueDate: inDays(-5),
  },
  {
    title: "Book team retrospective",
    description: "Friday 4 PM, 30 minutes.",
    status: "todo",
    priority: "low",
    dueDate: inDays(7),
  },
];

async function seed() {
  await connectDB(env.mongodbUri);
  await Promise.all([User.init(), Task.init()]); // make sure indexes exist

  const passwordHash = await bcrypt.hash(DEMO.password, 10);
  const user = await User.findOneAndUpdate(
    { email: DEMO.email },
    { name: DEMO.name, email: DEMO.email, passwordHash },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );

  await Task.deleteMany({ userId: user._id });
  await Task.insertMany(
    SAMPLE_TASKS.map((t) => ({
      ...t,
      userId: user._id,
      completedAt: t.status === "done" ? new Date() : null,
    }))
  );

  console.log(
    `Seeded demo user ${DEMO.email} / ${DEMO.password} with ${SAMPLE_TASKS.length} tasks`
  );
  await disconnectDB();
}

seed().catch(async (err) => {
  console.error("Seed failed:", err.message);
  await disconnectDB().catch(() => {});
  process.exit(1);
});
