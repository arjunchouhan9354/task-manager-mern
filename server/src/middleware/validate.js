// Checks req.body (or req.query) against a Zod schema before the controller runs.
// Invalid → 400 with a list of field errors. Valid → the cleaned data is saved in req.body / req.validQuery.
const validate = (schema, source = "body") => (req, res, next) => {
  const result = schema.safeParse(req[source] || {});

  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    return res
      .status(400)
      .json({
        error: true,
        status: 400,
        message: "Please check the highlighted fields.",
        errors,
      });
  }

  // Express 5 doesn't allow replacing req.query, so the cleaned query goes in req.validQuery.
  if (source === "query") req.validQuery = result.data;
  else req.body = result.data;
  next();
};

module.exports = validate;
