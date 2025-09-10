const jwt = require('jsonwebtoken');

function auth(required = true) {
  return (req, res, next) => {
    const hdr = req.headers.authorization || '';
    const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;

    if (!token && required) return res.status(401).json({ error: 'Unauthorized' });
    if (!token) return next();

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { id: payload.userId, name: payload.userName, role: payload.userRole };
      next();
    } catch (e) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
}

function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

module.exports = { auth, requireRoles };