const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const logger = require('../utils/logger');
const { Department } = require('../models');

// Get all departments
router.get('/', authMiddleware, async (req, res) => {
  try {
    const departments = await Department.findAll({
      where: { isActive: true }
    });

    res.json({
      success: true,
      data: departments
    });
  } catch (error) {
    logger.error('Error fetching departments', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب بيانات الأقسام'
    });
  }
});

// Create department
router.post('/', authMiddleware, roleMiddleware(['admin', 'hr']), async (req, res) => {
  try {
    const { name, description, budget } = req.body;

    const department = await Department.create({
      name,
      description,
      budget
    });

    logger.info(`New department created: ${department.name}`);

    res.status(201).json({
      success: true,
      message: 'تم إنشاء القسم بنجاح',
      data: department
    });
  } catch (error) {
    logger.error('Error creating department', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في إنشاء القسم'
    });
  }
});

module.exports = router;
