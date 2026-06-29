module.exports = (sequelize, Sequelize) => {
  const LeaveBalance = sequelize.define('LeaveBalance', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    employeeId: {
      type: Sequelize.UUID,
      allowNull: false
    },
    leaveTypeId: {
      type: Sequelize.UUID,
      allowNull: false
    },
    branchId: {
      type: Sequelize.UUID,
      allowNull: false
    },
    year: {
      type: Sequelize.INTEGER,
      allowNull: false,
      comment: 'السنة المالية'
    },
    totalDays: {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: false,
      comment: 'إجمالي الأيام المتاحة'
    },
    usedDays: {
      type: Sequelize.DECIMAL(5, 2),
      defaultValue: 0,
      comment: 'الأيام المستخدمة'
    },
    pendingDays: {
      type: Sequelize.DECIMAL(5, 2),
      defaultValue: 0,
      comment: 'الأيام المعلقة (قيد الموافقة)'
    },
    remainingDays: {
      type: Sequelize.VIRTUAL,
      get() {
        return this.totalDays - this.usedDays - this.pendingDays;
      }
    },
    lastUpdatedBy: {
      type: Sequelize.UUID,
      comment: 'آخر شخص قام بتحديث الرصيد'
    },
    lastUpdatedAt: {
      type: Sequelize.DATE
    }
  }, {
    timestamps: true,
    underscored: true,
    tableName: 'leave_balances'
  });

  LeaveBalance.associate = (models) => {
    LeaveBalance.belongsTo(models.Employee, { foreignKey: 'employeeId' });
    LeaveBalance.belongsTo(models.LeaveType, { foreignKey: 'leaveTypeId' });
    LeaveBalance.belongsTo(models.Branch, { foreignKey: 'branchId' });
  };

  return LeaveBalance;
};
