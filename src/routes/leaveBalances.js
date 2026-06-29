const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { branchMiddleware, branchHRMiddleware } = require('../middleware/branchMiddleware');
const logger = require('../utils/logger');
const { LeaveBalance, Employee, LeaveType } = require('../models');
const moment = require('moment-timezone');

// Get leave balances for my branch employees
router.get('/', authMiddleware, branchMiddleware, async (req, res) => {
  try {
    const { employeeId, year } = req.query;
    const currentYear = year || moment().year();

    const where = {
      branchId: req.branchId,
      year: parseInt(currentYear)
    };

    if (employeeId) {
      where.employeeId = employeeId;
    }

    const balances = await LeaveBalance.findAll({
      where,
      include: [
        { model: Employee, attributes: ['id', 'employeeId', 'firstName', 'lastName'] },
        { model: LeaveType, attributes: ['id', 'typeName', 'typeCode'] }
      ]
    });

    res.json({
      success: true,
      data: balances
    });
  } catch (error) {
    logger.error('Error fetching leave balances', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب أرصدة الإجازات'
    });
  }
});

// Set leave balance for employee (HR Manager only)
router.post('/set-balance', authMiddleware, branchMiddleware, branchHRMiddleware, async (req, res) => {
  try {
    const { employeeId, leaveTypeId, totalDays, year } = req.body;

    // التحقق من أن الموظف من نفس الفرع
    const employee = await Employee.findOne({
      where: {
        id: employeeId,
        branchId: req.branchId
      }
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'الموظف غير موجود في هذا الفرع'
      });
    }

    // التحقق من نوع الإجازة
    const leaveType = await LeaveType.findOne({
      where: {
        id: leaveTypeId,
        branchId: req.branchId
      }
    });

    if (!leaveType) {
      return res.status(404).json({
        success: false,
        message: 'نوع الإجازة غير موجود'
      });
    }

    const currentYear = year || moment().year();

    // البحث عن الرصيد الموجود
    let balance = await LeaveBalance.findOne({
      where: {
        employeeId,
        leaveTypeId,
        branchId: req.branchId,
        year: parseInt(currentYear)
      }
    });

    if (balance) {
      // تحديث الرصيد
      await balance.update({
        totalDays: parseFloat(totalDays),
        lastUpdatedBy: req.user.id,
        lastUpdatedAt: new Date()
      });
    } else {
      // إنشاء رصيد جديد
      balance = await LeaveBalance.create({
        employeeId,
        leaveTypeId,
        branchId: req.branchId,
        year: parseInt(currentYear),
        totalDays: parseFloat(totalDays),
        lastUpdatedBy: req.user.id,
        lastUpdatedAt: new Date()
      });
    }

    logger.info(`Leave balance set for employee: ${employeeId}`);
    global.io?.emit('leave:balance_updated', { employeeId, leaveTypeId });

    res.json({
      success: true,
      message: 'تم تعيين رصيد الإجازة بنجاح',
      data: balance
    });
  } catch (error) {
    logger.error('Error setting leave balance', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في تعيين رصيد الإجازة'
    });
  }
});

// Get employee leave balance
router.get('/employee/:employeeId', authMiddleware, branchMiddleware, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { year } = req.query;
    const currentYear = year || moment().year();

    // التحقق من أن الموظف من نفس الفرع
    const employee = await Employee.findOne({
      where: {
        id: employeeId,
        branchId: req.branchId
      }
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'الموظف غير موجود'
      });
    }

    const balances = await LeaveBalance.findAll({
      where: {
        employeeId,
        branchId: req.branchId,
        year: parseInt(currentYear)
      },
      include: [{ model: LeaveType, attributes: ['id', 'typeName', 'typeCode', 'color'] }]
    });

    res.json({
      success: true,
      data: balances
    });
  } catch (error) {
    logger.error('Error fetching employee leave balance', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب أرصدة إجازات الموظف'
    });
  }
});

module.exports = router;
