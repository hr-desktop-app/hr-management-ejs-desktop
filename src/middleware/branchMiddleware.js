const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { User, Branch, Employee } = require('../models');

// التحقق من أن المستخدم من نفس الفرع
const branchMiddleware = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'يجب تسجيل الدخول أولاً'
      });
    }

    // Admin يمكنه الوصول إلى جميع الفروع
    if (req.user.role === 'admin') {
      return next();
    }

    // جميع المستخدمين لهم branchId
    const user = await User.findByPk(req.user.id, {
      include: [{
        model: Employee,
        attributes: ['branchId']
      }]
    });

    if (!user || !user.Employee) {
      return res.status(403).json({
        success: false,
        message: 'لم يتم العثور على بيانات الموظف'
      });
    }

    // حفظ branchId في الطلب
    req.branchId = user.Employee.branchId;
    req.userBranch = user.Employee.branchId;

    // التحقق من الطلب - إذا كان يتضمن branchId معين
    if (req.body.branchId && req.body.branchId !== req.branchId) {
      return res.status(403).json({
        success: false,
        message: 'لا يمكنك الوصول إلى بيانات فرع آخر'
      });
    }

    next();
  } catch (error) {
    logger.error('Branch middleware error', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'خطأ في التحقق من الصلاحيات'
    });
  }
};

// فقط Admin و HR Manager للفرع
const branchHRMiddleware = (req, res, next) => {
  if (req.user.role === 'admin') {
    return next();
  }

  if (req.user.role !== 'hr' && req.user.role !== 'manager') {
    return res.status(403).json({
      success: false,
      message: 'ليس لديك صلاحية إجراء هذه العملية'
    });
  }

  next();
};

module.exports = {
  branchMiddleware,
  branchHRMiddleware
};
