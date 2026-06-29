module.exports = (sequelize, Sequelize) => {
  const Employee = sequelize.define('Employee', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    employeeId: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false
    },
    firstName: {
      type: Sequelize.STRING,
      allowNull: false
    },
    lastName: {
      type: Sequelize.STRING,
      allowNull: false
    },
    email: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false
    },
    phoneNumber: {
      type: Sequelize.STRING,
      allowNull: false
    },
    nationalId: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false
    },
    dateOfBirth: {
      type: Sequelize.DATE,
      allowNull: false
    },
    gender: {
      type: Sequelize.ENUM('M', 'F'),
      allowNull: false
    },
    address: {
      type: Sequelize.TEXT
    },
    city: {
      type: Sequelize.STRING
    },
    state: {
      type: Sequelize.STRING
    },
    zipCode: {
      type: Sequelize.STRING
    },
    position: {
      type: Sequelize.STRING,
      allowNull: false
    },
    jobTitle: {
      type: Sequelize.STRING
    },
    salary: {
      type: Sequelize.DECIMAL(12, 2),
      defaultValue: 0
    },
    employmentType: {
      type: Sequelize.ENUM('full_time', 'part_time', 'contract', 'temporary'),
      defaultValue: 'full_time'
    },
    hireDate: {
      type: Sequelize.DATE,
      allowNull: false
    },
    endDate: {
      type: Sequelize.DATE
    },
    status: {
      type: Sequelize.ENUM('active', 'inactive', 'on_leave', 'terminated'),
      defaultValue: 'active'
    },
    profilePhoto: {
      type: Sequelize.STRING
    },
    biometricId: {
      type: Sequelize.STRING,
      comment: 'ID from biometric device'
    },
    emergencyContact: {
      type: Sequelize.STRING
    },
    emergencyPhone: {
      type: Sequelize.STRING
    },
    bankAccount: {
      type: Sequelize.STRING
    },
    bankName: {
      type: Sequelize.STRING
    }
  }, {
    timestamps: true,
    underscored: true,
    tableName: 'employees'
  });

  Employee.associate = (models) => {
    Employee.belongsTo(models.User, { foreignKey: 'userId' });
    Employee.belongsTo(models.Department, { foreignKey: 'departmentId' });
    Employee.hasMany(models.Attendance, { foreignKey: 'employeeId' });
    Employee.hasMany(models.BiometricRecord, { foreignKey: 'employeeId' });
    Employee.hasMany(models.GPSLocation, { foreignKey: 'employeeId' });
    Employee.hasMany(models.Payroll, { foreignKey: 'employeeId' });
    Employee.hasMany(models.Leave, { foreignKey: 'employeeId' });
  };

  return Employee;
};
