const Sequelize = require('sequelize');
const path = require('path');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'hr_management_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: process.env.NODE_ENV === 'production' ? false : console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const models = {};

// Import models
models.User = require('./User')(sequelize, Sequelize);
models.Employee = require('./Employee')(sequelize, Sequelize);
models.Department = require('./Department')(sequelize, Sequelize);
models.Attendance = require('./Attendance')(sequelize, Sequelize);
models.BiometricRecord = require('./BiometricRecord')(sequelize, Sequelize);
models.GPSLocation = require('./GPSLocation')(sequelize, Sequelize);
models.BiometricDevice = require('./BiometricDevice')(sequelize, Sequelize);
models.Payroll = require('./Payroll')(sequelize, Sequelize);
models.Leave = require('./Leave')(sequelize, Sequelize);
models.AuditLog = require('./AuditLog')(sequelize, Sequelize);
models.DeviceOfficeConfig = require('./DeviceOfficeConfig')(sequelize, Sequelize);

// Define associations
Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

models.sequelize = sequelize;
models.Sequelize = Sequelize;

module.exports = models;
