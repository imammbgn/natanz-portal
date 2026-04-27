const { errorResponse } = require('../utils/helpers');

function roleGuard(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(errorResponse('Authentication required.', 401));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json(errorResponse('Access denied. Insufficient permissions.', 403));
    }
    next();
  };
}

module.exports = roleGuard;
