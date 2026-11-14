const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { setAuthCookie, clearAuthCookie } = require("../utils/token");

// Used when a login email doesn't exist: we still run bcrypt against this hash, so
// "unknown email" takes as long as "wrong password" and response time can't reveal registered emails.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

// Register a new user
// Route: POST /api/auth/register
// Access: public
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({
        error: true,
        status: 409,
        message: "An account with this email already exists.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });

    setAuthCookie(res, user._id); // log the user in straight away
    return res.status(201).json({
      error: false,
      status: 201,
      message: "Account created successfully.",
      data: user,
    });
  } catch (err) {
    // Two sign-ups with the same email at the same moment: the unique index stops the second one.
    if (err.code === 11000) {
      return res.status(409).json({
        error: true,
        status: 409,
        message: "An account with this email already exists.",
      });
    }
    console.error("register error:", err);
    return res.status(500).json({
      error: true,
      status: 500,
      message: "Could not create the account.",
    });
  }
};

// Log in
// Route: POST /api/auth/login
// Access: public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+passwordHash");
    // Always run bcrypt (against a dummy hash if the user doesn't exist) so both cases take the same time.
    const passwordOk = await bcrypt.compare(
      password,
      user ? user.passwordHash : DUMMY_HASH
    );

    // Same message for "no such email" and "wrong password", so nobody can find out which emails are registered.
    if (!user || !passwordOk) {
      return res.status(401).json({
        error: true,
        status: 401,
        message: "Invalid email or password.",
      });
    }

    setAuthCookie(res, user._id);
    return res.status(200).json({
      error: false,
      status: 200,
      message: "Logged in successfully.",
      data: user,
    });
  } catch (err) {
    console.error("login error:", err);
    return res
      .status(500)
      .json({ error: true, status: 500, message: "Could not log in." });
  }
};

// Log out
// Route: POST /api/auth/logout
// Access: public
const logout = (req, res) => {
  clearAuthCookie(res);
  return res
    .status(200)
    .json({ error: false, status: 200, message: "Logged out successfully." });
};

// Get the logged-in user (used when the page loads)
// Route: GET /api/auth/me
// Access: logged-in user
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      clearAuthCookie(res);
      return res.status(401).json({
        error: true,
        status: 401,
        message: "Please log in to continue.",
      });
    }
    return res.status(200).json({
      error: false,
      status: 200,
      message: "User fetched successfully.",
      data: user,
    });
  } catch (err) {
    console.error("getMe error:", err);
    return res
      .status(500)
      .json({ error: true, status: 500, message: "Could not fetch the user." });
  }
};

module.exports = { register, login, logout, getMe };
