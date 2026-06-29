module.exports = (sequelize, Sequelize) => {
  const DeviceOfficeConfig = sequelize.define('DeviceOfficeConfig', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    officeName: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    latitude: {
      type: Sequelize.DECIMAL(10, 8),
      allowNull: false,
      comment: 'Office latitude for GPS verification'
    },
    longitude: {
      type: Sequelize.DECIMAL(11, 8),
      allowNull: false,
      comment: 'Office longitude for GPS verification'
    },
    radiusMeters: {
      type: Sequelize.INTEGER,
      defaultValue: 500,
      comment: 'Acceptable radius from office center in meters'
    },
    checkInStartTime: {
      type: Sequelize.TIME,
      comment: 'When employees can start checking in (e.g., 07:00)'
    },
    checkInEndTime: {
      type: Sequelize.TIME,
      comment: 'When check-in closes (e.g., 10:00)'
    },
    expectedCheckOutTime: {
      type: Sequelize.TIME,
      comment: 'Expected check-out time (e.g., 17:00)'
    },
    dailyWorkHours: {
      type: Sequelize.DECIMAL(5, 2),
      defaultValue: 8,
      comment: 'Expected daily work hours'
    },
    allowRemoteWork: {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    },
    isActive: {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    },
    timezone: {
      type: Sequelize.STRING,
      defaultValue: 'Africa/Cairo'
    }
  }, {
    timestamps: true,
    underscored: true,
    tableName: 'device_office_configs'
  });

  return DeviceOfficeConfig;
};
