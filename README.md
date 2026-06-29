# نظام إدارة الموظفين - HR Management System
## مع دعم البصمة و GPS

![version](https://img.shields.io/badge/version-1.0.0-blue)
![license](https://img.shields.io/badge/license-MIT-green)
![nodejs](https://img.shields.io/badge/Node.js-%3E%3D14-brightgreen)

---

## 📋 نظرة عامة

نظام متكامل لإدارة الموارد البشرية مع دعم متقدم للبصمات وتتبع الموقع بواسطة GPS. يدعم:

✅ **إدارة الموظفين** - بيانات شاملة للموظفين  
✅ **نظام البصمة** - تسجيل وتحقق من البصمات (بصمة، وجه، قزحية)  
✅ **تتبع GPS** - تحديد موقع الموظفين بدقة  
✅ **الحضور والغياب** - تسجيل تلقائي مع التحقق من المحيط  
✅ **حساب الرواتب** - حساب متقدم مع البدلات والخصومات  
✅ **التقارير المتقدمة** - تقارير PDF و Excel  
✅ **نظام الأمان** - مصادقة وصلاحيات متعددة  
✅ **لوحة التحكم الفورية** - تحديث حي باستخدام Socket.IO  

---

## 🚀 البدء السريع

### المتطلبات
- Node.js >= 14.x
- MySQL >= 5.7
- npm أو yarn

### التثبيت

```bash
# استنساخ المستودع
git clone https://github.com/hr-desktop-app/hr-management-ejs-desktop.git
cd hr-management-ejs-desktop

# تثبيت المتعلقات
npm install

# نسخ ملف البيئة
cp .env.example .env

# تحرير .env وإضافة بيانات قاعدة البيانات
nano .env
```

### إعداد قاعدة البيانات

```bash
# إنشاء قاعدة البيانات
mysql -u root -p
CREATE DATABASE hr_management_db;
USE hr_management_db;

# تطبيق الترحيلات (سيتم إضافتها لاحقاً)
npm run migrate

# إدراج البيانات الأولية
npm run seed
```

### التشغيل

```bash
# وضع التطوير
npm run dev

# الإنتاج
npm start
```

النظام سيعمل على: `http://localhost:3000`

---

## 📦 البنية الأساسية للمشروع

```
hr-management-ejs-desktop/
├── src/
│   ├── controllers/          # منطق العمليات
│   ├── models/               # نماذج قاعدة البيانات
│   ├── routes/               # مسارات API
│   ├── middleware/           # وسيط البرنامج
│   ├── utils/                # دوال مساعدة
│   ├── views/                # واجهات EJS
│   └── socket/               # أحداث Socket.IO
├── public/                   # ملفات ثابتة
│   ├── css/
│   ├── js/
│   └── uploads/              # الملفات المرفوعة
├── database/
│   ├── migrations/           # ترحيلات
│   └── seeds/                # بيانات أولية
├── logs/                     # ملفات السجلات
├── app.js                    # نقطة الدخول
├── package.json
└── .env                      # متغيرات البيئة
```

---

## 🔌 نقاط النهاية الرئيسية (API Endpoints)

### المصادقة
```
POST   /api/auth/register          - تسجيل جديد
POST   /api/auth/login             - تسجيل الدخول
POST   /api/auth/logout            - تسجيل الخروج
```

### الموظفون
```
GET    /api/employees              - قائمة جميع الموظفين
GET    /api/employees/:id          - تفاصيل موظف
POST   /api/employees              - إضافة موظف جديد
PUT    /api/employees/:id          - تعديل بيانات موظف
DELETE /api/employees/:id          - حذف موظف
```

### الحضور والغياب
```
GET    /api/attendance             - سجلات الحضور
POST   /api/attendance/check-in    - تسجيل الدخول
POST   /api/attendance/check-out   - تسجيل الخروج
GET    /api/attendance/today/:id   - حضور اليوم
```

### البصمة
```
GET    /api/biometric              - سجلات البصمة
POST   /api/biometric/record       - تسجيل بصمة
POST   /api/biometric/verify       - التحقق من البصمة
POST   /api/biometric/enroll       - تسجيل موظف جديد
```

### GPS
```
POST   /api/gps/location           - تسجيل موقع
GET    /api/gps/history/:id        - سجل المواقع
GET    /api/gps/status/:id         - الموقع الحالي
GET    /api/gps/in-office/all      - الموظفون في المكتب
```

### الرواتب
```
GET    /api/payroll                - سجلات الرواتب
POST   /api/payroll/calculate      - حساب الراتب
PUT    /api/payroll/:id/status     - تحديث حالة الدفع
GET    /api/payroll/summary/:id    - ملخص الرواتب
```

### الأجهزة
```
GET    /api/devices                - قائمة الأجهزة
POST   /api/devices/register       - تسجيل جهاز جديد
PUT    /api/devices/:id            - تحديث جهاز
POST   /api/devices/office-config  - إعدادات المكتب
GET    /api/devices/office-config/active - الإعدادات الحالية
```

### التقارير
```
GET    /api/reports/attendance     - تقرير الحضور
GET    /api/reports/payroll        - تقرير الرواتب
POST   /api/reports/attendance/export-pdf    - تصدير PDF
POST   /api/reports/payroll/export-excel     - تصدير Excel
```

---

## 🔐 نموذج الأمان

### الأدوار والصلاحيات

| الدور | الصلاحيات |
|-------|----------|
| **Admin** | الوصول الكامل، إدارة النظام، الأجهزة |
| **HR** | إدارة الموظفين، الرواتب، التقارير |
| **Manager** | عرض فريقه، التقارير |
| **Employee** | عرض بياناته الشخصية، الحضور |

### المصادقة
- استخدام JWT tokens
- تجديد توكنات تلقائي
- حماية كلمات المرور بـ bcrypt

### التشفير
- تشفير بيانات البصمة
- توثيق التدقيق (Audit Logs)

---

## 📡 Socket.IO Events

### أحداث البصمة
```javascript
// الخادم يرسل
biometric:started       // بدء المسح
biometric:success       // نجاح البصمة
biometric:failed        // فشل البصمة
biometric:verified      // تم التحقق
biometric:enrolled      // تم التسجيل
biometric:recorded      // تم التسجيل
```

### أحداث GPS
```javascript
gps:location_update     // تحديث الموقع
gps:employee_in_range   // موظف داخل المحيط
gps:employee_out_of_range // موظف خارج المحيط
```

### أحداث الحضور
```javascript
attendance:check_in     // تسجيل دخول
attendance:check_out    // تسجيل خروج
attendance:updated      // تحديث الحضور
```

### أحداث الأجهزة
```javascript
device:connected        // جهاز متصل
device:disconnected     // جهاز قطع
device:error            // خطأ جهاز
device:registered       // جهاز مسجل
device:updated          // جهاز محدث
```

---

## 🎯 مميزات متقدمة

### ✅ التحقق الثنائي من الحضور
1. **التحقق من البصمة**: تسجيل بصمة الموظف
2. **التحقق من GPS**: التأكد من تواجد الموظف بمحيط المكتب

### ✅ حساب الرواتب الذكي
- حساب ساعات العمل تلقائياً
- حساب الإضافي (Overtime)
- خصومات وبدلات مرنة
- حساب الضرائب

### ✅ التقارير الشاملة
- تقارير الحضور والغياب
- تقارير الأداء
- تقارير الرواتب
- تصدير PDF و Excel

### ✅ لوحة التحكم الفورية
- تحديثات حية
- رسوم بيانية
- إشعارات فورية

---

## 📊 نموذج قاعدة البيانات

### الجداول الرئيسية

**users** - المستخدمون
```
id (UUID)
username
email
password
firstName
lastName
role (admin, manager, hr, employee)
isActive
lastLogin
```

**employees** - الموظفون
```
id (UUID)
employeeId (فريد)
firstName
lastName
email
phoneNumber
nationalId
dateOfBirth
gender
position
departmentId
salary
status (active, inactive, on_leave, terminated)
biometricId
```

**attendance** - الحضور
```
id (UUID)
employeeId
attendanceDate
checkInTime
checkOutTime
checkInMethod (biometric, gps, manual, mobile)
checkOutMethod
status (present, late, absent, half_day, on_leave)
workHours
isWithinRadius
```

**biometric_records** - سجلات البصمة
```
id (UUID)
employeeId
biometricType (fingerprint, face, iris, palm)
biometricData (مشفر)
deviceId
recordedAt
isVerified
quality (0-100)
```

**gps_locations** - مواقع GPS
```
id (UUID)
employeeId
latitude
longitude
accuracy
altitude
speed
heading
isWithinOffice
distance
recordedAt
```

**biometric_devices** - أجهزة البصمة
```
id (UUID)
deviceId (فريد)
deviceName
deviceType
manufacturer
model
serialNumber
communicationPort
location
isActive
lastSync
totalUsers
totalRecords
```

**device_office_configs** - إعدادات المكتب
```
id (UUID)
officeName
latitude
longitude
radiusMeters
checkInStartTime
checkInEndTime
expectedCheckOutTime
dailyWorkHours
timezone
```

**payroll** - الرواتب
```
id (UUID)
employeeId
payrollPeriodStart
payrollPeriodEnd
baseSalary
workHours
overtime
bonuses
allowances
deductions
taxes
insurance
grossSalary
netSalary
paymentStatus
paymentDate
```

**leaves** - الإجازات
```
id (UUID)
employeeId
leaveType (annual, sick, maternity, etc)
startDate
endDate
duration
reason
status (pending, approved, rejected)
approvedBy
approvalDate
```

**audit_logs** - سجلات التدقيق
```
id (UUID)
userId
action (CREATE, UPDATE, DELETE)
entityType
entityId
oldValues (JSON)
newValues (JSON)
ipAddress
timestamp
```

---

## 🔧 إعدادات متقدمة

### متغيرات البيئة المهمة

```env
# قاعدة البيانات
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=hr_management_db

# البصمة
BIOMETRIC_DEVICE_PORT=/dev/ttyUSB0
BIOMETRIC_DEVICE_BAUDRATE=115200

# GPS
GPS_OFFICE_LATITUDE=30.0444
GPS_OFFICE_LONGITUDE=31.2357
GPS_OFFICE_RADIUS=500

# الأمان
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
BCRYPT_ROUNDS=10

# البريد الإلكتروني
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=app-password

# المسارات
UPLOAD_PATH=./public/uploads
LOG_FILE_PATH=./logs
```

---

## 📱 التطبيقات المدعومة

### Web Dashboard
- واجهة ويب متجاوبة
- لوحة تحكم فورية
- رسوم بيانية تفاعلية

### Mobile Apps
- تطبيق تسجيل الحضور
- تتبع GPS حي
- التنبيهات الفورية

### Desktop Application
- إدارة أجهزة البصمة
- إدارة الموظفين
- معالجة التقارير

---

## 🐛 معالجة الأخطاء

النظام يستخدم:
- معالجة شاملة للأخطاء
- تسجيل مفصل للأحداث (Logging)
- رسائل خطأ واضحة باللغة العربية
- توثيق جميع العمليات

---

## 📈 الأداء والتحسينات

- ✅ تخزين مؤقت (Caching)
- ✅ معالجة متزامنة
- ✅ فهرسة قاعدة البيانات
- ✅ تحسين الاستعلامات
- ✅ ضغط البيانات

---

## 🤝 المساهمة

نرحب بالمساهمات! يرجى:

1. Fork المشروع
2. إنشاء فرع للميزة الجديدة
3. Commit التغييرات
4. Push الفرع
5. فتح Pull Request

---

## 📄 الترخيص

هذا المشروع مرخص تحت MIT License - انظر [LICENSE](LICENSE) للتفاصيل

---

## 📞 الدعم والتواصل

- **البريد الإلكتروني**: support@hrmanagement.com
- **المشاكل**: Issues على GitHub
- **النقاشات**: Discussions على GitHub

---

## 🎓 الموارد والتوثيق

- [Express.js Documentation](https://expressjs.com)
- [Sequelize ORM](https://sequelize.org)
- [Socket.IO Guide](https://socket.io)
- [MySQL Documentation](https://dev.mysql.com)

---

**تم إنشاؤه بـ ❤️ بواسطة HR Desktop App Team**

آخر تحديث: 2026
