const env = require("./config/env");
const createApp = require("./app");
const { connectDB, disconnectDB } = require("./db/connect");

async function start() {
  await connectDB(env.mongodbUri);
  console.log("MongoDB connected");

  const server = createApp().listen(env.port, () => {
    console.log(
      `Server running on http://localhost:${env.port} (${env.nodeEnv})`
    );
  });

  // Graceful shutdown: stop accepting requests, finish current ones, close the DB.
  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down...`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

start().catch((err) => {
  console.error("Failed to start server:", err.message);
  process.exit(1);
});
