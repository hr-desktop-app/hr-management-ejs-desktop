const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { branchMiddleware, branchHRMiddleware } = require('../middleware/branchMiddleware');
const logger = require('../utils/logger');
const { Permission, PermissionBalance, PermissionType, Employee, Branch } = require('../models');
const moment = require('moment-timezone');
const Sequelize = require('sequelize');

// Request permission
router.post('/request', authMiddleware, branchMiddleware, async (req, res) => {
  try {
    const { permissionTypeId, permissionDate, permissionTime, reason, isExtraPermission } = req.body;

    // الحصول على بيانات الموظف
    const employee = await Employee.findOne({
      where: {
        userId: req.user.id,
        branchId: req.branchId
      }
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'بيانات الموظف غير موجودة'
      });
    }

    // التحقق من نوع الأذن
    const permissionType = await PermissionType.findOne({
      where: {
        id: permissionTypeId,
        branchId: req.branchId
      }
    });

    if (!permissionType) {
      return res.status(404).json({
        success: false,
        message: 'نوع الأذن غير موجود'
      });
    }

    // إذا لم تكن أذن إضافية، التحقق من الرصيد المتاح
    if (!isExtraPermission) {
      const currentMonth = moment(permissionDate).month() + 1;
      const currentYear = moment(permissionDate).year();

      const balance = await PermissionBalance.findOne({
        where: {
          employeeId: employee.id,
          branchId: req.branchId,
          month: currentMonth,
          year: currentYear
        }
      });

      if (!balance) {
        return res.status(400).json({
          success: false,
          message: 'لم يتم تخصيص أذونات لهذا الشهر'
        });
      }

      const remainingPermissions = balance.allocatedPermissions - balance.usedPermissions - balance.pendingPermissions;
      if (remainingPermissions <= 0) {
        return res.status(400).json({
          success: false,
          message: 'انتهى رصيد الأذونات للشهر الحالي',
          remainingPermissions: 0
        });
      }
    }

    // الحصول على بيانات الفرع للحصول على المسؤولين
    const branch = await Branch.findByPk(req.branchId);

    // إنشاء طلب الأذن
    const permission = await Permission.create({
      employeeId: employee.id,
      branchId: req.branchId,
      permissionTypeId,
      permissionDate: new Date(permissionDate),
      permissionTime,
      reason,
      isExtraPermission: Boolean(isExtraPermission),
      status: 'pending',
      hrManagerStatus: 'pending'
    });

    // تحديث الأذونات المعلقة إذا لم تكن إضافية
    if (!isExtraPermission) {
      const currentMonth = moment(permissionDate).month() + 1;
      const currentYear = moment(permissionDate).year();

      const balance = await PermissionBalance.findOne({
        where: {
          employeeId: employee.id,
          branchId: req.branchId,
          month: currentMonth,
          year: currentYear
        }
      });

      if (balance) {
        await balance.update({
          pendingPermissions: balance.pendingPermissions + 1
        });
      }
    }

    logger.info(`Permission request created: ${permission.id}`);
    global.io?.emit('permission:request_created', {
      permissionId: permission.id,
      employeeId: employee.id
    });

    res.status(201).json({
      success: true,
      message: 'تم تقديم طلب الأذن بنجاح',
      data: permission
    });
  } catch (error) {
    logger.error('Error requesting permission', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في تقديم طلب الأذن'
    });
  }
});

// Get pending permissions for HR Manager
router.get('/pending/hr-manager', authMiddleware, branchMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'hr') {
      return res.status(403).json({
        success: false,
        message: 'لا يمكنك الوصول إلى هذا القسم'
      });
    }

    const permissions = await Permission.findAll({
      where: {
        branchId: req.branchId,
        hrManagerStatus: 'pending'
      },
      include: [
        { model: Employee, attributes: ['id', 'employeeId', 'firstName', 'lastName'] },
        { model: PermissionType, attributes: ['typeName'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: permissions
    });
  } catch (error) {
    logger.error('Error fetching pending permissions', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الطلبات المعلقة'
    });
  }
});

// Approve permission by HR Manager
router.post('/approve/hr-manager/:permissionId', authMiddleware, branchMiddleware, branchHRMiddleware, async (req, res) => {
  try {
    const { permissionId } = req.params;
    const { notes } = req.body;

    const permission = await Permission.findOne({
      where: {
        id: permissionId,
        branchId: req.branchId
      }
    });

    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'طلب الأذن غير موجود'
      });
    }

    if (permission.hrManagerStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'هذا الطلب تمت معالجته بالفعل'
      });
    }

    await permission.update({
      hrManagerStatus: 'approved',
      hrManagerApprovedBy: req.user.id,
      hrManagerApprovedAt: new Date(),
      hrManagerNotes: notes
    });

    logger.info(`Permission approved by HR Manager: ${permissionId}`);
    global.io?.emit('permission:hr_approved', { permissionId });

    res.json({
      success: true,
      message: 'تمت الموافقة على طلب الأذن',
      data: permission
    });
  } catch (error) {
    logger.error('Error approving permission', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في الموافقة على الأذن'
    });
  }
});

// Reject permission by HR Manager
router.post('/reject/hr-manager/:permissionId', authMiddleware, branchMiddleware, branchHRMiddleware, async (req, res) => {
  try {
    const { permissionId } = req.params;
    const { rejectionReason, notes } = req.body;

    const permission = await Permission.findOne({
      where: {
        id: permissionId,
        branchId: req.branchId
      }
    });

    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'طلب الأذن غير موجود'
      });
    }

    if (permission.hrManagerStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'هذا الطلب تمت معالجته بالفعل'
      });
    }

    await permission.update({
      hrManagerStatus: 'rejected',
      hrManagerApprovedBy: req.user.id,
      hrManagerApprovedAt: new Date(),
      hrManagerNotes: notes,
      rejectionReason
    });

    // إرجاع الأذن المعلقة
    if (!permission.isExtraPermission) {
      const currentMonth = moment(permission.permissionDate).month() + 1;
      const currentYear = moment(permission.permissionDate).year();

      const balance = await PermissionBalance.findOne({
        where: {
          employeeId: permission.employeeId,
          branchId: req.branchId,
          month: currentMonth,
          year: currentYear
        }
      });

      if (balance) {
        await balance.update({
          pendingPermissions: Math.max(0, balance.pendingPermissions - 1)
        });
      }
    }

    logger.info(`Permission rejected by HR Manager: ${permissionId}`);
    global.io?.emit('permission:hr_rejected', { permissionId });

    res.json({
      success: true,
      message: 'تم رفض طلب الأذن',
      data: permission
    });
  } catch (error) {
    logger.error('Error rejecting permission', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في رفض الأذن'
    });
  }
});

// Approve by Deputy Manager (second level)
router.post('/approve/deputy/:permissionId', authMiddleware, branchMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية'
      });
    }

    const { permissionId } = req.params;
    const { notes } = req.body;

    const permission = await Permission.findOne({
      where: {
        id: permissionId,
        branchId: req.branchId
      }
    });

    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'طلب الأذن غير موجود'
      });
    }

    if (permission.hrManagerStatus !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'يجب موافقة مسؤول شئون العاملين أولاً'
      });
    }

    await permission.update({
      deputyManagerStatus: 'approved',
      deputyManagerApprovedBy: req.user.id,
      deputyManagerApprovedAt: new Date(),
      deputyManagerNotes: notes
    });

    logger.info(`Permission approved by Deputy Manager: ${permissionId}`);
    global.io?.emit('permission:deputy_approved', { permissionId });

    res.json({
      success: true,
      message: 'تمت موافقة الوكيل',
      data: permission
    });
  } catch (error) {
    logger.error('Error approving by deputy', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في الموافقة'
    });
  }
});

// Reject by Deputy Manager
router.post('/reject/deputy/:permissionId', authMiddleware, branchMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية'
      });
    }

    const { permissionId } = req.params;
    const { rejectionReason, notes } = req.body;

    const permission = await Permission.findOne({
      where: {
        id: permissionId,
        branchId: req.branchId
      }
    });

    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'طلب الأذن غير موجود'
      });
    }

    await permission.update({
      deputyManagerStatus: 'rejected',
      deputyManagerApprovedBy: req.user.id,
      deputyManagerApprovedAt: new Date(),
      deputyManagerNotes: notes,
      rejectionReason,
      status: 'rejected'
    });

    logger.info(`Permission rejected by Deputy Manager: ${permissionId}`);
    global.io?.emit('permission:deputy_rejected', { permissionId });

    res.json({
      success: true,
      message: 'تم رفض الأذن من قبل الوكيل',
      data: permission
    });
  } catch (error) {
    logger.error('Error rejecting by deputy', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في الرفض'
    });
  }
});

// Approve by Manager (final level)
router.post('/approve/manager/:permissionId', authMiddleware, branchMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية'
      });
    }

    const { permissionId } = req.params;
    const { notes } = req.body;

    const permission = await Permission.findOne({
      where: {
        id: permissionId,
        branchId: req.branchId
      }
    });

    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'طلب الأذن غير موجود'
      });
    }

    if (permission.deputyManagerStatus !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'يجب موافقة الوكيل أولاً'
      });
    }

    await permission.update({
      managerStatus: 'approved',
      managerApprovedBy: req.user.id,
      managerApprovedAt: new Date(),
      managerNotes: notes,
      status: 'approved'
    });

    // تحديث رصيد الأذونات
    if (!permission.isExtraPermission) {
      const currentMonth = moment(permission.permissionDate).month() + 1;
      const currentYear = moment(permission.permissionDate).year();

      const balance = await PermissionBalance.findOne({
        where: {
          employeeId: permission.employeeId,
          branchId: req.branchId,
          month: currentMonth,
          year: currentYear
        }
      });

      if (balance) {
        await balance.update({
          usedPermissions: balance.usedPermissions + 1,
          pendingPermissions: Math.max(0, balance.pendingPermissions - 1)
        });
      }
    }

    logger.info(`Permission approved by Manager: ${permissionId}`);
    global.io?.emit('permission:approved', { permissionId });

    res.json({
      success: true,
      message: 'تمت موافقة المدير - تم قبول الأذن',
      data: permission
    });
  } catch (error) {
    logger.error('Error approving by manager', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في الموافقة'
    });
  }
});

// Reject by Manager (final level)
router.post('/reject/manager/:permissionId', authMiddleware, branchMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية'
      });
    }

    const { permissionId } = req.params;
    const { rejectionReason, notes } = req.body;

    const permission = await Permission.findOne({
      where: {
        id: permissionId,
        branchId: req.branchId
      }
    });

    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'طلب الأذن غير موجود'
      });
    }

    await permission.update({
      managerStatus: 'rejected',
      managerApprovedBy: req.user.id,
      managerApprovedAt: new Date(),
      managerNotes: notes,
      rejectionReason,
      status: 'rejected'
    });

    // إرجاع الأذن المعلقة
    if (!permission.isExtraPermission) {
      const currentMonth = moment(permission.permissionDate).month() + 1;
      const currentYear = moment(permission.permissionDate).year();

      const balance = await PermissionBalance.findOne({
        where: {
          employeeId: permission.employeeId,
          branchId: req.branchId,
          month: currentMonth,
          year: currentYear
        }
      });

      if (balance) {
        await balance.update({
          pendingPermissions: Math.max(0, balance.pendingPermissions - 1)
        });
      }
    }

    logger.info(`Permission rejected by Manager: ${permissionId}`);
    global.io?.emit('permission:rejected', { permissionId });

    res.json({
      success: true,
      message: 'تم رفض الأذن من قبل المدير',
      data: permission
    });
  } catch (error) {
    logger.error('Error rejecting by manager', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في الرفض'
    });
  }
});

// Get employee permission history
router.get('/history/employee/:employeeId', authMiddleware, branchMiddleware, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { month, year } = req.query;
    const currentMonth = month || moment().month() + 1;
    const currentYear = year || moment().year();

    const where = {
      employeeId,
      branchId: req.branchId
    };

    if (month && year) {
      where.permissionDate = {
        [Sequelize.Op.gte]: moment(`${currentYear}-${currentMonth}`, 'YYYY-MM').startOf('month').toDate(),
        [Sequelize.Op.lte]: moment(`${currentYear}-${currentMonth}`, 'YYYY-MM').endOf('month').toDate()
      };
    }

    const permissions = await Permission.findAll({
      where,
      include: [{ model: PermissionType, attributes: ['typeName'] }],
      order: [['permissionDate', 'DESC']]
    });

    res.json({
      success: true,
      data: permissions
    });
  } catch (error) {
    logger.error('Error fetching permission history', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب السجل'
    });
  }
});

module.exports = router;
