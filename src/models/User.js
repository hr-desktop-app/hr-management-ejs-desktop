module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    username: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false,
      trim: true
    },
    email: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: Sequelize.STRING,
      allowNull: false,
      select: false
    },
    firstName: {
      type: Sequelize.STRING,
      allowNull: false
    },
    lastName: {
      type: Sequelize.STRING,
      allowNull: false
    },
    role: {
      type: Sequelize.ENUM('admin', 'manager', 'hr', 'employee'),
      defaultValue: 'employee',
      allowNull: false
    },
    isActive: {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    },
    lastLogin: {
      type: Sequelize.DATE
    },
    phoneNumber: {
      type: Sequelize.STRING
    },
    twoFactorEnabled: {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    }
  }, {
    timestamps: true,
    underscored: true,
    tableName: 'users'
  });

  User.associate = (models) => {
    User.hasOne(models.Employee, { foreignKey: 'userId' });
    User.hasMany(models.AuditLog, { foreignKey: 'userId' });
  };

  return User;
};
