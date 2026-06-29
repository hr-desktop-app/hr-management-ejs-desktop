const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const logger = require('../utils/logger');
const { Attendance, Employee, GPSLocation, DeviceOfficeConfig } = require('../models');
const { DateHelper, GPSHelper } = require('../utils/helpers');
const moment = require('moment-timezone');

// Get attendance records
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { employeeId, startDate, endDate, status } = req.query;
    const where = {};

    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;

    if (startDate && endDate) {
      where.attendanceDate = {
        [require('sequelize').Op.between]: [
          new Date(startDate),
          new Date(endDate)
        ]
      };
    }

    const attendance = await Attendance.findAll({
      where,
      include: [{ model: Employee, attributes: ['employeeId', 'firstName', 'lastName'] }],
      order: [['attendanceDate', 'DESC']]
    });

    res.json({
      success: true,
      data: attendance
    });
  } catch (error) {
    logger.error('Error fetching attendance records', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب سجلات الحضور'
    });
  }
});

// Check-In with GPS verification
router.post('/check-in', authMiddleware, async (req, res) => {
  try {
    const { employeeId, latitude, longitude, method = 'gps' } = req.body;
    const now = DateHelper.getCurrentDate();

    // Get office configuration
    const officeConfig = await DeviceOfficeConfig.findOne({ where: { isActive: true } });
    if (!officeConfig) {
      return res.status(400).json({
        success: false,
        message: 'لم يتم تكوين محيط المكتب بعد'
      });
    }

    let isWithinRadius = true;
    if (method === 'gps' && latitude && longitude) {
      isWithinRadius = GPSHelper.isWithinRadius(
        latitude,
        longitude,
        officeConfig.latitude,
        officeConfig.longitude,
        officeConfig.radiusMeters
      );

      if (!isWithinRadius) {
        return res.status(400).json({
          success: false,
          message: `أنت خارج محيط المكتب بـ ${GPSHelper.calculateDistance(latitude, longitude, officeConfig.latitude, officeConfig.longitude)} متر`,
          isWithinRadius: false
        });
      }
    }

    // Check if already checked in today
    const existingCheckIn = await Attendance.findOne({
      where: {
        employeeId,
        attendanceDate: {
          [require('sequelize').Op.gte]: moment(now).startOf('day').toDate(),
          [require('sequelize').Op.lte]: moment(now).endOf('day').toDate()
        },
        checkOutTime: null
      }
    });

    if (existingCheckIn) {
      return res.status(400).json({
        success: false,
        message: 'تم تسجيل الدخول بالفعل اليوم'
      });
    }

    // Determine status (late or on time)
    let status = 'present';
    if (officeConfig.checkInEndTime) {
      if (DateHelper.isLateCheckIn(now, officeConfig.checkInEndTime)) {
        status = 'late';
      }
    }

    // Create attendance record
    const attendance = await Attendance.create({
      employeeId,
      checkInTime: now,
      checkInLatitude: latitude,
      checkInLongitude: longitude,
      checkInMethod: method,
      status,
      isWithinRadius,
      attendanceDate: moment(now).startOf('day').toDate()
    });

    // Save GPS location
    if (latitude && longitude) {
      const distance = GPSHelper.calculateDistance(
        latitude,
        longitude,
        officeConfig.latitude,
        officeConfig.longitude
      );

      await GPSLocation.create({
        employeeId,
        latitude,
        longitude,
        isWithinOffice: isWithinRadius,
        distance,
        source: 'mobile'
      });
    }

    logger.info(`Employee checked in: ${employeeId}`);
    global.io?.emit('attendance:checked_in', { employeeId, time: now, status });

    res.status(201).json({
      success: true,
      message: status === 'late' ? 'تم تسجيل الدخول متأخراً' : 'تم تسجيل الدخول بنجاح',
      data: attendance
    });
  } catch (error) {
    logger.error('Error during check-in', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في تسجيل الدخول'
    });
  }
});

// Check-Out with GPS verification
router.post('/check-out', authMiddleware, async (req, res) => {
  try {
    const { employeeId, latitude, longitude, method = 'gps' } = req.body;
    const now = DateHelper.getCurrentDate();

    const officeConfig = await DeviceOfficeConfig.findOne({ where: { isActive: true } });

    // Find today's attendance record
    const attendance = await Attendance.findOne({
      where: {
        employeeId,
        attendanceDate: {
          [require('sequelize').Op.gte]: moment(now).startOf('day').toDate(),
          [require('sequelize').Op.lte]: moment(now).endOf('day').toDate()
        },
        checkOutTime: null
      }
    });

    if (!attendance) {
      return res.status(400).json({
        success: false,
        message: 'لم يتم تسجيل الدخول اليوم'
      });
    }

    // Calculate work hours
    const workHours = DateHelper.calculateWorkHours(attendance.checkInTime, now);

    // Update attendance record
    await attendance.update({
      checkOutTime: now,
      checkOutLatitude: latitude,
      checkOutLongitude: longitude,
      checkOutMethod: method,
      workHours: Math.round(workHours * 100) / 100
    });

    // Save GPS location for check-out
    if (latitude && longitude) {
      let isWithinOffice = true;
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

      await GPSLocation.create({
        employeeId,
        latitude,
        longitude,
        isWithinOffice,
        distance,
        source: 'mobile'
      });
    }

    logger.info(`Employee checked out: ${employeeId}, work hours: ${workHours}`);
    global.io?.emit('attendance:checked_out', { employeeId, time: now, workHours });

    res.json({
      success: true,
      message: 'تم تسجيل الخروج بنجاح',
      data: {
        ...attendance.toJSON(),
        workHours: Math.round(workHours * 100) / 100
      }
    });
  } catch (error) {
    logger.error('Error during check-out', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في تسجيل الخروج'
    });
  }
});

// Get today's attendance
router.get('/today/:employeeId', authMiddleware, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const today = moment().tz('Africa/Cairo').startOf('day').toDate();

    const attendance = await Attendance.findOne({
      where: {
        employeeId,
        attendanceDate: {
          [require('sequelize').Op.gte]: today
        }
      }
    });

    res.json({
      success: true,
      data: attendance
    });
  } catch (error) {
    logger.error('Error fetching today attendance', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب سجل الحضور'
    });
  }
});

module.exports = router;
