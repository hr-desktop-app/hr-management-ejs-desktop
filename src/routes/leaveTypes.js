const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { branchMiddleware, branchHRMiddleware } = require('../middleware/branchMiddleware');
const logger = require('../utils/logger');
const { LeaveType, Branch, Leave } = require('../models');
const moment = require('moment-timezone');
const { Sequelize } = require('sequelize');

// Get leave types for my branch
router.get('/', authMiddleware, branchMiddleware, async (req, res) => {
  try {
    const leaveTypes = await LeaveType.findAll({
      where: {
        branchId: req.branchId,
        isActive: true
      }
    });

    res.json({
      success: true,
      data: leaveTypes
    });
  } catch (error) {
    logger.error('Error fetching leave types', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب أنواع الإجازات'
    });
  }
});

// Create new leave type (HR Manager only)
router.post('/', authMiddleware, branchMiddleware, branchHRMiddleware, async (req, res) => {
  try {
    const {
      typeName,
      typeCode,
      description,
      defaultDays,
      requiresAttachments,
      color
    } = req.body;

    // التحقق من عدم تكرار الكود
    const existing = await LeaveType.findOne({
      where: {
        branchId: req.branchId,
        typeCode
      }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'نوع الإجازة موجود بالفعل'
      });
    }

    const leaveType = await LeaveType.create({
      branchId: req.branchId,
      typeName,
      typeCode,
      description,
      defaultDays: parseInt(defaultDays) || 0,
      requiresAttachments: Boolean(requiresAttachments),
      color: color || '#3498db'
    });

    logger.info(`Leave type created: ${typeName}`);

    res.status(201).json({
      success: true,
      message: 'تم إنشاء نوع الإجازة بنجاح',
      data: leaveType
    });
  } catch (error) {
    logger.error('Error creating leave type', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في إنشاء نوع الإجازة'
    });
  }
});

// Update leave type (HR Manager only)
router.put('/:id', authMiddleware, branchMiddleware, branchHRMiddleware, async (req, res) => {
  try {
    const leaveType = await LeaveType.findOne({
      where: {
        id: req.params.id,
        branchId: req.branchId
      }
    });

    if (!leaveType) {
      return res.status(404).json({
        success: false,
        message: 'نوع الإجازة غير موجود'
      });
    }

    await leaveType.update(req.body);

    logger.info(`Leave type updated: ${req.params.id}`);

    res.json({
      success: true,
      message: 'تم تحديث نوع الإجازة بنجاح',
      data: leaveType
    });
  } catch (error) {
    logger.error('Error updating leave type', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث نوع الإجازة'
    });
  }
});

// Delete leave type (HR Manager only)
router.delete('/:id', authMiddleware, branchMiddleware, branchHRMiddleware, async (req, res) => {
  try {
    const leaveType = await LeaveType.findOne({
      where: {
        id: req.params.id,
        branchId: req.branchId
      }
    });

    if (!leaveType) {
      return res.status(404).json({
        success: false,
        message: 'نوع الإجازة غير موجود'
      });
    }

    // Soft delete
    await leaveType.update({ isActive: false });

    logger.info(`Leave type deleted: ${req.params.id}`);

    res.json({
      success: true,
      message: 'تم حذف نوع الإجازة بنجاح'
    });
  } catch (error) {
    logger.error('Error deleting leave type', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في حذف نوع الإجازة'
    });
  }
});

module.exports = router;
