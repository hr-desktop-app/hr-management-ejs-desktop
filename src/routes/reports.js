const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const logger = require('../utils/logger');
const { Attendance, Employee, Payroll } = require('../models');
const moment = require('moment-timezone');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

// Attendance Report
router.get('/attendance', authMiddleware, roleMiddleware(['admin', 'hr', 'manager']), async (req, res) => {
  try {
    const { startDate, endDate, departmentId, status } = req.query;
    const where = {};

    if (status) where.status = status;

    if (startDate && endDate) {
      where.attendanceDate = {
        [require('sequelize').Op.between]: [
          new Date(startDate),
          new Date(endDate)
        ]
      };
    }

    const records = await Attendance.findAll({
      where,
      include: [
        {
          model: Employee,
          attributes: ['id', 'employeeId', 'firstName', 'lastName', 'departmentId'],
          where: departmentId ? { departmentId } : undefined
        }
      ],
      order: [['attendanceDate', 'DESC']]
    });

    // Calculate statistics
    const stats = {
      totalRecords: records.length,
      present: records.filter(r => r.status === 'present').length,
      late: records.filter(r => r.status === 'late').length,
      absent: records.filter(r => r.status === 'absent').length,
      onLeave: records.filter(r => r.status === 'on_leave').length,
      halfDay: records.filter(r => r.status === 'half_day').length
    };

    res.json({
      success: true,
      data: records,
      stats
    });
  } catch (error) {
    logger.error('Error generating attendance report', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في إنشاء تقرير الحضور'
    });
  }
});

// Payroll Report
router.get('/payroll', authMiddleware, roleMiddleware(['admin', 'hr']), async (req, res) => {
  try {
    const { year, month, departmentId } = req.query;
    const where = {};

    if (year && month) {
      const startDate = moment(`${year}-${month}`, 'YYYY-MM').startOf('month').toDate();
      const endDate = moment(`${year}-${month}`, 'YYYY-MM').endOf('month').toDate();
      where.payrollPeriodStart = { [require('sequelize').Op.gte]: startDate };
      where.payrollPeriodEnd = { [require('sequelize').Op.lte]: endDate };
    }

    const records = await Payroll.findAll({
      where,
      include: [
        {
          model: Employee,
          attributes: ['id', 'employeeId', 'firstName', 'lastName', 'departmentId', 'position'],
          where: departmentId ? { departmentId } : undefined
        }
      ]
    });

    // Calculate totals
    const totals = {
      totalGross: 0,
      totalNet: 0,
      totalBonuses: 0,
      totalDeductions: 0,
      totalTaxes: 0
    };

    records.forEach(r => {
      totals.totalGross += parseFloat(r.grossSalary) || 0;
      totals.totalNet += parseFloat(r.netSalary) || 0;
      totals.totalBonuses += parseFloat(r.bonuses) || 0;
      totals.totalDeductions += parseFloat(r.deductions) || 0;
      totals.totalTaxes += parseFloat(r.taxes) || 0;
    });

    res.json({
      success: true,
      data: records,
      totals,
      count: records.length
    });
  } catch (error) {
    logger.error('Error generating payroll report', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في إنشاء تقرير الرواتب'
    });
  }
});

// Export Attendance Report to PDF
router.post('/attendance/export-pdf', authMiddleware, roleMiddleware(['admin', 'hr', 'manager']), async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    const records = await Attendance.findAll({
      where: {
        attendanceDate: {
          [require('sequelize').Op.between]: [
            new Date(startDate),
            new Date(endDate)
          ]
        }
      },
      include: [{ model: Employee, attributes: ['employeeId', 'firstName', 'lastName'] }],
      order: [['attendanceDate', 'DESC']]
    });

    const doc = new PDFDocument();
    const fileName = `attendance-report-${Date.now()}.pdf`;
    const filePath = path.join(process.env.UPLOAD_PATH || './public/uploads', fileName);

    doc.pipe(fs.createWriteStream(filePath));

    // Header
    doc.fontSize(20).text('تقرير الحضور والغياب', { align: 'center' });
    doc.fontSize(12).text(`من ${startDate} إلى ${endDate}`, { align: 'center' });
    doc.moveDown();

    // Table
    const columns = ['Employee ID', 'Name', 'Date', 'Check In', 'Check Out', 'Status', 'Hours'];
    let y = doc.y;

    columns.forEach((col, i) => {
      doc.text(col, 50 + i * 80, y, { width: 80 });
    });

    y += 20;
    records.forEach(record => {
      if (y > 750) {
        doc.addPage();
        y = 50;
      }
      doc.text(record.Employee.employeeId, 50, y);
      doc.text(record.Employee.firstName, 130, y);
      doc.text(moment(record.attendanceDate).format('YYYY-MM-DD'), 210, y);
      doc.text(moment(record.checkInTime).format('HH:mm'), 290, y);
      doc.text(record.checkOutTime ? moment(record.checkOutTime).format('HH:mm') : '-', 370, y);
      doc.text(record.status, 450, y);
      doc.text(record.workHours ? record.workHours.toFixed(2) : '-', 530, y);
      y += 15;
    });

    doc.end();

    res.json({
      success: true,
      message: 'تم إنشاء التقرير بنجاح',
      fileUrl: `/uploads/${fileName}`
    });
  } catch (error) {
    logger.error('Error exporting attendance PDF', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في تصدير التقرير'
    });
  }
});

// Export Payroll Report to Excel
router.post('/payroll/export-excel', authMiddleware, roleMiddleware(['admin', 'hr']), async (req, res) => {
  try {
    const { year, month } = req.body;

    const startDate = moment(`${year}-${month}`, 'YYYY-MM').startOf('month').toDate();
    const endDate = moment(`${year}-${month}`, 'YYYY-MM').endOf('month').toDate();

    const records = await Payroll.findAll({
      where: {
        payrollPeriodStart: { [require('sequelize').Op.gte]: startDate },
        payrollPeriodEnd: { [require('sequelize').Op.lte]: endDate }
      },
      include: [{ model: Employee, attributes: ['employeeId', 'firstName', 'lastName', 'position'] }]
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Payroll');

    // Headers
    worksheet.columns = [
      { header: 'Employee ID', key: 'employeeId', width: 15 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Position', key: 'position', width: 20 },
      { header: 'Base Salary', key: 'baseSalary', width: 15 },
      { header: 'Bonuses', key: 'bonuses', width: 15 },
      { header: 'Allowances', key: 'allowances', width: 15 },
      { header: 'Deductions', key: 'deductions', width: 15 },
      { header: 'Taxes', key: 'taxes', width: 15 },
      { header: 'Gross Salary', key: 'grossSalary', width: 15 },
      { header: 'Net Salary', key: 'netSalary', width: 15 }
    ];

    // Data
    records.forEach(record => {
      worksheet.addRow({
        employeeId: record.Employee.employeeId,
        name: `${record.Employee.firstName} ${record.Employee.lastName}`,
        position: record.Employee.position,
        baseSalary: record.baseSalary,
        bonuses: record.bonuses,
        allowances: record.allowances,
        deductions: record.deductions,
        taxes: record.taxes,
        grossSalary: record.grossSalary,
        netSalary: record.netSalary
      });
    });

    const fileName = `payroll-report-${year}-${month}-${Date.now()}.xlsx`;
    const filePath = path.join(process.env.UPLOAD_PATH || './public/uploads', fileName);

    await workbook.xlsx.writeFile(filePath);

    logger.info(`Payroll report exported: ${fileName}`);

    res.json({
      success: true,
      message: 'تم تصدير التقرير بنجاح',
      fileUrl: `/uploads/${fileName}`
    });
  } catch (error) {
    logger.error('Error exporting payroll Excel', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في تصدير التقرير'
    });
  }
});

module.exports = router;
