module.exports = (sequelize, Sequelize) => {
  const GPSLocation = sequelize.define('GPSLocation', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    latitude: {
      type: Sequelize.DECIMAL(10, 8),
      allowNull: false
    },
    longitude: {
      type: Sequelize.DECIMAL(11, 8),
      allowNull: false
    },
    accuracy: {
      type: Sequelize.DECIMAL(8, 2),
      comment: 'GPS accuracy in meters'
    },
    altitude: {
      type: Sequelize.DECIMAL(10, 2)
    },
    speed: {
      type: Sequelize.DECIMAL(8, 2),
      comment: 'Speed in km/h'
    },
    heading: {
      type: Sequelize.DECIMAL(6, 2),
      comment: 'Direction in degrees'
    },
    isWithinOffice: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      comment: 'Whether location is within configured office radius'
    },
    distance: {
      type: Sequelize.DECIMAL(10, 2),
      comment: 'Distance from office in meters'
    },
    source: {
      type: Sequelize.ENUM('mobile', 'device', 'external_api'),
      defaultValue: 'mobile'
    },
    recordedAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW
    },
    notes: {
      type: Sequelize.TEXT
    }
  }, {
    timestamps: true,
    underscored: true,
    tableName: 'gps_locations'
  });

  GPSLocation.associate = (models) => {
    GPSLocation.belongsTo(models.Employee, { foreignKey: 'employeeId' });
  };

  return GPSLocation;
};
