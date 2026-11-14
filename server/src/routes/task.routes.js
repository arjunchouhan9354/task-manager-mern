const { Router } = require("express");
const validate = require("../middleware/validate");
const requireAuth = require("../middleware/auth");
const {
  createTaskSchema,
  updateTaskSchema,
  listTasksQuerySchema,
} = require("../validation/schemas");
const {
  getTasks,
  createTask,
  getTask,
  updateTask,
  deleteTask,
} = require("../controllers/task.controller");

const router = Router();

router.use(requireAuth); // every task route needs a logged-in user

router.get("/", validate(listTasksQuerySchema, "query"), getTasks);
router.post("/", validate(createTaskSchema), createTask);
router.get("/:id", getTask);
router.patch("/:id", validate(updateTaskSchema), updateTask);
router.delete("/:id", deleteTask);

module.exports = router;
