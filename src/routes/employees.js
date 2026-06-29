const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const logger = require('../utils/logger');
const { Employee, User, Department } = require('../models');
const { StringHelper, ValidationHelper } = require('../utils/helpers');

// Get all employees
router.get('/', authMiddleware, async (req, res) => {
  try {
    const employees = await Employee.findAll({
      include: [
        { model: User, attributes: ['id', 'email', 'firstName', 'lastName'] },
        { model: Department, attributes: ['id', 'name'] }
      ],
      attributes: { exclude: ['password'] }
    });

    res.json({
      success: true,
      data: employees
    });
  } catch (error) {
    logger.error('Error fetching employees', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب بيانات الموظفين'
    });
  }
});

// Get single employee
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id, {
      include: [
        { model: User, attributes: ['email'] },
        { model: Department }
      ]
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'الموظف غير موجود'
      });
    }

    res.json({
      success: true,
      data: employee
    });
  } catch (error) {
    logger.error('Error fetching employee', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب بيانات الموظف'
    });
  }
});

// Create employee
router.post('/', authMiddleware, roleMiddleware(['admin', 'hr']), async (req, res) => {
  try {
    const { firstName, lastName, email, phoneNumber, nationalId, dateOfBirth, gender, position, departmentId, hireDate, salary, employmentType } = req.body;

    // Validation
    if (!ValidationHelper.validateEmail(email)) {
      return res.status(400).json({ success: false, message: 'البريد الإلكتروني غير صحيح' });
    }

    if (!ValidationHelper.validatePhoneNumber(phoneNumber)) {
      return res.status(400).json({ success: false, message: 'رقم الهاتف غير صحيح' });
    }

    if (!ValidationHelper.validateNationalId(nationalId)) {
      return res.status(400).json({ success: false, message: 'رقم الهوية غير صحيح' });
    }

    const employee = await Employee.create({
      employeeId: StringHelper.generateEmployeeId(),
      firstName,
      lastName,
      email,
      phoneNumber,
      nationalId,
      dateOfBirth,
      gender,
      position,
      departmentId,
      hireDate,
      salary,
      employmentType,
      status: 'active'
    });

    logger.info(`New employee created: ${employee.employeeId}`);

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الموظف بنجاح',
      data: employee
    });
  } catch (error) {
    logger.error('Error creating employee', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في إنشاء الموظف'
    });
  }
});

// Update employee
router.put('/:id', authMiddleware, roleMiddleware(['admin', 'hr']), async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'الموظف غير موجود'
      });
    }

    await employee.update(req.body);

    logger.info(`Employee updated: ${employee.employeeId}`);

    res.json({
      success: true,
      message: 'تم تحديث بيانات الموظف بنجاح',
      data: employee
    });
  } catch (error) {
    logger.error('Error updating employee', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث بيانات الموظف'
    });
  }
});

// Delete employee (soft delete)
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'الموظف غير موجود'
      });
    }

    await employee.update({ status: 'terminated' });

    logger.info(`Employee terminated: ${employee.employeeId}`);

    res.json({
      success: true,
      message: 'تم حذف الموظف بنجاح'
    });
  } catch (error) {
    logger.error('Error deleting employee', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في حذف الموظف'
    });
  }
});

module.exports = router;
