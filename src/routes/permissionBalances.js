const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { branchMiddleware, branchHRMiddleware } = require('../middleware/branchMiddleware');
const logger = require('../utils/logger');
const { PermissionBalance, Employee, Branch } = require('../models');
const moment = require('moment-timezone');

// Get permission balances for employees
router.get('/', authMiddleware, branchMiddleware, async (req, res) => {
  try {
    const { employeeId, month, year } = req.query;
    const currentMonth = month || moment().month() + 1;
    const currentYear = year || moment().year();

    const where = {
      branchId: req.branchId,
      month: parseInt(currentMonth),
      year: parseInt(currentYear)
    };

    if (employeeId) {
      where.employeeId = employeeId;
    }

    const balances = await PermissionBalance.findAll({
      where,
      include: [{ model: Employee, attributes: ['id', 'employeeId', 'firstName', 'lastName'] }]
    });

    res.json({
      success: true,
      data: balances
    });
  } catch (error) {
    logger.error('Error fetching permission balances', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب أرصدة الأذونات'
    });
  }
});

// Initialize monthly permissions for employees (HR Manager only)
router.post('/initialize-monthly', authMiddleware, branchMiddleware, branchHRMiddleware, async (req, res) => {
  try {
    const { month, year, allocatedPermissions } = req.body;

    // الحصول على جميع موظفي الفرع
    const employees = await Employee.findAll({
      where: {
        branchId: req.branchId,
        status: 'active'
      }
    });

    const created = [];
    for (const employee of employees) {
      // التحقق من وجود رصيد بالفعل
      const existing = await PermissionBalance.findOne({
        where: {
          employeeId: employee.id,
          branchId: req.branchId,
          month: parseInt(month),
          year: parseInt(year)
        }
      });

      if (!existing) {
        const balance = await PermissionBalance.create({
          employeeId: employee.id,
          branchId: req.branchId,
          month: parseInt(month),
          year: parseInt(year),
          allocatedPermissions: parseInt(allocatedPermissions) || 2,
          lastUpdatedBy: req.user.id,
          lastUpdatedAt: new Date()
        });
        created.push(balance);
      }
    }

    logger.info(`Permission balances initialized: ${created.length} employees`);

    res.json({
      success: true,
      message: `تم تهيئة الأذونات لـ ${created.length} موظف`,
      data: created
    });
  } catch (error) {
    logger.error('Error initializing permissions', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في تهيئة الأذونات'
    });
  }
});

// Update employee permission balance (HR Manager only)
router.put('/:permissionBalanceId', authMiddleware, branchMiddleware, branchHRMiddleware, async (req, res) => {
  try {
    const { permissionBalanceId } = req.params;
    const { allocatedPermissions, usedPermissions } = req.body;

    const balance = await PermissionBalance.findOne({
      where: {
        id: permissionBalanceId,
        branchId: req.branchId
      }
    });

    if (!balance) {
      return res.status(404).json({
        success: false,
        message: 'الرصيد غير موجود'
      });
    }

    const updates = {};
    if (allocatedPermissions !== undefined) {
      updates.allocatedPermissions = parseInt(allocatedPermissions);
    }
    if (usedPermissions !== undefined) {
      updates.usedPermissions = parseInt(usedPermissions);
    }

    updates.lastUpdatedBy = req.user.id;
    updates.lastUpdatedAt = new Date();

    await balance.update(updates);

    logger.info(`Permission balance updated: ${permissionBalanceId}`);
    global.io?.emit('permission:balance_updated', { permissionBalanceId });

    res.json({
      success: true,
      message: 'تم تحديث الرصيد بنجاح',
      data: balance
    });
  } catch (error) {
    logger.error('Error updating permission balance', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث الرصيد'
    });
  }
});

// Get employee current month permissions
router.get('/employee/:employeeId/current-month', authMiddleware, branchMiddleware, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const currentMonth = moment().month() + 1;
    const currentYear = moment().year();

    const balance = await PermissionBalance.findOne({
      where: {
        employeeId,
        branchId: req.branchId,
        month: currentMonth,
        year: currentYear
      }
    });

    if (!balance) {
      return res.json({
        success: true,
        data: null,
        message: 'لم يتم تخصيص أذونات للشهر الحالي'
      });
    }

    res.json({
      success: true,
      data: balance
    });
  } catch (error) {
    logger.error('Error fetching employee current month permissions', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب البيانات'
    });
  }
});

module.exports = router;
