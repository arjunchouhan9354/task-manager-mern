// Test settings must be set before any app module reads config/env.js.
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-for-tests-only";
process.env.JWT_EXPIRES_IN = "1h";

const { before, after, afterEach } = require("node:test");
const mongoose = require("mongoose");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");
const createApp = require("../src/app");
const User = require("../src/models/User");
const { Task } = require("../src/models/Task");

const app = createApp();

// Real MongoDB in memory for each test file: no external database, nothing to clean up afterwards.
function useTestDb() {
  let mongo;
  before(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
    await Promise.all([User.init(), Task.init()]); // build indexes (unique email)
  });
  afterEach(async () => {
    await Promise.all([User.deleteMany({}), Task.deleteMany({})]);
  });
  after(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });
}

let counter = 0;

// Registers a new user and returns a supertest agent that keeps the auth cookie.
async function loggedInAgent(overrides = {}) {
  const agent = request.agent(app);
  counter += 1;
  const credentials = {
    name: "Asha Verma",
    email: `user${counter}@test.dev`,
    password: "Passw0rd!",
    ...overrides,
  };
  const res = await agent.post("/api/auth/register").send(credentials);
  if (res.status !== 201)
    throw new Error(
      `register failed: ${res.status} ${JSON.stringify(res.body)}`
    );
  return { agent, user: res.body.data, credentials };
}

module.exports = { app, request, useTestDb, loggedInAgent };
