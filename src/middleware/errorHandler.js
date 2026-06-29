const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error('Error occurred', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method
  });

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'خطأ في التحقق من البيانات',
      errors: err.errors
    });
  }

  // Database errors
  if (err.name === 'SequelizeError' || err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: 'خطأ في قاعدة البيانات',
      error: process.env.NODE_ENV === 'development' ? err.message : 'حدث خطأ في المعالجة'
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'رمز المصادقة غير صالح'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'انتهت صلاحية رمز المصادقة'
    });
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'حدث خطأ على الخادم';

  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? 'حدث خطأ على الخادم' : message,
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
};

module.exports = errorHandler;
