const express = require("express");
const User = require("../models/users");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middlewares/auth");
const { generateAccessToken, generateRefreshToken } = require("../utils/generateTokens");
const { validateSignup, validateLogin } = require("../middlewares/validation");

const router = express.Router();

// register user
router.post("/register", validateSignup, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const user = await User.findOne({ email });

    if (user) {
      return res.json({ message: "user already exists" });
    }

    const genSalt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, genSalt);

    const newuser = new User({ name, email, password: hashedPassword });
    await newuser.save();
    return res.json({ message: "user registered successfully" });

  } catch (error) {
    res.json({ message: "some error occurred while registering the user." });
  }
});

// login user
router.post("/login", validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!(email || password)) return res.json({ message: "email or password is missing" });

    const user = await User.findOne({ email });

    if (!user) return res.json({ message: "user not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ message: "incorrect password" });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    // Send refresh token in cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'Strict'
    });

    res.json({
      accessToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    res.json({ message: "there was an error in logging in" });
  }
});

// refresh token route
router.post("/refresh", async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.json({ message: "no cookie found" });

    // Validate user with refresh token
    const user = await User.findOne({ refreshToken });
    if (!user) return res.json({ message: "invalid refresh token" });

    // Verify refresh token
    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
      if (err) return res.json({ message: "invalid refresh token" });

      const newAccessToken = generateAccessToken(user);
      res.json({ accessToken: newAccessToken });
    });

  } catch (error) {
    res.json({ message: "error generating new refresh token" });
  }
});

// protected profile route
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ message: "user found successfully", user });
  } catch (error) {
    res.json({ message: "cannot get profile" });
  }
});

// logout
router.post("/logout", async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { refreshToken: req.cookies.refreshToken },
      { refreshToken: null },
      { new: true }
    );
    if (!user) return res.json({ message: "user not found" });

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'Strict'
    });

    res.json({ message: "logged out successfully" });
  } catch (error) {
    res.json({ message: "error while logging out" });
  }
});

module.exports = router;

