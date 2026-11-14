const { describe, test } = require("node:test");
const assert = require("node:assert/strict");
const { app, request, useTestDb, loggedInAgent } = require("./helpers");

useTestDb();

describe("Tasks API", () => {
  test("requires authentication", async () => {
    const res = await request(app).get("/api/tasks");
    assert.equal(res.status, 401);
    assert.equal(res.body.error, true);
  });

  test("creates a task with defaults", async () => {
    const { agent } = await loggedInAgent();
    const res = await agent
      .post("/api/tasks")
      .send({ title: "  Write report  " });

    assert.equal(res.status, 201);
    const { id, createdAt, updatedAt, ...task } = res.body.data;
    assert.ok(id && createdAt && updatedAt);
    assert.deepEqual(task, {
      title: "Write report",
      description: "",
      status: "todo",
      priority: "medium",
      dueDate: null,
      completedAt: null,
    });
  });

  test("rejects a task without a title and with unknown fields", async () => {
    const { agent } = await loggedInAgent();
    const res = await agent
      .post("/api/tasks")
      .send({ description: "no title", userId: "hack" });

    assert.equal(res.status, 400);
    const paths = res.body.errors.map((e) => e.field);
    assert.ok(paths.includes("title"));
  });

  test("lists with filters, search, sorting, pagination and status counts", async () => {
    const { agent } = await loggedInAgent();
    const tasks = [
      {
        title: "Invoice client A",
        status: "todo",
        priority: "high",
        dueDate: "2030-01-05",
      },
      {
        title: "Invoice client B",
        status: "in_progress",
        priority: "low",
        dueDate: "2030-01-01",
      },
      { title: "Call supplier", status: "done", priority: "medium" },
      { title: "Plan offsite", status: "todo", priority: "low" },
    ];
    for (const t of tasks) await agent.post("/api/tasks").send(t).expect(201);

    const search = await agent.get("/api/tasks?q=invoice").expect(200);
    assert.equal(search.body.data.length, 2);
    assert.deepEqual(search.body.meta.counts, {
      todo: 1,
      in_progress: 1,
      done: 0,
    });

    const todo = await agent.get("/api/tasks?status=todo").expect(200);
    assert.equal(todo.body.meta.total, 2);
    // counts ignore the status filter, so the summary always shows every status
    assert.deepEqual(todo.body.meta.counts, {
      todo: 2,
      in_progress: 1,
      done: 1,
    });

    const dueSoon = await agent.get("/api/tasks?sort=due_soon").expect(200);
    assert.deepEqual(
      dueSoon.body.data.slice(0, 2).map((t) => t.title),
      ["Invoice client B", "Invoice client A"]
    );
    assert.ok(
      dueSoon.body.data.slice(2).every((t) => t.dueDate === null),
      "tasks without a due date come last"
    );

    const byPriority = await agent.get("/api/tasks?sort=priority").expect(200);
    assert.deepEqual(
      byPriority.body.data.map((t) => t.priority),
      ["high", "medium", "low", "low"]
    );

    const page2 = await agent.get("/api/tasks?limit=3&page=2").expect(200);
    assert.equal(page2.body.data.length, 1);
    assert.equal(page2.body.meta.page, 2);
    assert.equal(page2.body.meta.limit, 3);
    assert.equal(page2.body.meta.total, 4);
    assert.equal(page2.body.meta.totalPages, 2);
  });

  test("rejects invalid list query values", async () => {
    const { agent } = await loggedInAgent();
    const res = await agent.get("/api/tasks?status=archived&limit=500");
    assert.equal(res.status, 400);
  });

  test("marking a task done sets completedAt; moving it back clears it", async () => {
    const { agent } = await loggedInAgent();
    const { body } = await agent.post("/api/tasks").send({ title: "Ship it" });

    const done = await agent
      .patch(`/api/tasks/${body.data.id}`)
      .send({ status: "done" })
      .expect(200);
    assert.notEqual(done.body.data.completedAt, null);

    const back = await agent
      .patch(`/api/tasks/${body.data.id}`)
      .send({ status: "todo" })
      .expect(200);
    assert.equal(back.body.data.completedAt, null);
  });

  test("an empty update is rejected", async () => {
    const { agent } = await loggedInAgent();
    const { body } = await agent.post("/api/tasks").send({ title: "Edit me" });
    await agent.patch(`/api/tasks/${body.data.id}`).send({}).expect(400);
  });

  test("a user cannot read, update or delete another user's task (404)", async () => {
    const alice = await loggedInAgent({ name: "Alice" });
    const bob = await loggedInAgent({ name: "Bob" });
    const { body } = await alice.agent
      .post("/api/tasks")
      .send({ title: "Alice private task" });
    const id = body.data.id;

    await bob.agent.get(`/api/tasks/${id}`).expect(404);
    await bob.agent
      .patch(`/api/tasks/${id}`)
      .send({ title: "hacked" })
      .expect(404);
    await bob.agent.delete(`/api/tasks/${id}`).expect(404);
    const bobList = await bob.agent.get("/api/tasks").expect(200);
    assert.equal(bobList.body.meta.total, 0);

    const stillThere = await alice.agent.get(`/api/tasks/${id}`).expect(200);
    assert.equal(stillThere.body.data.title, "Alice private task");
  });

  test("deletes a task; an invalid id returns 404", async () => {
    const { agent } = await loggedInAgent();
    const { body } = await agent
      .post("/api/tasks")
      .send({ title: "Temporary" });

    await agent.delete(`/api/tasks/${body.data.id}`).expect(200);
    await agent.get(`/api/tasks/${body.data.id}`).expect(404);
    await agent.get("/api/tasks/not-an-id").expect(404);
  });

  test("search text is treated literally (regex characters are escaped)", async () => {
    const { agent } = await loggedInAgent();
    await agent.post("/api/tasks").send({ title: "Budget (Q1)" });
    await agent.post("/api/tasks").send({ title: "Budget Q2" });

    const res = await agent
      .get("/api/tasks?q=" + encodeURIComponent("(Q1)"))
      .expect(200);
    assert.deepEqual(
      res.body.data.map((t) => t.title),
      ["Budget (Q1)"]
    );
  });
});
