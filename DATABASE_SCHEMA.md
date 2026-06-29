# Database Schema

هذا الملف يوضح هيكل قاعدة البيانات MySQL للنظام

## إنشاء قاعدة البيانات

```sql
CREATE DATABASE IF NOT EXISTS hr_management_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE hr_management_db;
```

## الجداول

### 1. Users Table
```sql
CREATE TABLE users (
  id CHAR(36) PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  role ENUM('admin', 'manager', 'hr', 'employee') DEFAULT 'employee',
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP NULL,
  phone_number VARCHAR(20),
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_email (email),
  INDEX idx_username (username),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2. Employees Table
```sql
CREATE TABLE employees (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36),
  department_id CHAR(36),
  employee_id VARCHAR(50) NOT NULL UNIQUE,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone_number VARCHAR(20) NOT NULL,
  national_id VARCHAR(50) NOT NULL UNIQUE,
  date_of_birth DATE NOT NULL,
  gender ENUM('M', 'F') NOT NULL,
  address TEXT,
  city VARCHAR(255),
  state VARCHAR(255),
  zip_code VARCHAR(20),
  position VARCHAR(255) NOT NULL,
  job_title VARCHAR(255),
  salary DECIMAL(12, 2) DEFAULT 0,
  employment_type ENUM('full_time', 'part_time', 'contract', 'temporary') DEFAULT 'full_time',
  hire_date DATE NOT NULL,
  end_date DATE,
  status ENUM('active', 'inactive', 'on_leave', 'terminated') DEFAULT 'active',
  profile_photo VARCHAR(255),
  biometric_id VARCHAR(255),
  emergency_contact VARCHAR(255),
  emergency_phone VARCHAR(20),
  bank_account VARCHAR(50),
  bank_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  INDEX idx_employee_id (employee_id),
  INDEX idx_status (status),
  INDEX idx_department_id (department_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3. Departments Table
```sql
CREATE TABLE departments (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  manager_id CHAR(36),
  budget DECIMAL(15, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_name (name),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 4. Attendance Table
```sql
CREATE TABLE attendance (
  id CHAR(36) PRIMARY KEY,
  employee_id CHAR(36) NOT NULL,
  attendance_date DATE NOT NULL,
  check_in_time TIMESTAMP,
  check_out_time TIMESTAMP,
  check_in_latitude DECIMAL(10, 8),
  check_in_longitude DECIMAL(11, 8),
  check_out_latitude DECIMAL(10, 8),
  check_out_longitude DECIMAL(11, 8),
  check_in_method ENUM('biometric', 'gps', 'manual', 'mobile') DEFAULT 'biometric',
  check_out_method ENUM('biometric', 'gps', 'manual', 'mobile'),
  status ENUM('present', 'late', 'absent', 'half_day', 'on_leave') DEFAULT 'present',
  work_hours DECIMAL(5, 2),
  is_within_radius BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  INDEX idx_employee_date (employee_id, attendance_date),
  INDEX idx_status (status),
  INDEX idx_attendance_date (attendance_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 5. Biometric Records Table
```sql
CREATE TABLE biometric_records (
  id CHAR(36) PRIMARY KEY,
  employee_id CHAR(36) NOT NULL,
  device_id VARCHAR(255),
  biometric_type ENUM('fingerprint', 'face', 'iris', 'palm') NOT NULL,
  biometric_data LONGTEXT,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_verified BOOLEAN DEFAULT TRUE,
  quality INT CHECK (quality >= 0 AND quality <= 100),
  attempts INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  INDEX idx_employee_type (employee_id, biometric_type),
  INDEX idx_recorded_at (recorded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 6. GPS Locations Table
```sql
CREATE TABLE gps_locations (
  id CHAR(36) PRIMARY KEY,
  employee_id CHAR(36) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(8, 2),
  altitude DECIMAL(10, 2),
  speed DECIMAL(8, 2),
  heading DECIMAL(6, 2),
  is_within_office BOOLEAN DEFAULT FALSE,
  distance DECIMAL(10, 2),
  source ENUM('mobile', 'device', 'external_api') DEFAULT 'mobile',
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  INDEX idx_employee_recorded (employee_id, recorded_at),
  INDEX idx_is_within_office (is_within_office),
  INDEX idx_recorded_at (recorded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 7. Biometric Devices Table
```sql
CREATE TABLE biometric_devices (
  id CHAR(36) PRIMARY KEY,
  device_id VARCHAR(255) NOT NULL UNIQUE,
  device_name VARCHAR(255) NOT NULL,
  device_type ENUM('fingerprint_scanner', 'face_recognition', 'iris_scanner', 'palm_reader', 'multi_modal') NOT NULL,
  manufacturer VARCHAR(255),
  model VARCHAR(255),
  serial_number VARCHAR(255) UNIQUE,
  firmware_version VARCHAR(50),
  communication_port VARCHAR(255),
  baud_rate INT DEFAULT 115200,
  location VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  last_sync TIMESTAMP NULL,
  total_users INT DEFAULT 0,
  total_records INT DEFAULT 0,
  ip_address VARCHAR(45),
  api_key VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_device_id (device_id),
  INDEX idx_is_active (is_active),
  INDEX idx_last_sync (last_sync)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 8. Payroll Table
```sql
CREATE TABLE payroll (
  id CHAR(36) PRIMARY KEY,
  employee_id CHAR(36) NOT NULL,
  payroll_period_start DATE NOT NULL,
  payroll_period_end DATE NOT NULL,
  base_salary DECIMAL(12, 2) NOT NULL,
  work_days INT DEFAULT 0,
  work_hours DECIMAL(8, 2) DEFAULT 0,
  overtime DECIMAL(8, 2) DEFAULT 0,
  overtime_rate DECIMAL(5, 2) DEFAULT 1.5,
  bonuses DECIMAL(12, 2) DEFAULT 0,
  allowances DECIMAL(12, 2) DEFAULT 0,
  deductions DECIMAL(12, 2) DEFAULT 0,
  taxes DECIMAL(12, 2) DEFAULT 0,
  insurance DECIMAL(12, 2) DEFAULT 0,
  gross_salary DECIMAL(12, 2) DEFAULT 0,
  net_salary DECIMAL(12, 2) DEFAULT 0,
  payment_status ENUM('pending', 'processed', 'paid', 'cancelled') DEFAULT 'pending',
  payment_date TIMESTAMP NULL,
  payment_method ENUM('bank_transfer', 'cash', 'check') DEFAULT 'bank_transfer',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  INDEX idx_employee_period (employee_id, payroll_period_start),
  INDEX idx_payment_status (payment_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 9. Leaves Table
```sql
CREATE TABLE leaves (
  id CHAR(36) PRIMARY KEY,
  employee_id CHAR(36) NOT NULL,
  leave_type ENUM('annual', 'sick', 'maternity', 'paternity', 'unpaid', 'emergency') NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration DECIMAL(5, 2),
  reason TEXT NOT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  approved_by VARCHAR(255),
  approval_date TIMESTAMP NULL,
  rejection_reason TEXT,
  documents JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  INDEX idx_employee_status (employee_id, status),
  INDEX idx_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 10. Audit Logs Table
```sql
CREATE TABLE audit_logs (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36),
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(255),
  old_values JSON,
  new_values JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  status ENUM('success', 'failed') DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_created (user_id, created_at),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 11. Device Office Configs Table
```sql
CREATE TABLE device_office_configs (
  id CHAR(36) PRIMARY KEY,
  office_name VARCHAR(255) NOT NULL UNIQUE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  radius_meters INT DEFAULT 500,
  check_in_start_time TIME,
  check_in_end_time TIME,
  expected_check_out_time TIME,
  daily_work_hours DECIMAL(5, 2) DEFAULT 8,
  allow_remote_work BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  timezone VARCHAR(50) DEFAULT 'Africa/Cairo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_is_active (is_active),
  INDEX idx_office_name (office_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Indexes Strategy

```sql
-- Performance Indexes
CREATE INDEX idx_attendance_employee_date ON attendance(employee_id, attendance_date);
CREATE INDEX idx_gps_employee_time ON gps_locations(employee_id, recorded_at);
CREATE INDEX idx_payroll_employee_period ON payroll(employee_id, payroll_period_start);
CREATE INDEX idx_biometric_employee_type ON biometric_records(employee_id, biometric_type);
```

## إضافة بيانات أولية

```sql
-- Default Admin User
INSERT INTO users (id, username, email, password, first_name, last_name, role) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'admin', 'admin@hrmanagement.com', '$2a$10$...', 'Admin', 'User', 'admin');

-- Default Department
INSERT INTO departments (id, name, description, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'IT', 'Information Technology', TRUE),
('550e8400-e29b-41d4-a716-446655440002', 'HR', 'Human Resources', TRUE);

-- Default Office Config
INSERT INTO device_office_configs (id, office_name, latitude, longitude, radius_meters, check_in_start_time, check_in_end_time, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440003', 'Cairo HQ', 30.0444, 31.2357, 500, '07:00:00', '10:00:00', TRUE);
```

---

آخر تحديث: 2026
