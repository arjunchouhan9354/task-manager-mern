// Unknown API route → 404 JSON
const notFound = (req, res) => {
  res.status(404).json({
    error: true,
    status: 404,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

// Last safety net for anything not caught in a controller (e.g. invalid JSON in the request body).
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      error: true,
      status: 400,
      message: "Request body is not valid JSON.",
    });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({
      error: true,
      status: 413,
      message: "Request body is too large.",
    });
  }
  console.error(err);
  res.status(500).json({
    error: true,
    status: 500,
    message: "Something went wrong. Please try again.",
  });
};

module.exports = { notFound, errorHandler };
