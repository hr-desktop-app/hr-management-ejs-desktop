module.exports = (sequelize, Sequelize) => {
  const Department = sequelize.define('Department', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    description: {
      type: Sequelize.TEXT
    },
    managerId: {
      type: Sequelize.UUID,
      comment: 'Reference to Employee who manages this department'
    },
    budget: {
      type: Sequelize.DECIMAL(15, 2),
      defaultValue: 0
    },
    isActive: {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    }
  }, {
    timestamps: true,
    underscored: true,
    tableName: 'departments'
  });

  Department.associate = (models) => {
    Department.hasMany(models.Employee, { foreignKey: 'departmentId' });
  };

  return Department;
};
