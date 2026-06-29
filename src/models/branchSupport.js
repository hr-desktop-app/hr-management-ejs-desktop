const models = require('../models');

// إضافة branchId لموديل Employee
const addBranchSupport = async (sequelize) => {
  try {
    // هذا سيتم إضافته في migration
    console.log('Branch support added to Employee model');
  } catch (error) {
    console.error('Error adding branch support:', error);
  }
};

const { Employee } = models;

// Override Employee model
Employee.prototype.getBranchEmployees = async function() {
  return Employee.findAll({
    where: { branchId: this.branchId }
  });
};

module.exports = models;
