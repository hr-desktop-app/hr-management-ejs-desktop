const { body, validationResult, param } = require('express-validator');
const { ValidationHelper } = require('./helpers');

const validateEmail = () => body('email').isEmail().normalizeEmail();

const validatePassword = () =>
  body('password')
    .custom(ValidationHelper.validatePassword)
    .withMessage('كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل، حرف كبير، حرف صغير، رقم، ورمز خاص');

const validatePhoneNumber = () =>
  body('phoneNumber')
    .custom(ValidationHelper.validatePhoneNumber)
    .withMessage('رقم الهاتف غير صحيح');

const validateNationalId = () =>
  body('nationalId')
    .custom(ValidationHelper.validateNationalId)
    .withMessage('رقم الهوية غير صحيح');

const validateGPS = () => [
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('خط العرض يجب أن يكون بين -90 و 90'),
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('خط الطول يجب أن يكون بين -180 و 180')
];

const validateDateRange = () => [
  body('startDate').isISO8601().withMessage('تاريخ البداية غير صحيح'),
  body('endDate')
    .isISO8601()
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startDate)) {
        throw new Error('تاريخ النهاية يجب أن يكون بعد تاريخ البداية');
      }
      return true;
    })
    .withMessage('تاريخ النهاية يجب أن يكون بعد تاريخ البداية')
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'خطأ في التحقق من البيانات',
      errors: errors.array()
    });
  }
  next();
};

module.exports = {
  validateEmail,
  validatePassword,
  validatePhoneNumber,
  validateNationalId,
  validateGPS,
  validateDateRange,
  handleValidationErrors
};
