const path = require("path");
require("dotenv").config({
  path: path.join(__dirname, "../../.env"),
  quiet: true,
});

const nodeEnv = process.env.NODE_ENV || "development";
const isTest = nodeEnv === "test";

// Fail fast at startup if a required setting is missing (tests provide their own values).
const required = ["JWT_SECRET", ...(isTest ? [] : ["MONGODB_URI"])];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  throw new Error(
    `Missing required environment variables: ${missing.join(
      ", "
    )}. See server/.env.example`
  );
}

// A short JWT secret can be guessed, and then anyone could create login tokens.
// In production, refuse to start unless it's at least 32 characters.
if (nodeEnv === "production" && process.env.JWT_SECRET.length < 32) {
  throw new Error(
    "JWT_SECRET is too short for production (minimum 32 characters). Generate one with: node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\""
  );
}

module.exports = {
  nodeEnv,
  isProd: nodeEnv === "production",
  isTest,
  port: Number(process.env.PORT) || 5000,
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
};
