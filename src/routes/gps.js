const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const logger = require('../utils/logger');
const { GPSLocation, Employee } = require('../models');
const { GPSHelper } = require('../utils/helpers');

// Log GPS location
router.post('/location', authMiddleware, async (req, res) => {
  try {
    const { employeeId, latitude, longitude, accuracy, altitude, speed, heading } = req.body;

    // Validate GPS coordinates
    if (!GPSHelper.validateGPSAccuracy(accuracy)) {
      return res.status(400).json({
        success: false,
        message: `دقة GPS منخفضة جداً (${accuracy}م) - يرجى المحاولة مرة أخرى`,
        accuracy
      });
    }

    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'الموظف غير موجود'
      });
    }

    // Get office configuration
    const { DeviceOfficeConfig } = require('../models');
    const officeConfig = await DeviceOfficeConfig.findOne({ where: { isActive: true } });

    let isWithinOffice = false;
    let distance = 0;

    if (officeConfig) {
      isWithinOffice = GPSHelper.isWithinRadius(
        latitude,
        longitude,
        officeConfig.latitude,
        officeConfig.longitude,
        officeConfig.radiusMeters
      );

      distance = GPSHelper.calculateDistance(
        latitude,
        longitude,
        officeConfig.latitude,
        officeConfig.longitude
      );
    }

    const location = await GPSLocation.create({
      employeeId,
      latitude,
      longitude,
      accuracy,
      altitude,
      speed,
      heading,
      isWithinOffice,
      distance,
      source: 'mobile'
    });

    logger.debug(`GPS location recorded for employee: ${employeeId}`);
    global.io?.emit('gps:location_update', {
      employeeId,
      latitude,
      longitude,
      isWithinOffice,
      distance
    });

    res.status(201).json({
      success: true,
      message: isWithinOffice ? 'أنت داخل محيط المكتب' : `أنت على مسافة ${Math.round(distance)}م من المكتب`,
      data: {
        latitude,
        longitude,
        isWithinOffice,
        distance: Math.round(distance)
      }
    });
  } catch (error) {
    logger.error('Error logging GPS location', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في تسجيل الموقع'
    });
  }
});

// Get employee location history
router.get('/history/:employeeId', authMiddleware, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { limit = 100, offset = 0, startDate, endDate } = req.query;

    const where = { employeeId };

    if (startDate && endDate) {
      where.recordedAt = {
        [require('sequelize').Op.between]: [
          new Date(startDate),
          new Date(endDate)
        ]
      };
    }

    const locations = await GPSLocation.findAll({
      where,
      order: [['recordedAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: locations
    });
  } catch (error) {
    logger.error('Error fetching GPS history', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب سجل المواقع'
    });
  }
});

// Get current location status
router.get('/status/:employeeId', authMiddleware, async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Get latest GPS record
    const latestLocation = await GPSLocation.findOne({
      where: { employeeId },
      order: [['recordedAt', 'DESC']]
    });

    if (!latestLocation) {
      return res.json({
        success: true,
        data: null,
        message: 'لا توجد بيانات موقع متاحة'
      });
    }

    res.json({
      success: true,
      data: {
        latitude: latestLocation.latitude,
        longitude: latestLocation.longitude,
        isWithinOffice: latestLocation.isWithinOffice,
        distance: Math.round(latestLocation.distance),
        accuracy: latestLocation.accuracy,
        lastUpdate: latestLocation.recordedAt
      }
    });
  } catch (error) {
    logger.error('Error fetching GPS status', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب حالة الموقع'
    });
  }
});

// Get all employees currently in office
router.get('/in-office/all', authMiddleware, async (req, res) => {
  try {
    const { sequelize } = require('../models');
    const Sequelize = require('sequelize');

    // Get latest GPS location for each employee
    const employeesInOffice = await GPSLocation.findAll({
      attributes: [
        'employeeId',
        [sequelize.fn('MAX', sequelize.col('recordedAt')), 'lastUpdate']
      ],
      where: { isWithinOffice: true },
      group: ['employeeId'],
      include: [{ model: Employee, attributes: ['employeeId', 'firstName', 'lastName'] }],
      subQuery: false
    });

    res.json({
      success: true,
      count: employeesInOffice.length,
      data: employeesInOffice
    });
  } catch (error) {
    logger.error('Error fetching employees in office', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الموظفين الموجودين'
    });
  }
});

module.exports = router;
