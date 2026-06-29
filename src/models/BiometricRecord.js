module.exports = (sequelize, Sequelize) => {
  const BiometricRecord = sequelize.define('BiometricRecord', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    biometricType: {
      type: Sequelize.ENUM('fingerprint', 'face', 'iris', 'palm'),
      allowNull: false
    },
    biometricData: {
      type: Sequelize.TEXT,
      comment: 'Encrypted biometric data'
    },
    deviceId: {
      type: Sequelize.STRING,
      comment: 'ID of the biometric device'
    },
    recordedAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW
    },
    isVerified: {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    },
    quality: {
      type: Sequelize.INTEGER,
      validate: { min: 0, max: 100 },
      comment: 'Quality score of biometric capture (0-100)'
    },
    attempts: {
      type: Sequelize.INTEGER,
      defaultValue: 1,
      comment: 'Number of attempts before successful capture'
    }
  }, {
    timestamps: true,
    underscored: true,
    tableName: 'biometric_records'
  });

  BiometricRecord.associate = (models) => {
    BiometricRecord.belongsTo(models.Employee, { foreignKey: 'employeeId' });
    BiometricRecord.belongsTo(models.BiometricDevice, { foreignKey: 'deviceId' });
  };

  return BiometricRecord;
};
