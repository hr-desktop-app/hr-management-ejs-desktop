module.exports = (sequelize, Sequelize) => {
  const AuditLog = sequelize.define('AuditLog', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    action: {
      type: Sequelize.STRING,
      allowNull: false,
      comment: 'Action performed (e.g., CREATE, UPDATE, DELETE)'
    },
    entityType: {
      type: Sequelize.STRING,
      allowNull: false,
      comment: 'Type of entity affected (e.g., Employee, Attendance)'
    },
    entityId: {
      type: Sequelize.STRING,
      comment: 'ID of the affected entity'
    },
    oldValues: {
      type: Sequelize.JSON,
      comment: 'Previous values before change'
    },
    newValues: {
      type: Sequelize.JSON,
      comment: 'New values after change'
    },
    ipAddress: {
      type: Sequelize.STRING
    },
    userAgent: {
      type: Sequelize.TEXT
    },
    status: {
      type: Sequelize.ENUM('success', 'failed'),
      defaultValue: 'success'
    },
    errorMessage: {
      type: Sequelize.TEXT
    }
  }, {
    timestamps: true,
    underscored: true,
    tableName: 'audit_logs'
  });

  AuditLog.associate = (models) => {
    AuditLog.belongsTo(models.User, { foreignKey: 'userId' });
  };

  return AuditLog;
};
