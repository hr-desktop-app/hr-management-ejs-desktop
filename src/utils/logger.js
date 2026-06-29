const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');

const logDir = process.env.LOG_FILE_PATH || './logs';

// Create logs directory if it doesn't exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const getTimestamp = () => {
  return moment().tz('Africa/Cairo').format('YYYY-MM-DD HH:mm:ss');
};

const getLogFileName = () => {
  return moment().tz('Africa/Cairo').format('YYYY-MM-DD');
};

const writeToFile = (level, message, data = null) => {
  const logFile = path.join(logDir, `${getLogFileName()}.log`);
  const logContent = `[${getTimestamp()}] [${level}] ${message}${data ? ` - ${JSON.stringify(data)}` : ''}\n`;
  
  fs.appendFileSync(logFile, logContent);
};

const logger = {
  info: (message, data = null) => {
    const msg = `✓ ${message}`;
    console.log(`\x1b[36m${msg}\x1b[0m`);
    writeToFile('INFO', message, data);
  },

  error: (message, data = null) => {
    const msg = `✗ ${message}`;
    console.error(`\x1b[31m${msg}\x1b[0m`);
    writeToFile('ERROR', message, data);
  },

  warn: (message, data = null) => {
    const msg = `⚠ ${message}`;
    console.warn(`\x1b[33m${msg}\x1b[0m`);
    writeToFile('WARN', message, data);
  },

  debug: (message, data = null) => {
    if (process.env.NODE_ENV !== 'production') {
      const msg = `⚙ ${message}`;
      console.log(`\x1b[35m${msg}\x1b[0m`);
      writeToFile('DEBUG', message, data);
    }
  },

  success: (message, data = null) => {
    const msg = `✔ ${message}`;
    console.log(`\x1b[32m${msg}\x1b[0m`);
    writeToFile('SUCCESS', message, data);
  }
};

module.exports = logger;
