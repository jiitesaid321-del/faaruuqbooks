const jwt = require('jsonwebtoken');

function signUser(user) {
  return jwt.sign(
    { userId: user._id, userName: user.name, userRole: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || '1h' }
  );
}

module.exports = { signUser };