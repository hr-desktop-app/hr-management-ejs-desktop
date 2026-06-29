const crypto = require('crypto');
const moment = require('moment-timezone');
const geolib = require('geolib');

class ValidationHelper {
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePhoneNumber(phone) {
    const phoneRegex = /^[0-9]{10,15}$/;
    return phoneRegex.test(phone.replace(/[\s-]/g, ''));
  }

  static validateNationalId(id) {
    return id && id.length >= 10 && id.length <= 20;
  }

  static validateGPS(latitude, longitude) {
    return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
  }

  static validatePassword(password) {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  static validateDateRange(startDate, endDate) {
    const start = moment(startDate);
    const end = moment(endDate);
    return end.isAfter(start);
  }

  static isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}

class DateHelper {
  static getCurrentDate() {
    return moment().tz('Africa/Cairo').toDate();
  }

  static getFormattedDate(date, format = 'YYYY-MM-DD') {
    return moment(date).tz('Africa/Cairo').format(format);
  }

  static calculateWorkHours(checkIn, checkOut) {
    const start = moment(checkIn);
    const end = moment(checkOut);
    return end.diff(start, 'hours', true);
  }

  static isLateCheckIn(checkInTime, officeCheckInEndTime) {
    const checkIn = moment(checkInTime).tz('Africa/Cairo');
    const endTime = moment(officeCheckInEndTime, 'HH:mm').tz('Africa/Cairo');
    return checkIn.isAfter(endTime);
  }

  static getDayOfWeek(date) {
    return moment(date).tz('Africa/Cairo').format('dddd');
  }
}

class GPSHelper {
  static calculateDistance(lat1, lon1, lat2, lon2) {
    return geolib.getDistance(
      { latitude: lat1, longitude: lon1 },
      { latitude: lat2, longitude: lon2 }
    );
  }

  static isWithinRadius(employeeLat, employeeLon, officeLat, officeLon, radiusMeters) {
    const distance = this.calculateDistance(
      employeeLat,
      employeeLon,
      officeLat,
      officeLon
    );
    return distance <= radiusMeters;
  }

  static getLocationAddress(latitude, longitude) {
    // This can be integrated with Google Maps API later
    return `${latitude}, ${longitude}`;
  }

  static validateGPSAccuracy(accuracy, threshold = 50) {
    return accuracy <= threshold;
  }
}

class BiometricHelper {
  static encryptBiometricData(data) {
    const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY || 'default-key');
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  static decryptBiometricData(encryptedData) {
    try {
      const decipher = crypto.createDecipher('aes-256-cbc', process.env.ENCRYPTION_KEY || 'default-key');
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      return null;
    }
  }

  static generateBiometricHash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}

class PayrollHelper {
  static calculateGrossSalary(baseSalary, bonuses, allowances) {
    return parseFloat(baseSalary) + parseFloat(bonuses) + parseFloat(allowances);
  }

  static calculateNetSalary(grossSalary, deductions, taxes, insurance) {
    return parseFloat(grossSalary) - parseFloat(deductions) - parseFloat(taxes) - parseFloat(insurance);
  }

  static calculateOvertimePay(overtimeHours, hourlyRate, overtimeMultiplier = 1.5) {
    return overtimeHours * hourlyRate * overtimeMultiplier;
  }

  static calculateDailyRate(monthlySalary, workDaysPerMonth = 21) {
    return monthlySalary / workDaysPerMonth;
  }

  static calculateHourlyRate(monthlySalary, workHoursPerMonth = 168) {
    return monthlySalary / workHoursPerMonth;
  }
}

class StringHelper {
  static generateEmployeeId() {
    return `EMP-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  }

  static generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  static truncateString(str, maxLength, suffix = '...') {
    return str.length > maxLength ? str.substring(0, maxLength - suffix.length) + suffix : str;
  }

  static slugify(str) {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}

module.exports = {
  ValidationHelper,
  DateHelper,
  GPSHelper,
  BiometricHelper,
  PayrollHelper,
  StringHelper
};
