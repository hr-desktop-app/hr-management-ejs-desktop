# HR Management System - API Documentation

## Table of Contents
1. [Authentication](#authentication)
2. [Employees](#employees)
3. [Attendance](#attendance)
4. [Biometric](#biometric)
5. [GPS](#gps)
6. [Payroll](#payroll)
7. [Reports](#reports)
8. [Devices](#devices)

---

## Authentication

### Login
**POST** `/api/auth/login`

Request:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

Response:
```json
{
  "success": true,
  "message": "تم تسجيل الدخول بنجاح",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "role": "employee",
    "firstName": "Ahmed",
    "lastName": "Ali"
  }
}
```

---

## Employees

### Get All Employees
**GET** `/api/employees`

Headers:
```
Authorization: Bearer {token}
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "employeeId": "EMP-1629811200000-ABC12",
      "firstName": "Ahmed",
      "lastName": "Ali",
      "email": "ahmed@example.com",
      "phoneNumber": "201001234567",
      "position": "Software Engineer",
      "salary": 5000,
      "status": "active",
      "biometricId": "BIO-123"
    }
  ]
}
```

### Create Employee
**POST** `/api/employees`

Request:
```json
{
  "firstName": "Ahmed",
  "lastName": "Ali",
  "email": "ahmed@example.com",
  "phoneNumber": "201001234567",
  "nationalId": "12345678901234",
  "dateOfBirth": "1990-01-15",
  "gender": "M",
  "position": "Software Engineer",
  "departmentId": "550e8400-e29b-41d4-a716-446655440001",
  "hireDate": "2023-01-01",
  "salary": 5000,
  "employmentType": "full_time"
}
```

---

## Attendance

### Check In (with GPS)
**POST** `/api/attendance/check-in`

Request:
```json
{
  "employeeId": "550e8400-e29b-41d4-a716-446655440000",
  "latitude": 30.0444,
  "longitude": 31.2357,
  "method": "gps"
}
```

Response:
```json
{
  "success": true,
  "message": "تم تسجيل الدخول بنجاح",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "employeeId": "550e8400-e29b-41d4-a716-446655440000",
    "checkInTime": "2024-01-15T08:30:00Z",
    "checkInLatitude": 30.0444,
    "checkInLongitude": 31.2357,
    "checkInMethod": "gps",
    "status": "present",
    "isWithinRadius": true
  }
}
```

### Check Out
**POST** `/api/attendance/check-out`

Request:
```json
{
  "employeeId": "550e8400-e29b-41d4-a716-446655440000",
  "latitude": 30.0444,
  "longitude": 31.2357,
  "method": "gps"
}
```

---

## Biometric

### Record Biometric
**POST** `/api/biometric/record`

Request:
```json
{
  "employeeId": "550e8400-e29b-41d4-a716-446655440000",
  "biometricType": "fingerprint",
  "biometricData": "base64_encoded_data_here",
  "deviceId": "DEVICE-001",
  "quality": 95,
  "attempts": 1
}
```

### Verify Biometric
**POST** `/api/biometric/verify`

Request:
```json
{
  "employeeId": "550e8400-e29b-41d4-a716-446655440000",
  "biometricType": "fingerprint",
  "biometricData": "base64_encoded_data_here"
}
```

Response:
```json
{
  "success": true,
  "message": "تم التحقق من البصمة بنجاح",
  "isMatch": true
}
```

### Enroll Employee
**POST** `/api/biometric/enroll`

Request:
```json
{
  "employeeId": "550e8400-e29b-41d4-a716-446655440000",
  "biometricType": "fingerprint",
  "biometricData": "base64_encoded_data_here",
  "deviceId": "DEVICE-001"
}
```

---

## GPS

### Log Location
**POST** `/api/gps/location`

Request:
```json
{
  "employeeId": "550e8400-e29b-41d4-a716-446655440000",
  "latitude": 30.0444,
  "longitude": 31.2357,
  "accuracy": 25,
  "altitude": 50,
  "speed": 0,
  "heading": 180
}
```

Response:
```json
{
  "success": true,
  "message": "أنت داخل محيط المكتب",
  "data": {
    "latitude": 30.0444,
    "longitude": 31.2357,
    "isWithinOffice": true,
    "distance": 45
  }
}
```

### Get Location History
**GET** `/api/gps/history/{employeeId}?limit=100&offset=0&startDate=2024-01-01&endDate=2024-01-31`

### Get Current Status
**GET** `/api/gps/status/{employeeId}`

Response:
```json
{
  "success": true,
  "data": {
    "latitude": 30.0444,
    "longitude": 31.2357,
    "isWithinOffice": true,
    "distance": 45,
    "accuracy": 25,
    "lastUpdate": "2024-01-15T15:30:00Z"
  }
}
```

### Get Employees In Office
**GET** `/api/gps/in-office/all`

---

## Payroll

### Calculate Payroll
**POST** `/api/payroll/calculate`

Request:
```json
{
  "employeeId": "550e8400-e29b-41d4-a716-446655440000",
  "payrollPeriodStart": "2024-01-01",
  "payrollPeriodEnd": "2024-01-31",
  "workDays": 20,
  "bonuses": 500,
  "allowances": 300,
  "deductions": 100,
  "taxes": 150,
  "insurance": 100
}
```

Response:
```json
{
  "success": true,
  "message": "تم حساب الراتب بنجاح",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "employeeId": "550e8400-e29b-41d4-a716-446655440000",
    "baseSalary": 5000,
    "bonuses": 500,
    "allowances": 300,
    "deductions": 100,
    "taxes": 150,
    "insurance": 100,
    "grossSalary": 5800,
    "netSalary": 5450,
    "paymentStatus": "pending"
  }
}
```

---

## Reports

### Get Attendance Report
**GET** `/api/reports/attendance?startDate=2024-01-01&endDate=2024-01-31&status=present`

Response:
```json
{
  "success": true,
  "data": [],
  "stats": {
    "totalRecords": 20,
    "present": 18,
    "late": 2,
    "absent": 0,
    "onLeave": 0,
    "halfDay": 0
  }
}
```

### Export Attendance to PDF
**POST** `/api/reports/attendance/export-pdf`

Request:
```json
{
  "startDate": "2024-01-01",
  "endDate": "2024-01-31"
}
```

Response:
```json
{
  "success": true,
  "message": "تم إنشاء التقرير بنجاح",
  "fileUrl": "/uploads/attendance-report-1234567890.pdf"
}
```

---

## Devices

### Get All Devices
**GET** `/api/devices`

### Register Device
**POST** `/api/devices/register`

Request:
```json
{
  "deviceName": "Main Entrance Fingerprint Scanner",
  "deviceId": "DEVICE-001",
  "deviceType": "fingerprint_scanner",
  "manufacturer": "ZKTeco",
  "model": "ZK4500",
  "serialNumber": "SN-12345",
  "communicationPort": "/dev/ttyUSB0",
  "location": "Main Entrance",
  "ipAddress": "192.168.1.100"
}
```

### Configure Office Location
**POST** `/api/devices/office-config`

Request:
```json
{
  "officeName": "Cairo HQ",
  "latitude": 30.0444,
  "longitude": 31.2357,
  "radiusMeters": 500,
  "checkInStartTime": "07:00",
  "checkInEndTime": "10:00",
  "expectedCheckOutTime": "17:00",
  "dailyWorkHours": 8,
  "timezone": "Africa/Cairo"
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "message": "رسالة الخطأ",
  "errors": []
}
```

### Status Codes
- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

---

## Rate Limiting

جميع نقاط النهاية محمية برسائل التخثير:
- **الحد الأقصى**: 100 طلب لكل 15 دقيقة
- رمز الحالة: `429` عند تجاوز الحد

---

## Authentication Headers

جميع الطلبات (ما عدا `/auth`) يجب أن تتضمن:

```
Authorization: Bearer {token}
Content-Type: application/json
```

---

آخر تحديث: 2026
