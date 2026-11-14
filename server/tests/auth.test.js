const { describe, test } = require("node:test");
const assert = require("node:assert/strict");
const { app, request, useTestDb, loggedInAgent } = require("./helpers");

useTestDb();

describe("Auth API", () => {
  const valid = {
    name: "Rahul Sharma",
    email: "Rahul@Example.com",
    password: "Secret123",
  };

  test("register creates a user, sets an httpOnly cookie and never returns the password", async () => {
    const res = await request(app).post("/api/auth/register").send(valid);

    assert.equal(res.status, 201);
    assert.equal(res.body.data.name, "Rahul Sharma");
    assert.equal(res.body.data.email, "rahul@example.com");
    assert.equal("passwordHash" in res.body.data, false);
    const cookie = res.headers["set-cookie"].join(";");
    assert.match(cookie, /token=/);
    assert.match(cookie, /HttpOnly/i);
    assert.match(cookie, /SameSite=Lax/i);
  });

  test("register with an existing email returns 409", async () => {
    await request(app).post("/api/auth/register").send(valid);
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...valid, email: "rahul@example.com" });

    assert.equal(res.status, 409);
    assert.equal(res.body.error, true);
    assert.match(res.body.message, /already exists/);
  });

  test("register with invalid input returns 400 with field details", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "R", email: "nope", password: "short" });

    assert.equal(res.status, 400);
    assert.equal(res.body.error, true);
    const paths = res.body.errors.map((e) => e.field);
    for (const field of ["name", "email", "password"])
      assert.ok(paths.includes(field), `missing ${field}`);
  });

  test("login with a wrong password returns 401 with a generic message", async () => {
    await request(app).post("/api/auth/register").send(valid);
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: valid.email, password: "Wrong1234" });

    assert.equal(res.status, 401);
    assert.equal(res.body.message, "Invalid email or password.");
  });

  test("login, me and logout keep the session in the cookie", async () => {
    const { agent, credentials } = await loggedInAgent();
    await agent.post("/api/auth/logout").expect(200);
    await agent.get("/api/auth/me").expect(401);

    await agent
      .post("/api/auth/login")
      .send({ email: credentials.email, password: credentials.password })
      .expect(200);
    const me = await agent.get("/api/auth/me").expect(200);
    assert.equal(me.body.data.email, credentials.email);
  });

  test("login with an unknown email returns the same 401 message", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@test.dev", password: "Wrong1234" });

    assert.equal(res.status, 401);
    assert.equal(res.body.message, "Invalid email or password.");
  });

  test("a tampered token is rejected", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", "token=not-a-real-token");
    assert.equal(res.status, 401);
  });

  test("unknown API routes return a JSON 404", async () => {
    const res = await request(app).get("/api/nope");
    assert.equal(res.status, 404);
    assert.equal(res.body.error, true);
  });
});
