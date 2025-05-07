const jwt = require("jsonwebtoken");

const generateAccessToken = (user) => {
    return jwt.sign({ id: user._id, name: user.name }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

const generateRefreshToken = (user) => {
    return jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

module.exports = {
    generateAccessToken,
    generateRefreshToken
};
