module.exports = (sequelize, Sequelize) => {
  const Attendance = sequelize.define('Attendance', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    checkInTime: {
      type: Sequelize.DATE,
      allowNull: false
    },
    checkOutTime: {
      type: Sequelize.DATE
    },
    checkInLatitude: {
      type: Sequelize.DECIMAL(10, 8)
    },
    checkInLongitude: {
      type: Sequelize.DECIMAL(11, 8)
    },
    checkOutLatitude: {
      type: Sequelize.DECIMAL(10, 8)
    },
    checkOutLongitude: {
      type: Sequelize.DECIMAL(11, 8)
    },
    checkInMethod: {
      type: Sequelize.ENUM('biometric', 'gps', 'manual', 'mobile'),
      defaultValue: 'biometric',
      comment: 'How the check-in was recorded'
    },
    checkOutMethod: {
      type: Sequelize.ENUM('biometric', 'gps', 'manual', 'mobile')
    },
    status: {
      type: Sequelize.ENUM('present', 'late', 'absent', 'half_day', 'on_leave'),
      defaultValue: 'present'
    },
    workHours: {
      type: Sequelize.DECIMAL(5, 2),
      comment: 'Total work hours for the day'
    },
    notes: {
      type: Sequelize.TEXT
    },
    isWithinRadius: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      comment: 'Whether check-in was within office GPS radius'
    },
    attendanceDate: {
      type: Sequelize.DATE,
      allowNull: false
    }
  }, {
    timestamps: true,
    underscored: true,
    tableName: 'attendance'
  });

  Attendance.associate = (models) => {
    Attendance.belongsTo(models.Employee, { foreignKey: 'employeeId' });
  };

  return Attendance;
};
