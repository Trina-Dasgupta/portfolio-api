export const validateRequest = (schema) => (req, res, next) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const result = schema.safeParse(body);
  
  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: result.error.issues.map((err) => err.message)
    });
  }
  req.body = result.data;
  next();
};