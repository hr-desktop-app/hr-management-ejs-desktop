module.exports = (sequelize, Sequelize) => {
  const Permission = sequelize.define('Permission', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    employeeId: {
      type: Sequelize.UUID,
      allowNull: false
    },
    branchId: {
      type: Sequelize.UUID,
      allowNull: false
    },
    permissionTypeId: {
      type: Sequelize.UUID,
      allowNull: false
    },
    permissionDate: {
      type: Sequelize.DATE,
      allowNull: false
    },
    permissionTime: {
      type: Sequelize.ENUM('morning', 'afternoon'),
      allowNull: false
    },
    reason: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    isExtraPermission: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      comment: 'هل هذه أذن إضافية على حساب الموظف'
    },
    status: {
      type: Sequelize.ENUM('pending', 'approved', 'rejected', 'cancelled'),
      defaultValue: 'pending'
    },
    // نظام الموافقات
    hrManagerStatus: {
      type: Sequelize.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending'
    },
    hrManagerApprovedAt: {
      type: Sequelize.DATE
    },
    hrManagerApprovedBy: {
      type: Sequelize.UUID
    },
    hrManagerNotes: {
      type: Sequelize.TEXT
    },
    deputyManagerStatus: {
      type: Sequelize.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending'
    },
    deputyManagerApprovedAt: {
      type: Sequelize.DATE
    },
    deputyManagerApprovedBy: {
      type: Sequelize.UUID
    },
    deputyManagerNotes: {
      type: Sequelize.TEXT
    },
    managerStatus: {
      type: Sequelize.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending'
    },
    managerApprovedAt: {
      type: Sequelize.DATE
    },
    managerApprovedBy: {
      type: Sequelize.UUID
    },
    managerNotes: {
      type: Sequelize.TEXT
    },
    rejectionReason: {
      type: Sequelize.TEXT
    }
  }, {
    timestamps: true,
    underscored: true,
    tableName: 'permissions'
  });

  Permission.associate = (models) => {
    Permission.belongsTo(models.Employee, { foreignKey: 'employeeId' });
    Permission.belongsTo(models.PermissionType, { foreignKey: 'permissionTypeId' });
    Permission.belongsTo(models.Branch, { foreignKey: 'branchId' });
  };

  return Permission;
};
