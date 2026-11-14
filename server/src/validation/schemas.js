const { z } = require("zod");
const { STATUSES, PRIORITIES } = require("../models/Task");

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address"));

const registerSchema = z.strictObject({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be at most 50 characters"),
  email,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters")
    .regex(/[A-Za-z]/, "Password must contain a letter")
    .regex(/\d/, "Password must contain a number"),
});

const loginSchema = z.strictObject({
  email,
  password: z.string().min(1, "Password is required"),
});

// Accepts "2026-11-20" or a full ISO date-time; null clears the due date.
const dueDate = z
  .union([
    z.null(),
    z
      .string()
      .trim()
      .refine((v) => !Number.isNaN(Date.parse(v)), "Enter a valid date")
      .transform((v) => new Date(v)),
  ])
  .optional();

const taskFields = {
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(120, "Title must be at most 120 characters"),
  description: z
    .string()
    .trim()
    .max(1000, "Description must be at most 1000 characters")
    .optional(),
  status: z
    .enum(STATUSES, "Status must be one of: todo, in_progress, done")
    .optional(),
  priority: z
    .enum(PRIORITIES, "Priority must be one of: low, medium, high")
    .optional(),
  dueDate,
};

const createTaskSchema = z.strictObject(taskFields);

const updateTaskSchema = z
  .strictObject({ ...taskFields, title: taskFields.title.optional() })
  .refine(
    (data) => Object.keys(data).length > 0,
    "Provide at least one field to update"
  );

const SORTS = ["newest", "oldest", "due_soon", "priority"];

const listTasksQuerySchema = z.object({
  status: z.enum(STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  q: z.string().trim().max(100, "Search text is too long").optional(),
  sort: z.enum(SORTS).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

module.exports = {
  registerSchema,
  loginSchema,
  createTaskSchema,
  updateTaskSchema,
  listTasksQuerySchema,
  SORTS,
};
