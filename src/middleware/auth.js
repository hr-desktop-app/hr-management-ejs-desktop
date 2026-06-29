const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'لم يتم توفير رمز المصادقة'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Authentication error', { message: error.message });
    res.status(401).json({
      success: false,
      message: 'رمز المصادقة غير صالح أو منتهي الصلاحية'
    });
  }
};

const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'يجب تسجيل الدخول أولاً'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(`Unauthorized access attempt by ${req.user.id} to ${req.originalUrl}`);
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية للوصول إلى هذا المورد'
      });
    }

    next();
  };
};

module.exports = {
  authMiddleware,
  roleMiddleware
};
