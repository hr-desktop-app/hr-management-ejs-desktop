module.exports = (sequelize, Sequelize) => {
  const PermissionType = sequelize.define('PermissionType', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    branchId: {
      type: Sequelize.UUID,
      allowNull: false
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
    permissionTime: {
      type: Sequelize.ENUM('morning', 'afternoon'),
      allowNull: false,
      comment: 'أذن صباحي أو مسائي'
    },
    isActive: {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    }
  }, {
    timestamps: true,
    underscored: true,
    tableName: 'permission_types'
  });

  PermissionType.associate = (models) => {
    PermissionType.belongsTo(models.Branch, { foreignKey: 'branchId' });
    PermissionType.hasMany(models.Permission, { foreignKey: 'permissionTypeId' });
  };

  return PermissionType;
};
