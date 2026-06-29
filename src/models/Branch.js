module.exports = (sequelize, Sequelize) => {
  const Branch = sequelize.define('Branch', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    branchName: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    branchCode: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    city: {
      type: Sequelize.STRING,
      allowNull: false
    },
    address: {
      type: Sequelize.TEXT
    },
    phoneNumber: {
      type: Sequelize.STRING
    },
    managerId: {
      type: Sequelize.UUID,
      comment: 'مدير الفرع'
    },
    hrManagerId: {
      type: Sequelize.UUID,
      comment: 'مسئول شئون العاملين'
    },
    deputyManagerId: {
      type: Sequelize.UUID,
      comment: 'الوكيل'
    },
    latitude: {
      type: Sequelize.DECIMAL(10, 8)
    },
    longitude: {
      type: Sequelize.DECIMAL(11, 8)
    },
    radiusMeters: {
      type: Sequelize.INTEGER,
      defaultValue: 500
    },
    isActive: {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    }
  }, {
    timestamps: true,
    underscored: true,
    tableName: 'branches'
  });

  Branch.associate = (models) => {
    Branch.hasMany(models.Employee, { foreignKey: 'branchId' });
    Branch.hasMany(models.DeviceOfficeConfig, { foreignKey: 'branchId' });
    Branch.hasMany(models.LeaveType, { foreignKey: 'branchId' });
    Branch.hasMany(models.LeaveBalance, { foreignKey: 'branchId' });
  };

  return Branch;
};
