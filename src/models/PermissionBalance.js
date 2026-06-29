module.exports = (sequelize, Sequelize) => {
  const PermissionBalance = sequelize.define('PermissionBalance', {
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
    month: {
      type: Sequelize.INTEGER,
      allowNull: false,
      comment: 'الشهر (1-12)'
    },
    year: {
      type: Sequelize.INTEGER,
      allowNull: false,
      comment: 'السنة'
    },
    allocatedPermissions: {
      type: Sequelize.INTEGER,
      defaultValue: 2,
      comment: 'عدد الأذونات المخصصة (عادة 2 في الشهر)'
    },
    usedPermissions: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      comment: 'الأذونات المستخدمة'
    },
    pendingPermissions: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      comment: 'الأذونات قيد الموافقة'
    },
    remainingPermissions: {
      type: Sequelize.VIRTUAL,
      get() {
        return this.allocatedPermissions - this.usedPermissions - this.pendingPermissions;
      }
    },
    lastUpdatedBy: {
      type: Sequelize.UUID
    },
    lastUpdatedAt: {
      type: Sequelize.DATE
    }
  }, {
    timestamps: true,
    underscored: true,
    tableName: 'permission_balances'
  });

  PermissionBalance.associate = (models) => {
    PermissionBalance.belongsTo(models.Employee, { foreignKey: 'employeeId' });
    PermissionBalance.belongsTo(models.Branch, { foreignKey: 'branchId' });
  };

  return PermissionBalance;
};
