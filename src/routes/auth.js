const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { validateEmail, validatePassword, handleValidationErrors } = require('../utils/validators');
const logger = require('../utils/logger');

// Login
router.post('/login', [
  validateEmail(),
  validatePassword(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'بيانات الدخول غير صحيحة'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'بيانات الدخول غير صحيحة'
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    user.lastLogin = new Date();
    await user.save();

    logger.info(`User logged in: ${user.email}`);

    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    logger.error('Login error', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في تسجيل الدخول'
    });
  }
});

// Register
router.post('/register', [
  validateEmail(),
  validatePassword(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { email, password, username, firstName, lastName } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني مستخدم بالفعل'
      });
    }

    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS || 10));

    const user = await User.create({
      email,
      username,
      firstName,
      lastName,
      password: hashedPassword,
      role: 'employee'
    });

    logger.info(`New user registered: ${email}`);

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح',
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    });
  } catch (error) {
    logger.error('Registration error', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في إنشاء الحساب'
    });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'تم تسجيل الخروج بنجاح'
  });
});

module.exports = router;
