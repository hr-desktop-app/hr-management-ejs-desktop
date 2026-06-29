module.exports = (sequelize, Sequelize) => {
  const Payroll = sequelize.define('Payroll', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    payrollPeriodStart: {
      type: Sequelize.DATE,
      allowNull: false
    },
    payrollPeriodEnd: {
      type: Sequelize.DATE,
      allowNull: false
    },
    baseSalary: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false
    },
    workDays: {
      type: Sequelize.INTEGER,
      defaultValue: 0
    },
    workHours: {
      type: Sequelize.DECIMAL(8, 2),
      defaultValue: 0
    },
    overtime: {
      type: Sequelize.DECIMAL(8, 2),
      defaultValue: 0
    },
    overtimeRate: {
      type: Sequelize.DECIMAL(5, 2),
      defaultValue: 1.5,
      comment: 'Multiplier for overtime pay'
    },
    bonuses: {
      type: Sequelize.DECIMAL(12, 2),
      defaultValue: 0
    },
    allowances: {
      type: Sequelize.DECIMAL(12, 2),
      defaultValue: 0
    },
    deductions: {
      type: Sequelize.DECIMAL(12, 2),
      defaultValue: 0
    },
    taxes: {
      type: Sequelize.DECIMAL(12, 2),
      defaultValue: 0
    },
    insurance: {
      type: Sequelize.DECIMAL(12, 2),
      defaultValue: 0
    },
    grossSalary: {
      type: Sequelize.DECIMAL(12, 2),
      defaultValue: 0
    },
    netSalary: {
      type: Sequelize.DECIMAL(12, 2),
      defaultValue: 0
    },
    paymentStatus: {
      type: Sequelize.ENUM('pending', 'processed', 'paid', 'cancelled'),
      defaultValue: 'pending'
    },
    paymentDate: {
      type: Sequelize.DATE
    },
    paymentMethod: {
      type: Sequelize.ENUM('bank_transfer', 'cash', 'check'),
      defaultValue: 'bank_transfer'
    },
    notes: {
      type: Sequelize.TEXT
    }
  }, {
    timestamps: true,
    underscored: true,
    tableName: 'payroll'
  });

  Payroll.associate = (models) => {
    Payroll.belongsTo(models.Employee, { foreignKey: 'employeeId' });
  };

  return Payroll;
};
