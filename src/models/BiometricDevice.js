module.exports = (sequelize, Sequelize) => {
  const BiometricDevice = sequelize.define('BiometricDevice', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    deviceName: {
      type: Sequelize.STRING,
      allowNull: false
    },
    deviceId: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false,
      comment: 'Unique identifier from the device'
    },
    deviceType: {
      type: Sequelize.ENUM('fingerprint_scanner', 'face_recognition', 'iris_scanner', 'palm_reader', 'multi_modal'),
      allowNull: false
    },
    manufacturer: {
      type: Sequelize.STRING
    },
    model: {
      type: Sequelize.STRING
    },
    serialNumber: {
      type: Sequelize.STRING,
      unique: true
    },
    firmwareVersion: {
      type: Sequelize.STRING
    },
    communicationPort: {
      type: Sequelize.STRING,
      comment: 'Serial port or network address (e.g., /dev/ttyUSB0 or 192.168.1.100:5000)'
    },
    baudRate: {
      type: Sequelize.INTEGER,
      defaultValue: 115200
    },
    location: {
      type: Sequelize.STRING,
      comment: 'Physical location of the device (e.g., Main Entrance, Floor 3)'
    },
    isActive: {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    },
    lastSync: {
      type: Sequelize.DATE
    },
    totalUsers: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      comment: 'Number of users enrolled on this device'
    },
    totalRecords: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      comment: 'Total attendance records from this device'
    },
    ipAddress: {
      type: Sequelize.STRING
    },
    apiKey: {
      type: Sequelize.STRING,
      comment: 'API key for device communication'
    }
  }, {
    timestamps: true,
    underscored: true,
    tableName: 'biometric_devices'
  });

  BiometricDevice.associate = (models) => {
    BiometricDevice.hasMany(models.BiometricRecord, { foreignKey: 'deviceId' });
  };

  return BiometricDevice;
};
