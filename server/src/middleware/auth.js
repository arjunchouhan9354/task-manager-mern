const { COOKIE_NAME, verifyToken } = require("../utils/token");

// Checks the login cookie. If valid, saves the user id in req.user and continues.
const requireAuth = (req, res, next) => {
  const token = req.cookies[COOKIE_NAME];

  if (!token) {
    return res
      .status(401)
      .json({
        error: true,
        status: 401,
        message: "Please log in to continue.",
      });
  }

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub };
    next();
  } catch (err) {
    return res
      .status(401)
      .json({
        error: true,
        status: 401,
        message: "Your session has expired. Please log in again.",
      });
  }
};

module.exports = requireAuth;
