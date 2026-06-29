# نظام إدارة الموارد البشرية - دليل الميزات الجديدة
## Multi-Branch HR Management System

---

## 📋 نظرة عامة على الميزات الجديدة

### ✅ 1. نظام الفروع المتعددة (Multi-Branch System)

كل موظف أو مسؤول يرى بيانات فرعه فقط:

```
🏢 الفرع الرئيسي (القاهرة)
├─ 50 موظف
├─ 5 أقسام
└─ بيانات مستقلة تماماً

🏢 فرع الإسكندرية
├─ 30 موظف
├─ 3 أقسام
└─ بيانات مستقلة تماماً

🏢 فرع الجيزة
├─ 20 موظف
├─ 2 قسم
└─ بيانات مستقلة تماماً
```

**الميزات:**
- كل فرع له موقع GPS خاص (إحداثيات ونطاق)
- كل فرع له مدير رئيسي
- كل فرع له مسؤول شئون عاملين
- كل فرع له وكيل (نائب مدير)
- عزل كامل للبيانات بين الفروع

---

### ✅ 2. نظام الإجازات المتقدم (Leave Management System)

#### أ) أنواع الإجازات المرنة

كل فرع يمكنه تحديد أنواع إجازاته الخاصة:

```json
{
  "leaveTypes": [
    {
      "typeName": "عارضة",
      "typeCode": "CASUAL",
      "defaultDays": 0,
      "requiresAttachments": false,
      "color": "#3498db"
    },
    {
      "typeName": "اعتيادية",
      "typeCode": "ANNUAL",
      "defaultDays": 21,
      "requiresAttachments": false,
      "color": "#2ecc71"
    },
    {
      "typeName": "مرضية",
      "typeCode": "MEDICAL",
      "defaultDays": 0,
      "requiresAttachments": true,
      "color": "#e74c3c"
    },
    {
      "typeName": "عارضة (زواج)",
      "typeCode": "MARRIAGE",
      "defaultDays": 3,
      "requiresAttachments": true,
      "color": "#f39c12"
    }
  ]
}
```

#### ب) إدارة أرصدة الإجازات

**تحديد الرصيد للموظف:**

```http
POST /api/leave-balances/set-balance
Content-Type: application/json

{
  "employeeId": "emp-uuid",
  "leaveTypeId": "leave-type-uuid",
  "totalDays": 21,
  "year": 2024
}
```

**الرصيد يتضمن:**
- `totalDays`: إجمالي الأيام المتاحة
- `usedDays`: الأيام المستخدمة (موافق عليها)
- `pendingDays`: الأيام قيد الانتظار (قيد المراجعة)
- `remainingDays`: الأيام المتبقية (حسابي)

#### ج) نظام المراجعة والموافقات (3 مستويات)

**المستوى الأول: مسؤول شئون العاملين**
```
POST /api/leaves/approve/hr-manager/:leaveId
POST /api/leaves/reject/hr-manager/:leaveId
```

**المستوى الثاني: الوكيل (نائب المدير)**
```
POST /api/leaves/approve/deputy/:leaveId
POST /api/leaves/reject/deputy/:leaveId
```

**المستوى الثالث: المدير**
```
POST /api/leaves/approve/manager/:leaveId
POST /api/leaves/reject/manager/:leaveId
```

**مسار الموافقة:**
```
┌─────────────────────────────────────────┐
│   موظف يقدم طلب إجازة                 │
└──────────────┬──────────────────────────┘
               ↓
    ┌──────────────────────────┐
    │ مسؤول شئون العاملين     │
    │ (يراجع ويوافق/يرفض)   │
    └──────────┬───────────────┘
               ↓
    ┌──────────────────────────┐
    │ الوكيل (نائب المدير)    │
    │ (يراجع ويوافق/يرفض)   │
    └──────────┬───────────────┘
               ↓
    ┌──────────────────────────┐
    │ المدير                   │
    │ (الموافقة النهائية)    │
    └──────────┬───────────────┘
               ↓
    ✅ تمت الموافقة و خصم الأيام
    ❌ تم الرفض و إرجاع الأيام
```

---

### ✅ 3. نظام الأذونات المتقدم (Permission Management System)

#### أ) أنواع الأذونات

```json
{
  "permissionTypes": [
    {
      "typeName": "أذن صباحي",
      "typeCode": "MORNING",
      "permissionTime": "morning"
    },
    {
      "typeName": "أذن مسائي",
      "typeCode": "AFTERNOON",
      "permissionTime": "afternoon"
    }
  ]
}
```

#### ب) رصيد الأذونات الشهري

**التوزيع الافتراضي:**
- كل موظف يحصل على **2 أذن فقط** في الشهر (صباحي أو مسائي)
- يمكن لمسؤول الفرع تعديل هذا الرقم

**إحصائيات الأذن:**
- `allocatedPermissions`: الأذونات المخصصة (2 بشكل افتراضي)
- `usedPermissions`: الأذونات المستخدمة (موافق عليها)
- `pendingPermissions`: الأذونات قيد المراجعة
- `remainingPermissions`: الأذونات المتبقية

```http
GET /api/permission-balances?month=1&year=2024

Response:
{
  "success": true,
  "data": [
    {
      "employeeId": "emp-001",
      "month": 1,
      "year": 2024,
      "allocatedPermissions": 2,
      "usedPermissions": 1,
      "pendingPermissions": 0,
      "remainingPermissions": 1
    }
  ]
}
```

#### ج) طلب الأذن

**أذن عادي (من الرصيد):**
```http
POST /api/permissions/request
Content-Type: application/json

{
  "permissionTypeId": "type-uuid",
  "permissionDate": "2024-01-15",
  "permissionTime": "morning",
  "reason": "موعد طبي",
  "isExtraPermission": false
}
```

**أذن إضافي (على حساب الموظف):**
```http
POST /api/permissions/request
Content-Type: application/json

{
  "permissionTypeId": "type-uuid",
  "permissionDate": "2024-01-15",
  "permissionTime": "afternoon",
  "reason": "حالة طارئة",
  "isExtraPermission": true
}
```

#### د) نظام الموافقات (3 مستويات)

**المسار الكامل للأذن:**
```
┌──────────────────────────────────┐
│ 1️⃣ موظف يطلب أذن             │
└────────────┬─────────────────────┘
             ↓
     ┌───────────────────────┐
     │ 2️⃣ مسؤول شئون العاملين│
     │ (يراجع ويوافق/يرفض) │
     └───────────┬───────────┘
                 ↓
         ┌──────────────────────┐
         │ 3️⃣ الوكيل (نائب مدير)│
         │ (يراجع ويوافق/يرفض)│
         └──────────┬───────────┘
                    ↓
            ┌───────────────────┐
            │ 4️⃣ المدير       │
            │ (موافقة نهائية) │
            └───────────┬────────┘
                        ↓
        ✅ الأذن موافق عليه - خصم من الرصيد
        ❌ الأذن مرفوض - إرجاع للرصيد
```

**رموز الموافقات:**
- `pending`: انتظار
- `approved`: موافق عليه
- `rejected`: مرفوض

---

### ✅ 4. عزل البيانات حسب الفرع

**Middleware للتحقق من الصلاحيات:**

```javascript
// في كل طلب
@branchMiddleware
↓
// التحقق: هل الموظف من نفس الفرع؟
↓
// Admin: وصول لجميع الفروع
// غيره: وصول لفرعه فقط
```

**مثال:**

```http
GET /api/employees?branchId=branch-uuid

// إذا كنت موظفاً عادياً:
// ✅ سترى موظفي فرعك فقط
// ❌ لن ترى موظفي فروع أخرى

// إذا كنت Admin:
// ✅ ستراهم جميعاً
```

---

## 🔄 API Endpoints الجديدة

### Branches (الفروع)
```
GET    /api/branches                    - قائمة جميع الفروع (Admin)
GET    /api/branches/my-branch          - فرعي
POST   /api/branches                    - إنشاء فرع جديد (Admin)
PUT    /api/branches/:id                - تعديل الفرع (Admin)
GET    /api/branches/stats/:branchId    - إحصائيات الفرع
```

### Leave Types (أنواع الإجازات)
```
GET    /api/leave-types                 - أنواع الإجازات
POST   /api/leave-types                 - إضافة نوع جديد (HR Manager)
PUT    /api/leave-types/:id             - تعديل النوع (HR Manager)
DELETE /api/leave-types/:id             - حذف النوع (HR Manager)
```

### Leave Balances (أرصدة الإجازات)
```
GET    /api/leave-balances              - أرصدة الموظفين
POST   /api/leave-balances/set-balance  - تحديد الرصيد (HR Manager)
GET    /api/leave-balances/employee/:id - أرصدة موظف معين
```

### Leaves (طلبات الإجازات)
```
POST   /api/leaves/request              - تقديم طلب إجازة
GET    /api/leaves/pending/hr-manager   - طلبات قيد الانتظار (HR Manager)
POST   /api/leaves/approve/hr-manager/:id      - موافقة HR Manager
POST   /api/leaves/reject/hr-manager/:id       - رفض HR Manager
POST   /api/leaves/approve/deputy/:id          - موافقة الوكيل
POST   /api/leaves/reject/deputy/:id           - رفض الوكيل
POST   /api/leaves/approve/manager/:id         - موافقة المدير
POST   /api/leaves/reject/manager/:id          - رفض المدير
GET    /api/leaves/history/employee/:id        - سجل إجازات الموظف
```

### Permissions (الأذونات)
```
POST   /api/permissions/request         - طلب أذن
GET    /api/permissions/pending/hr-manager - طلبات قيد الانتظار
POST   /api/permissions/approve/hr-manager/:id    - موافقة HR Manager
POST   /api/permissions/reject/hr-manager/:id     - رفض HR Manager
POST   /api/permissions/approve/deputy/:id        - موافقة الوكيل
POST   /api/permissions/reject/deputy/:id         - رفض الوكيل
POST   /api/permissions/approve/manager/:id       - موافقة المدير
POST   /api/permissions/reject/manager/:id        - رفض المدير
GET    /api/permissions/history/employee/:id      - سجل أذونات الموظف
```

### Permission Balances (أرصدة الأذونات)
```
GET    /api/permission-balances         - أرصدة الموظفين
POST   /api/permission-balances/initialize-monthly - إعداد الأذونات الشهرية
PUT    /api/permission-balances/:id     - تحديث الرصيد (HR Manager)
GET    /api/permission-balances/employee/:id/current-month - رصيد الشهر الحالي
```

---

## 📊 مثال عملي كامل

### السيناريو: موظف يطلب إجازة سنوية لمدة أسبوع

**1. التحضير:**
```bash
# مسؤول الفرع يحدد نوع الإجازة "اعتيادية"
POST /api/leave-types
{
  "typeName": "اعتيادية",
  "typeCode": "ANNUAL",
  "defaultDays": 21,
  "requiresAttachments": false
}

# مسؤول الفرع يحدد رصيد الموظف
POST /api/leave-balances/set-balance
{
  "employeeId": "emp-123",
  "leaveTypeId": "leave-type-123",
  "totalDays": 21,
  "year": 2024
}
```

**2. الموظف يطلب الإجازة:**
```bash
POST /api/leaves/request
{
  "leaveTypeId": "leave-type-123",
  "startDate": "2024-01-15",
  "endDate": "2024-01-21",
  "reason": "إجازة سنوية",
  "documents": []
}

Response:
{
  "success": true,
  "message": "تم تقديم طلب الإجازة بنجاح",
  "data": {
    "id": "leave-req-123",
    "totalDays": 5,
    "status": "pending",
    "hrManagerStatus": "pending"
  }
}
```

**3. مسؤول شئون العاملين يراجع:**
```bash
# يرى الطلب المعلق
GET /api/leaves/pending/hr-manager

# يوافق عليه
POST /api/leaves/approve/hr-manager/leave-req-123
{
  "notes": "موافق عليه"
}
```

**4. الوكيل يراجع:**
```bash
POST /api/leaves/approve/deputy/leave-req-123
{
  "notes": "موافق عليه"
}
```

**5. المدير يوافق:**
```bash
POST /api/leaves/approve/manager/leave-req-123
{
  "notes": "موافق عليه"
}

Response:
{
  "success": true,
  "message": "تمت الموافقة على الإجازة",
  "data": {
    "status": "approved",
    "isDeductedFromBalance": true
  }
}
```

**النتيجة:**
- ✅ تمت الموافقة على الإجازة
- ✅ تم خصم 5 أيام من رصيد الموظف (21 - 5 = 16)
- ✅ تم إشعار جميع الأطراف

---

## 🔒 نظام الأمان والصلاحيات

### الأدوار والصلاحيات:

| الدور | الصلاحيات |
|-------|----------|
| **Admin** | وصول كامل لكل الفروع والبيانات |
| **Branch Manager** | إدارة فرعه فقط |
| **HR Manager** | تعيين الأرصدة، المراجعة الأولى للإجازات والأذونات |
| **Deputy Manager** | المراجعة الثانية (الوكيل) |
| **Manager** | الموافقة النهائية (المدير) |
| **Employee** | عرض بياناته، تقديم طلبات |

---

## 📱 Socket.IO Events

```javascript
// عند تقديم طلب إجازة
leaverequest_created

// عند موافقة HR Manager
leave:hr_approved

// عند رفض HR Manager
leave:hr_rejected

// عند تحديث أرصدة الإجازات
leave:balance_updated

// عند تقديم طلب أذن
permission:request_created

// عند موافقة HR Manager على الأذن
permission:hr_approved

// عند رفض الأذن
permission:rejected

// عند تحديث أرصدة الأذونات
permission:balance_updated
```

---

## ✨ الخلاصة

النظام الآن يدعم:

✅ **عزل كامل للبيانات** حسب الفرع  
✅ **إجازات مرنة** مع أنواع قابلة للتخصيص  
✅ **أرصدة ديناميكية** للإجازات والأذونات  
✅ **نظام موافقات 3 مستويات** (HR Manager → Deputy → Manager)  
✅ **أذونات ذكية** مع رصيد شهري وإضافات  
✅ **تقارير شاملة** حسب الفرع والموظف  
✅ **تحديثات فورية** عبر Socket.IO  

---

**تم إنشاء نظام متكامل احترافي!** 🎉
