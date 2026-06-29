const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const logger = require('../utils/logger');
const { BiometricDevice, DeviceOfficeConfig } = require('../models');

// Get all biometric devices
router.get('/', authMiddleware, async (req, res) => {
  try {
    const devices = await BiometricDevice.findAll({
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: devices
    });
  } catch (error) {
    logger.error('Error fetching devices', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب قائمة الأجهزة'
    });
  }
});

// Register new device
router.post('/register', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const {
      deviceName,
      deviceId,
      deviceType,
      manufacturer,
      model,
      serialNumber,
      communicationPort,
      location,
      ipAddress
    } = req.body;

    const existingDevice = await BiometricDevice.findOne({ where: { deviceId } });
    if (existingDevice) {
      return res.status(400).json({
        success: false,
        message: 'هذا الجهاز مسجل بالفعل'
      });
    }

    const device = await BiometricDevice.create({
      deviceName,
      deviceId,
      deviceType,
      manufacturer,
      model,
      serialNumber,
      communicationPort,
      location,
      ipAddress,
      isActive: true
    });

    logger.info(`New biometric device registered: ${deviceId}`);
    global.io?.emit('device:registered', device);

    res.status(201).json({
      success: true,
      message: 'تم تسجيل الجهاز بنجاح',
      data: device
    });
  } catch (error) {
    logger.error('Error registering device', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في تسجيل الجهاز'
    });
  }
});

// Update device status
router.put('/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const device = await BiometricDevice.findByPk(req.params.id);
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'الجهاز غير موجود'
      });
    }

    await device.update(req.body);

    logger.info(`Device updated: ${req.params.id}`);
    global.io?.emit('device:updated', device);

    res.json({
      success: true,
      message: 'تم تحديث بيانات الجهاز بنجاح',
      data: device
    });
  } catch (error) {
    logger.error('Error updating device', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث بيانات الجهاز'
    });
  }
});

// Configure office location
router.post('/office-config', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const {
      officeName,
      latitude,
      longitude,
      radiusMeters,
      checkInStartTime,
      checkInEndTime,
      expectedCheckOutTime,
      dailyWorkHours,
      timezone
    } = req.body;

    // Check if config already exists
    let config = await DeviceOfficeConfig.findOne({ where: { officeName } });

    if (config) {
      await config.update(req.body);
      logger.info(`Office config updated: ${officeName}`);
    } else {
      config = await DeviceOfficeConfig.create({
        officeName,
        latitude,
        longitude,
        radiusMeters,
        checkInStartTime,
        checkInEndTime,
        expectedCheckOutTime,
        dailyWorkHours,
        timezone,
        isActive: true
      });
      logger.info(`New office config created: ${officeName}`);
    }

    global.io?.emit('device:office_config_updated', config);

    res.json({
      success: true,
      message: 'تم تحديث إعدادات المكتب بنجاح',
      data: config
    });
  } catch (error) {
    logger.error('Error configuring office', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث إعدادات المكتب'
    });
  }
});

// Get office configuration
router.get('/office-config/active', authMiddleware, async (req, res) => {
  try {
    const config = await DeviceOfficeConfig.findOne({ where: { isActive: true } });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'لم يتم تكوين المكتب بعد'
      });
    }

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    logger.error('Error fetching office config', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب إعدادات المكتب'
    });
  }
});

module.exports = router;
