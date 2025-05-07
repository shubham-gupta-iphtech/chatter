const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) {
    return res.json({ message: "token not received" });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    console.log(verified);
    next();
  } catch (error) {
    res.json({ message: "some error occurred while verifying token" });
  }
};

module.exports = authMiddleware;
