module.exports = (sequelize, Sequelize) => {
  const Leave = sequelize.define('Leave', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    leaveType: {
      type: Sequelize.ENUM('annual', 'sick', 'maternity', 'paternity', 'unpaid', 'emergency'),
      allowNull: false
    },
    startDate: {
      type: Sequelize.DATE,
      allowNull: false
    },
    endDate: {
      type: Sequelize.DATE,
      allowNull: false
    },
    duration: {
      type: Sequelize.DECIMAL(5, 2),
      comment: 'Duration in days'
    },
    reason: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    status: {
      type: Sequelize.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending'
    },
    approvedBy: {
      type: Sequelize.STRING,
      comment: 'ID of the person who approved'
    },
    approvalDate: {
      type: Sequelize.DATE
    },
    rejectionReason: {
      type: Sequelize.TEXT
    },
    documents: {
      type: Sequelize.JSON,
      comment: 'Array of attachment file paths'
    }
  }, {
    timestamps: true,
    underscored: true,
    tableName: 'leaves'
  });

  Leave.associate = (models) => {
    Leave.belongsTo(models.Employee, { foreignKey: 'employeeId' });
  };

  return Leave;
};
