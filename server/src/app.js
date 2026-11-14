const fs = require("fs");
const path = require("path");
const express = require("express");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const env = require("./config/env");
const authRoutes = require("./routes/auth.routes");
const taskRoutes = require("./routes/task.routes");
const { notFound, errorHandler } = require("./middleware/error");

const CLIENT_DIST = path.join(__dirname, "../../client/dist");

function createApp() {
  const app = express();

  app.set("trust proxy", 1); // behind Render's proxy: real client IP for rate limiting
  app.use(helmet());
  app.use(express.json({ limit: "10kb" }));
  app.use(cookieParser());
  if (!env.isTest) app.use(morgan(env.isProd ? "combined" : "dev"));

  // API
  app.get("/api/health", (req, res) => res.json({ status: "ok" }));
  app.use("/api/auth", authRoutes);
  app.use("/api/tasks", taskRoutes);
  app.use("/api", notFound); // unknown /api routes return JSON 404, never the React page

  // React app (production build): same origin as the API, so cookies and calls need no CORS.
  if (fs.existsSync(CLIENT_DIST)) {
    app.use(
      express.static(CLIENT_DIST, {
        index: false,
        maxAge: "1y",
        immutable: true,
      })
    );
    app.get("/{*splat}", (req, res) => {
      res.set("Cache-Control", "no-cache");
      res.sendFile(path.join(CLIENT_DIST, "index.html"));
    });
  }

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = createApp;
