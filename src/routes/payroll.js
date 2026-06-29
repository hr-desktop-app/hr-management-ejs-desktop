const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const logger = require('../utils/logger');
const { Payroll, Employee } = require('../models');
const { PayrollHelper, DateHelper } = require('../utils/helpers');
const moment = require('moment-timezone');

// Get payroll records
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { employeeId, status, year, month } = req.query;
    const where = {};

    if (employeeId) where.employeeId = employeeId;
    if (status) where.paymentStatus = status;

    if (year && month) {
      const startDate = moment(`${year}-${month}`, 'YYYY-MM').startOf('month').toDate();
      const endDate = moment(`${year}-${month}`, 'YYYY-MM').endOf('month').toDate();
      where.payrollPeriodStart = { [require('sequelize').Op.gte]: startDate };
      where.payrollPeriodEnd = { [require('sequelize').Op.lte]: endDate };
    }

    const payrolls = await Payroll.findAll({
      where,
      include: [{ model: Employee, attributes: ['employeeId', 'firstName', 'lastName', 'email'] }],
      order: [['payrollPeriodEnd', 'DESC']]
    });

    res.json({
      success: true,
      data: payrolls
    });
  } catch (error) {
    logger.error('Error fetching payroll records', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب سجلات الرواتب'
    });
  }
});

// Create/Calculate payroll
router.post('/calculate', authMiddleware, roleMiddleware(['admin', 'hr']), async (req, res) => {
  try {
    const {
      employeeId,
      payrollPeriodStart,
      payrollPeriodEnd,
      workDays,
      bonuses = 0,
      allowances = 0,
      deductions = 0,
      taxes = 0,
      insurance = 0
    } = req.body;

    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'الموظف غير موجود'
      });
    }

    // Get attendance records for period
    const { Attendance } = require('../models');
    const attendanceRecords = await Attendance.findAll({
      where: {
        employeeId,
        attendanceDate: {
          [require('sequelize').Op.between]: [
            new Date(payrollPeriodStart),
            new Date(payrollPeriodEnd)
          ]
        }
      }
    });

    // Calculate work hours
    let totalWorkHours = 0;
    let overtimeHours = 0;
    const expectedHoursPerMonth = 160; // 8 hours × 20 working days

    attendanceRecords.forEach(record => {
      if (record.workHours) {
        if (record.workHours > 8) {
          overtimeHours += (record.workHours - 8);
          totalWorkHours += 8;
        } else {
          totalWorkHours += record.workHours;
        }
      }
    });

    // Calculate salary components
    const baseSalary = employee.salary || 0;
    const overtimePay = PayrollHelper.calculateOvertimePay(
      overtimeHours,
      baseSalary / expectedHoursPerMonth,
      1.5
    );

    const grossSalary = PayrollHelper.calculateGrossSalary(
      baseSalary,
      parseFloat(bonuses) + overtimePay,
      allowances
    );

    const netSalary = PayrollHelper.calculateNetSalary(
      grossSalary,
      deductions,
      taxes,
      insurance
    );

    const payroll = await Payroll.create({
      employeeId,
      payrollPeriodStart: new Date(payrollPeriodStart),
      payrollPeriodEnd: new Date(payrollPeriodEnd),
      baseSalary,
      workDays,
      workHours: totalWorkHours,
      overtime: overtimeHours,
      bonuses: parseFloat(bonuses),
      allowances: parseFloat(allowances),
      deductions: parseFloat(deductions),
      taxes: parseFloat(taxes),
      insurance: parseFloat(insurance),
      grossSalary,
      netSalary,
      paymentStatus: 'pending'
    });

    logger.info(`Payroll calculated for employee: ${employeeId}`);

    res.status(201).json({
      success: true,
      message: 'تم حساب الراتب بنجاح',
      data: payroll
    });
  } catch (error) {
    logger.error('Error calculating payroll', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في حساب الراتب'
    });
  }
});

// Update payroll status
router.put('/:id/status', authMiddleware, roleMiddleware(['admin', 'hr']), async (req, res) => {
  try {
    const { status, paymentDate } = req.body;

    const payroll = await Payroll.findByPk(req.params.id);
    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'سجل الراتب غير موجود'
      });
    }

    await payroll.update({
      paymentStatus: status,
      paymentDate: status === 'paid' ? (paymentDate || new Date()) : payroll.paymentDate
    });

    logger.info(`Payroll status updated for record: ${req.params.id}`);
    global.io?.emit('payroll:updated', { payrollId: req.params.id, status });

    res.json({
      success: true,
      message: 'تم تحديث حالة الراتب بنجاح',
      data: payroll
    });
  } catch (error) {
    logger.error('Error updating payroll', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث الراتب'
    });
  }
});

// Get payroll summary
router.get('/summary/:employeeId', authMiddleware, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { year, month } = req.query;

    const where = { employeeId };

    if (year && month) {
      const startDate = moment(`${year}-${month}`, 'YYYY-MM').startOf('month').toDate();
      const endDate = moment(`${year}-${month}`, 'YYYY-MM').endOf('month').toDate();
      where.payrollPeriodStart = { [require('sequelize').Op.gte]: startDate };
      where.payrollPeriodEnd = { [require('sequelize').Op.lte]: endDate };
    }

    const payrolls = await Payroll.findAll({ where });

    const summary = {
      totalGross: 0,
      totalNet: 0,
      totalBonuses: 0,
      totalDeductions: 0,
      totalTaxes: 0,
      paymentsPending: 0,
      paymentsPaid: 0
    };

    payrolls.forEach(p => {
      summary.totalGross += p.grossSalary || 0;
      summary.totalNet += p.netSalary || 0;
      summary.totalBonuses += p.bonuses || 0;
      summary.totalDeductions += p.deductions || 0;
      summary.totalTaxes += p.taxes || 0;
      if (p.paymentStatus === 'pending') summary.paymentsPending++;
      if (p.paymentStatus === 'paid') summary.paymentsPaid++;
    });

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    logger.error('Error fetching payroll summary', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب ملخص الرواتب'
    });
  }
});

module.exports = router;
