const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { branchMiddleware, branchHRMiddleware } = require('../middleware/branchMiddleware');
const logger = require('../utils/logger');
const { Leave, Employee, LeaveType, LeaveBalance, User, Branch } = require('../models');
const { DateHelper } = require('../utils/helpers');
const moment = require('moment-timezone');
const Sequelize = require('sequelize');

// Request leave
router.post('/request', authMiddleware, branchMiddleware, async (req, res) => {
  try {
    const { leaveTypeId, startDate, endDate, reason, documents } = req.body;
    const { Attendance } = require('../models');

    // الحصول على بيانات الموظف
    const employee = await Employee.findOne({
      where: {
        id: req.user.Employee?.id || req.user.id
      },
      include: [{ model: User }]
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'الموظف غير موجود'
      });
    }

    // التحقق من أن الموظف من نفس الفرع
    if (employee.branchId !== req.branchId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'لا يمكنك التقدم بطلب إجازة خارج فرعك'
      });
    }

    // التحقق من نوع الإجازة
    const leaveType = await LeaveType.findOne({
      where: {
        id: leaveTypeId,
        branchId: employee.branchId
      }
    });

    if (!leaveType) {
      return res.status(404).json({
        success: false,
        message: 'نوع الإجازة غير موجود'
      });
    }

    // حساب عدد أيام الإجازة
    const start = moment(startDate);
    const end = moment(endDate);
    let totalDays = 0;
    const current = start.clone();

    while (current <= end) {
      const dayOfWeek = current.day();
      // تخطي أيام الأسبوع (الجمعة والسبت عادة)
      if (dayOfWeek !== 5 && dayOfWeek !== 6) {
        totalDays += 1;
      }
      current.add(1, 'day');
    }

    // التحقق من الرصيد المتاح
    const currentYear = moment().year();
    const balance = await LeaveBalance.findOne({
      where: {
        employeeId: employee.id,
        leaveTypeId,
        branchId: employee.branchId,
        year: currentYear
      }
    });

    if (!balance) {
      return res.status(400).json({
        success: false,
        message: 'لم يتم تحديد رصيد إجازات لك من هذا النوع'
      });
    }

    const availableDays = balance.totalDays - balance.usedDays - balance.pendingDays;
    if (availableDays < totalDays) {
      return res.status(400).json({
        success: false,
        message: `الرصيد المتاح: ${availableDays} أيام فقط`,
        availableDays
      });
    }

    // الحصول على مسئول شئون العاملين
    const branch = await Branch.findByPk(employee.branchId);
    const hrManager = branch?.hrManagerId ? await Employee.findByPk(branch.hrManagerId) : null;

    // إنشاء طلب الإجازة
    const leave = await Leave.create({
      employeeId: employee.id,
      branchId: employee.branchId,
      leaveTypeId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      totalDays,
      reason,
      documents: documents || [],
      status: 'pending',
      hrManagerStatus: 'pending',
      hrManagerApprovedBy: hrManager?.userId || null
    });

    // تحديث الأيام المعلقة
    await balance.update({
      pendingDays: balance.pendingDays + totalDays
    });

    logger.info(`Leave request created: ${leave.id}`);
    global.io?.emit('leave:request_created', {
      leaveId: leave.id,
      employeeId: employee.id,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'تم تقديم طلب الإجازة بنجاح',
      data: leave
    });
  } catch (error) {
    logger.error('Error requesting leave', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في تقديم طلب الإجازة'
    });
  }
});

// Get pending leaves for HR Manager approval
router.get('/pending/hr-manager', authMiddleware, branchMiddleware, async (req, res) => {
  try {
    // التحقق من أن المستخدم مسئول شئون عاملين أو مدير فرع
    if (req.user.role !== 'admin' && req.user.role !== 'hr') {
      return res.status(403).json({
        success: false,
        message: 'لا يمكنك الوصول إلى هذا القسم'
      });
    }

    const leaves = await Leave.findAll({
      where: {
        branchId: req.branchId,
        hrManagerStatus: 'pending'
      },
      include: [
        { model: Employee, attributes: ['id', 'employeeId', 'firstName', 'lastName'] },
        { model: LeaveType, attributes: ['typeName'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: leaves
    });
  } catch (error) {
    logger.error('Error fetching pending leaves', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الطلبات المعلقة'
    });
  }
});

// Approve leave by HR Manager
router.post('/approve/hr-manager/:leaveId', authMiddleware, branchMiddleware, branchHRMiddleware, async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { notes } = req.body;

    const leave = await Leave.findOne({
      where: {
        id: leaveId,
        branchId: req.branchId
      }
    });

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'طلب الإجازة غير موجود'
      });
    }

    if (leave.hrManagerStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'هذا الطلب تمت معالجته بالفعل'
      });
    }

    await leave.update({
      hrManagerStatus: 'approved',
      hrManagerApprovedBy: req.user.id,
      hrManagerApprovedAt: new Date(),
      hrManagerNotes: notes
    });

    logger.info(`Leave approved by HR Manager: ${leaveId}`);
    global.io?.emit('leave:hr_approved', { leaveId });

    res.json({
      success: true,
      message: 'تمت الموافقة على طلب الإجازة',
      data: leave
    });
  } catch (error) {
    logger.error('Error approving leave', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في الموافقة على الإجازة'
    });
  }
});

// Reject leave by HR Manager
router.post('/reject/hr-manager/:leaveId', authMiddleware, branchMiddleware, branchHRMiddleware, async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { rejectionReason, notes } = req.body;

    const leave = await Leave.findOne({
      where: {
        id: leaveId,
        branchId: req.branchId
      }
    });

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'طلب الإجازة غير موجود'
      });
    }

    if (leave.hrManagerStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'هذا الطلب تمت معالجته بالفعل'
      });
    }

    await leave.update({
      hrManagerStatus: 'rejected',
      hrManagerApprovedBy: req.user.id,
      hrManagerApprovedAt: new Date(),
      hrManagerNotes: notes,
      rejectionReason
    });

    // إرجاع الأيام المعلقة
    const balance = await LeaveBalance.findOne({
      where: {
        employeeId: leave.employeeId,
        leaveTypeId: leave.leaveTypeId,
        branchId: req.branchId
      }
    });

    if (balance) {
      await balance.update({
        pendingDays: Math.max(0, balance.pendingDays - leave.totalDays)
      });
    }

    logger.info(`Leave rejected by HR Manager: ${leaveId}`);
    global.io?.emit('leave:hr_rejected', { leaveId });

    res.json({
      success: true,
      message: 'تم رفض طلب الإجازة',
      data: leave
    });
  } catch (error) {
    logger.error('Error rejecting leave', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في رفض الإجازة'
    });
  }
});

// Get leave history for employee
router.get('/history/employee/:employeeId', authMiddleware, branchMiddleware, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { year } = req.query;
    const currentYear = year || moment().year();

    const where = {
      employeeId,
      branchId: req.branchId
    };

    if (year) {
      where.startDate = {
        [Sequelize.Op.gte]: moment(`${currentYear}-01-01`).toDate(),
        [Sequelize.Op.lte]: moment(`${currentYear}-12-31`).toDate()
      };
    }

    const leaves = await Leave.findAll({
      where,
      include: [{ model: LeaveType, attributes: ['typeName', 'color'] }],
      order: [['startDate', 'DESC']]
    });

    res.json({
      success: true,
      data: leaves
    });
  } catch (error) {
    logger.error('Error fetching leave history', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب سجل الإجازات'
    });
  }
});

module.exports = router;
