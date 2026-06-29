const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { branchMiddleware, branchHRMiddleware } = require('../middleware/branchMiddleware');
const logger = require('../utils/logger');
const { Branch, Employee } = require('../models');
const { StringHelper } = require('../utils/helpers');

// Get all branches (Admin only)
router.get('/', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const branches = await Branch.findAll({
      where: { isActive: true },
      attributes: { exclude: ['createdAt', 'updatedAt'] }
    });

    res.json({
      success: true,
      data: branches
    });
  } catch (error) {
    logger.error('Error fetching branches', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الفروع'
    });
  }
});

// Get my branch
router.get('/my-branch', authMiddleware, branchMiddleware, async (req, res) => {
  try {
    const branch = await Branch.findByPk(req.branchId);

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'الفرع غير موجود'
      });
    }

    res.json({
      success: true,
      data: branch
    });
  } catch (error) {
    logger.error('Error fetching my branch', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب بيانات الفرع'
    });
  }
});

// Create branch (Admin only)
router.post('/', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const {
      branchName,
      branchCode,
      city,
      address,
      phoneNumber,
      latitude,
      longitude,
      radiusMeters
    } = req.body;

    const branch = await Branch.create({
      branchName,
      branchCode,
      city,
      address,
      phoneNumber,
      latitude: parseFloat(latitude) || 30.0444,
      longitude: parseFloat(longitude) || 31.2357,
      radiusMeters: parseInt(radiusMeters) || 500,
      isActive: true
    });

    logger.info(`Branch created: ${branchName}`);
    global.io?.emit('branch:created', branch);

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الفرع بنجاح',
      data: branch
    });
  } catch (error) {
    logger.error('Error creating branch', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في إنشاء الفرع'
    });
  }
});

// Update branch (Admin only)
router.put('/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const branch = await Branch.findByPk(req.params.id);

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'الفرع غير موجود'
      });
    }

    await branch.update(req.body);

    logger.info(`Branch updated: ${req.params.id}`);
    global.io?.emit('branch:updated', branch);

    res.json({
      success: true,
      message: 'تم تحديث الفرع بنجاح',
      data: branch
    });
  } catch (error) {
    logger.error('Error updating branch', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث الفرع'
    });
  }
});

// Get branch statistics
router.get('/stats/:branchId', authMiddleware, branchMiddleware, async (req, res) => {
  try {
    const { branchId } = req.params;

    // التحقق من صلاحية الوصول
    if (branchId !== req.branchId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'لا يمكنك الوصول إلى إحصائيات فرع آخر'
      });
    }

    const employeeCount = await Employee.count({
      where: { branchId, status: 'active' }
    });

    const stats = {
      totalEmployees: employeeCount,
      branchId
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error fetching branch stats', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب إحصائيات الفرع'
    });
  }
});

module.exports = router;
