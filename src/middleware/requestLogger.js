const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  const originalSend = res.send;
  
  res.send = function(data) {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')
    };

    if (res.statusCode >= 400) {
      logger.warn(`${req.method} ${req.originalUrl} - ${res.statusCode}`, logData);
    } else {
      logger.debug(`${req.method} ${req.originalUrl} - ${res.statusCode}`, logData);
    }

    return originalSend.call(this, data);
  };

  next();
};

module.exports = requestLogger;
