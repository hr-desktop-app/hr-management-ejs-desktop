const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const logger = require('./src/utils/logger');
const errorHandler = require('./src/middleware/errorHandler');
const requestLogger = require('./src/middleware/requestLogger');

const app = express();
const http = require('http');
const socketIO = require('socket.io');

const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Store io instance globally
global.io = io;

// ============ Security Middleware ============
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'عدد الطلبات كثير جداً، حاول مرة أخرى لاحقاً'
});
app.use('/api/', limiter);

// ============ View Engine Configuration ============
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));

// ============ Body Parser Middleware ============
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));

// ============ Custom Middleware ============
app.use(requestLogger);

// ============ Database Connection ============
const { sequelize } = require('./src/models');

sequelize.authenticate()
  .then(() => {
    logger.info('✓ Database connected successfully');
  })
  .catch(err => {
    logger.error('✗ Database connection failed:', err);
  });

// ============ Socket.IO Setup ============
require('./src/socket/events')(io);

// ============ Routes ============
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/employees', require('./src/routes/employees'));
app.use('/api/departments', require('./src/routes/departments'));
app.use('/api/attendance', require('./src/routes/attendance'));
app.use('/api/biometric', require('./src/routes/biometric'));
app.use('/api/gps', require('./src/routes/gps'));
app.use('/api/payroll', require('./src/routes/payroll'));
app.use('/api/reports', require('./src/routes/reports'));
app.use('/api/devices', require('./src/routes/devices'));

// ============ Web Routes (Views) ============
app.get('/', (req, res) => {
  res.render('index', { title: 'نظام إدارة الموظفين' });
});

app.get('/dashboard', (req, res) => {
  res.render('dashboard', { title: 'لوحة التحكم' });
});

// ============ 404 Handler ============
app.use((req, res) => {
  res.status(404).render('404', { title: 'الصفحة غير موجودة' });
});

// ============ Error Handler ============
app.use(errorHandler);

// ============ Server Start ============
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

server.listen(PORT, HOST, () => {
  logger.info(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  logger.info(`✓ HR Management System Started`);
  logger.info(`✓ Server running on http://${HOST}:${PORT}`);
  logger.info(`✓ Environment: ${process.env.NODE_ENV}`);
  logger.info(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
});

// ============ Graceful Shutdown ============
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    sequelize.close();
    process.exit(0);
  });
});

module.exports = { app, server, io };
