module.exports = (sequelize, Sequelize) => {
  const LeaveType = sequelize.define('LeaveType', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    branchId: {
      type: Sequelize.UUID,
      allowNull: false,
      comment: 'كل فرع له أنواع إجازات خاصة به'
    },
    typeName: {
      type: Sequelize.STRING,
      allowNull: false
    },
    typeCode: {
      type: Sequelize.STRING,
      allowNull: false
    },
    description: {
      type: Sequelize.TEXT
    },
    defaultDays: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      comment: 'عدد الأيام الافتراضي للإجازة'
    },
    requiresAttachments: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      comment: 'هل تحتاج إلى مستندات (مثل الشهادات الطبية)'
    },
    isActive: {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    },
    color: {
      type: Sequelize.STRING,
      defaultValue: '#3498db',
      comment: 'لون التصنيف في التقارير'
    }
  }, {
    timestamps: true,
    underscored: true,
    tableName: 'leave_types'
  });

  LeaveType.associate = (models) => {
    LeaveType.belongsTo(models.Branch, { foreignKey: 'branchId' });
    LeaveType.hasMany(models.LeaveBalance, { foreignKey: 'leaveTypeId' });
    LeaveType.hasMany(models.Leave, { foreignKey: 'leaveTypeId' });
  };

  return LeaveType;
};
