const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const logger = require('../utils/logger');
const { BiometricRecord, Employee } = require('../models');
const { BiometricHelper } = require('../utils/helpers');

// Get biometric records
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { employeeId, startDate, endDate } = req.query;
    const where = {};

    if (employeeId) where.employeeId = employeeId;

    if (startDate && endDate) {
      where.recordedAt = {
        [require('sequelize').Op.between]: [
          new Date(startDate),
          new Date(endDate)
        ]
      };
    }

    const records = await BiometricRecord.findAll({
      where,
      include: [{ model: Employee, attributes: ['employeeId', 'firstName', 'lastName'] }],
      order: [['recordedAt', 'DESC']]
    });

    res.json({
      success: true,
      data: records
    });
  } catch (error) {
    logger.error('Error fetching biometric records', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب سجلات البصمة'
    });
  }
});

// Record biometric data
router.post('/record', authMiddleware, async (req, res) => {
  try {
    const { employeeId, biometricType, biometricData, deviceId, quality, attempts } = req.body;

    // Validate employee exists
    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'الموظف غير موجود'
      });
    }

    // Encrypt biometric data
    const encryptedData = BiometricHelper.encryptBiometricData(biometricData);

    const record = await BiometricRecord.create({
      employeeId,
      biometricType,
      biometricData: encryptedData,
      deviceId,
      quality: quality || 100,
      attempts: attempts || 1,
      isVerified: true
    });

    logger.info(`Biometric record created for employee: ${employeeId}`);
    global.io?.emit('biometric:recorded', { employeeId, type: biometricType });

    res.status(201).json({
      success: true,
      message: 'تم تسجيل البصمة بنجاح',
      data: {
        id: record.id,
        employeeId: record.employeeId,
        biometricType: record.biometricType,
        quality: record.quality,
        recordedAt: record.recordedAt
      }
    });
  } catch (error) {
    logger.error('Error recording biometric', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في تسجيل البصمة'
    });
  }
});

// Verify biometric
router.post('/verify', authMiddleware, async (req, res) => {
  try {
    const { employeeId, biometricType, biometricData } = req.body;

    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'الموظف غير موجود'
      });
    }

    // Get latest biometric record of this type
    const latestRecord = await BiometricRecord.findOne({
      where: { employeeId, biometricType },
      order: [['recordedAt', 'DESC']]
    });

    if (!latestRecord) {
      return res.status(400).json({
        success: false,
        message: 'لم يتم تسجيل بصمة لهذا الموظف'
      });
    }

    // Decrypt and compare
    const decryptedData = BiometricHelper.decryptBiometricData(latestRecord.biometricData);
    const hash1 = BiometricHelper.generateBiometricHash(decryptedData);
    const hash2 = BiometricHelper.generateBiometricHash(biometricData);

    const isMatch = hash1 === hash2;

    if (isMatch) {
      logger.info(`Biometric verification successful for employee: ${employeeId}`);
      global.io?.emit('biometric:verified', { employeeId, type: biometricType });

      res.json({
        success: true,
        message: 'تم التحقق من البصمة بنجاح',
        isMatch: true
      });
    } else {
      logger.warn(`Biometric verification failed for employee: ${employeeId}`);
      res.status(400).json({
        success: false,
        message: 'البصمة لا تطابق السجل المحفوظ',
        isMatch: false
      });
    }
  } catch (error) {
    logger.error('Error verifying biometric', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في التحقق من البصمة'
    });
  }
});

// Enroll employee biometric
router.post('/enroll', authMiddleware, roleMiddleware(['admin', 'hr']), async (req, res) => {
  try {
    const { employeeId, biometricType, biometricData, deviceId } = req.body;

    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'الموظف غير موجود'
      });
    }

    // Check if already enrolled
    const existing = await BiometricRecord.findOne({
      where: { employeeId, biometricType }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'هذا الموظف مسجل بالفعل'
      });
    }

    const encryptedData = BiometricHelper.encryptBiometricData(biometricData);

    const record = await BiometricRecord.create({
      employeeId,
      biometricType,
      biometricData: encryptedData,
      deviceId,
      quality: 100,
      isVerified: true
    });

    // Update employee biometric ID
    await employee.update({ biometricId: record.id });

    logger.info(`Employee enrolled in biometric system: ${employeeId}`);
    global.io?.emit('biometric:enrolled', { employeeId });

    res.status(201).json({
      success: true,
      message: 'تم تسجيل الموظف في نظام البصمة بنجاح',
      data: record
    });
  } catch (error) {
    logger.error('Error enrolling biometric', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في تسجيل البصمة'
    });
  }
});

module.exports = router;
