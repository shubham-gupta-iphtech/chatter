const { check, validationResult } = require("express-validator");

const validateSignup = [
  check("name").notEmpty().withMessage("Name is required"),
  check("email").isEmail().withMessage("Invalid email"),
  check("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({ errors: errors.array() });
    }
    next();
  }
];

const validateLogin = [
  check("email").notEmpty().withMessage("Email is required"),
  check("email").isEmail().withMessage("Invalid email"),
  check("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({ errors: errors.array() });
    }
    next();
  }
];

module.exports = {
  validateSignup,
  validateLogin
};
