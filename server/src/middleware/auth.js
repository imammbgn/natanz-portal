const jwt = require('jsonwebtoken');
const { db } = require('../config/database');
const { formatUserResponse, errorResponse } = require('../utils/helpers');

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json(errorResponse('Access denied. No token provided.', 401));
  }

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: process.env.JWT_ISSUER,
      algorithms: ['HS256'],
    });

    // Validate token payload structure
    if (!decoded.userId || !decoded.role) {
      return res.status(401).json(errorResponse('Malformed token.', 401));
    }

    // Verify user still exists and is active
    const user = db.prepare('SELECT * FROM users WHERE id = ? AND is_active = 1').get(decoded.userId);
    if (!user) {
      return res.status(401).json(errorResponse('Token revoked. User not found or deactivated.', 401));
    }

    // Ensure role hasn't changed since token was issued
    if (user.role !== decoded.role) {
      return res.status(401).json(errorResponse('Role mismatch. Please re-authenticate.', 401));
    }

    req.user = formatUserResponse(user);
    req.tokenIssuedAt = decoded.iat;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json(errorResponse('Token expired. Please sign in again.', 401));
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json(errorResponse('Invalid token.', 401));
    }
    return res.status(401).json(errorResponse('Authentication failed.', 401));
  }
}

module.exports = authMiddleware;
