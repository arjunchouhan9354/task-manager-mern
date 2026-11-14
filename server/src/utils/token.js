const jwt = require("jsonwebtoken");
const env = require("../config/env");

const COOKIE_NAME = "token";

function baseCookieOptions() {
  return {
    httpOnly: true, // not readable from JavaScript (protects against XSS token theft)
    secure: env.isProd, // HTTPS only in production
    sameSite: "lax", // not sent on cross-site POSTs (CSRF protection)
    path: "/",
  };
}

function signToken(userId) {
  return jwt.sign({ sub: String(userId) }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
    algorithm: "HS256",
  });
}

function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret, { algorithms: ["HS256"] });
}

function setAuthCookie(res, userId) {
  const token = signToken(userId);
  const { exp } = jwt.decode(token);
  res.cookie(COOKIE_NAME, token, {
    ...baseCookieOptions(),
    maxAge: exp * 1000 - Date.now(),
  });
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, baseCookieOptions());
}

module.exports = {
  COOKIE_NAME,
  signToken,
  verifyToken,
  setAuthCookie,
  clearAuthCookie,
};
