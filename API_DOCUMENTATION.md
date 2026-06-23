# Vulcan API Documentation
> For Frontend & Mobile Developers
> Base URLs: Each microservice runs on its own port (see below)

---

## Authentication

All endpoints except **Register** and **Login** require a JWT token in the request header:

```
Authorization: Bearer <token>
```

Get a token by calling the Login endpoint. Tokens expire after **24 hours**.

---

## Service Base URLs

| Service | Base URL |
|---|---|
| Auth | `http://localhost:8081` |
| Worker | `http://localhost:8082` |
| Attendance | `http://localhost:8083` |
| Equipment | `http://localhost:8084` |
| Task | `http://localhost:8085` |
| Payroll | `http://localhost:8086` |
| Site Survey | `http://localhost:8087` |
| Analytics | `http://localhost:8088` |

---

## 1. AUTH SERVICE — `http://localhost:8081`

### Register
**POST** `/api/auth/register`
> No token required

**Request Body:**
```json
{
    "fullName": "Adusei Kelvin",
    "email": "kelvin@vulcan.com",
    "password": "password123",
    "phoneNumber": "0241234567",
    "role": "WORKER"
}
```
> Role options: `WORKER`, `SUPERVISOR`, `MANAGER`, `ADMIN`

**Response:** `"Registration successful. Awaiting admin approval."`

---

### Login
**POST** `/api/auth/login`
> No token required

**Request Body:**
```json
{
    "email": "kelvin@vulcan.com",
    "password": "password123"
}
```

**Response:** JWT token string (use this in all subsequent requests)
```
eyJhbGciOiJIUzI1NiJ9...
```

---

### Get Pending Users (Admin only)
**GET** `/api/admin/pending`
> Token required

**Response:**
```json
[
    {
        "id": 1,
        "fullName": "Test Worker",
        "email": "test@vulcan.com",
        "role": "WORKER",
        "status": "PENDING",
        "phoneNumber": "0241234567",
        "createdAt": "2026-06-10T01:29:17"
    }
]
```

---

### Approve User (Admin only)
**PUT** `/api/admin/approve/{userId}`
> Token required

**Response:** `"User approved successfully"`

---

### Reject User (Admin only)
**PUT** `/api/admin/reject/{userId}`
> Token required

**Response:** `"User rejected"`

---

## 2. WORKER SERVICE — `http://localhost:8082`

### Create Site
**POST** `/api/workers/sites`
> Token required

**Request Body:**
```json
{
    "name": "Accra Construction Site A",
    "location": "East Legon, Accra",
    "gpsLat": 5.6037,
    "gpsLng": -0.1870,
    "radiusMeters": 100
}
```

**Response:** `"Site created successfully"`

---

### Get All Sites
**GET** `/api/workers/sites`
> Token required

**Response:**
```json
[
    {
        "id": 1,
        "name": "Accra Construction Site A",
        "location": "East Legon, Accra",
        "gpsLat": 5.6037,
        "gpsLng": -0.187,
        "radiusMeters": 100.0,
        "createdAt": "2026-06-10T03:52:25"
    }
]
```

---

### Assign Worker to Site
**POST** `/api/workers/assign`
> Token required

**Request Body:**
```json
{
    "workerId": 1,
    "siteId": 1
}
```

**Response:** `"Worker assigned to site successfully"`

---

### Get Workers at a Site
**GET** `/api/workers/sites/{siteId}/workers`
> Token required

**Response:**
```json
[
    {
        "id": 1,
        "workerId": 1,
        "site": {
            "id": 1,
            "name": "Accra Construction Site A"
        },
        "assignedDate": "2026-06-10"
    }
]
```

---

## 3. ATTENDANCE SERVICE — `http://localhost:8083`

### Clock In
**POST** `/api/attendance/clock-in`
> Token required
> Worker must be assigned to the site or clock-in is rejected

**Request Body:**
```json
{
    "workerId": 1,
    "siteId": 1,
    "gpsLat": 5.6037,
    "gpsLng": -0.1870
}
```

**Response:** `"Clocked in successfully"` or `"Worker is not assigned to this site"` or `"Already clocked in today"`

---

### Clock Out
**POST** `/api/attendance/clock-out`
> Token required

**Request Body:**
```json
{
    "workerId": 1,
    "siteId": 1
}
```

**Response:** `"Clocked out successfully"`

---

### Check Ghost Worker Status
**GET** `/api/attendance/ghost-check/{workerId}`
> Token required

**Response:** `"ACTIVE"` or `"GHOST_WORKER"`

---

### Get Present Count for Pay Period
**GET** `/api/attendance/worker/{workerId}/present-count?payPeriod=2026-06`
> Token required

**Response:** Number (e.g. `22`)

---

## 4. EQUIPMENT SERVICE — `http://localhost:8084`

### Register Equipment
**POST** `/api/equipment/register`
> Token required

**Request Body:**
```json
{
    "equipmentCode": "EQ-001",
    "name": "Excavator",
    "type": "Heavy Machinery",
    "siteId": 1
}
```

**Response:** `"Equipment registered successfully"`

---

### Get All Equipment
**GET** `/api/equipment`
> Token required

**Response:**
```json
[
    {
        "id": 1,
        "equipmentCode": "EQ-001",
        "name": "Excavator",
        "type": "Heavy Machinery",
        "siteId": 1,
        "state": "AVAILABLE",
        "registeredAt": "2026-06-10T04:30:52"
    }
]
```

---

### Get Equipment by Site
**GET** `/api/equipment/site/{siteId}`
> Token required

**Response:** Array of equipment objects (same structure as above)

---

### Update Equipment State
**PUT** `/api/equipment/{equipmentId}/state`
> Token required

**Request Body:**
```json
{
    "state": "IN_USE"
}
```
> State options: `AVAILABLE`, `IN_USE`, `UNDER_REPAIR`, `DAMAGED`, `DECOMMISSIONED`

**Response:** `"Equipment state updated to IN_USE"`

---

## 5. TASK SERVICE — `http://localhost:8085`

### Assign Task (Supervisor)
**POST** `/api/tasks`
> Token required

**Request Body:**
```json
{
    "siteId": 1,
    "workerId": 1,
    "assignedBy": 2,
    "description": "Lay foundation on the north side"
}
```

**Response:** `"Task assigned successfully"`

---

### Get Worker's Tasks for Today
**GET** `/api/tasks/worker/{workerId}/today`
> Token required

**Response:**
```json
[
    {
        "id": 1,
        "siteId": 1,
        "workerId": 1,
        "assignedBy": 2,
        "description": "Lay foundation on the north side",
        "taskDate": "2026-06-21",
        "status": "PENDING",
        "createdAt": "2026-06-21T08:00:00"
    }
]
```

---

### Get All Tasks for a Site Today
**GET** `/api/tasks/site/{siteId}/today`
> Token required

**Response:** Array of task objects (same structure as above)

---

### Update Task Status
**PUT** `/api/tasks/{taskId}/status`
> Token required

**Request Body:**
```json
{
    "status": "COMPLETED"
}
```
> Status options: `PENDING`, `IN_PROGRESS`, `COMPLETED`, `NOT_COMPLETED`

**Response:** `"Task status updated to COMPLETED"`

---

### Get Worker Tasks by Status
**GET** `/api/tasks/worker/{workerId}/status/{status}`
> Token required

**Response:** Array of task objects

---

## 6. PAYROLL SERVICE — `http://localhost:8086`

### Create Payroll Record
**POST** `/api/payroll`
> Token required
> Days worked and amount are auto-calculated from attendance if not provided

**Request Body (MTN MoMo):**
```json
{
    "workerId": 1,
    "payPeriod": "2026-06",
    "paymentMethod": "MTN_MOMO",
    "momoNumber": "0241234567",
    "momoNetwork": "MTN"
}
```

**Request Body (Bank Transfer):**
```json
{
    "workerId": 2,
    "payPeriod": "2026-06",
    "paymentMethod": "BANK_TRANSFER",
    "bankName": "GCB Bank",
    "accountNumber": "1234567890",
    "accountName": "Worker Name"
}
```
> Payment method options: `MTN_MOMO`, `TELECEL_CASH`, `AIRTELTIGO_MONEY`, `BANK_TRANSFER`, `CHEQUE`

**Response:** `"Payroll record created successfully. Days worked: 22, Amount: 1100.0"`

---

### Get Payroll by Period
**GET** `/api/payroll/period/{payPeriod}`
> Token required. Example: `/api/payroll/period/2026-06`

**Response:** Array of payroll records

---

### Get Payroll for Worker
**GET** `/api/payroll/worker/{workerId}`
> Token required

**Response:** Array of payroll records

---

### Mark as Paid
**PUT** `/api/payroll/{payrollId}/pay`
> Token required

**Response:** `"Payroll marked as paid via MTN_MOMO"`

---

### Exclude Ghost Worker from Payroll
**PUT** `/api/payroll/worker/{workerId}/exclude?payPeriod=2026-06`
> Token required

**Response:** `"Worker excluded from payroll due to ghost worker status"`

---

## 7. SITE SURVEY SERVICE — `http://localhost:8087`

### Submit Survey Report (Foreman)
**POST** `/api/surveys`
> Token required

**Request Body:**
```json
{
    "siteId": 1,
    "foremanId": 3,
    "reportText": "Foundation work on north side completed. 80% of materials used.",
    "photoUrl": "https://storage.example.com/photo123.jpg"
}
```

**Response:** `"Survey report submitted successfully"`

---

### Get Surveys for Site Today
**GET** `/api/surveys/site/{siteId}/today`
> Token required

**Response:** Array of survey objects

---

### Get Surveys by Foreman
**GET** `/api/surveys/foreman/{foremanId}`
> Token required

**Response:** Array of survey objects

---

### Get Surveys by Status
**GET** `/api/surveys/status/{status}`
> Token required
> Status options: `SUBMITTED`, `VERIFIED`, `MISMATCH`, `PENALIZED`

**Response:** Array of survey objects

---

### Verify Survey (Supervisor)
**PUT** `/api/surveys/{surveyId}/verify`
> Token required

**Request Body:**
```json
{
    "verifiedBy": 2,
    "status": "VERIFIED",
    "verificationNotes": "Physical inspection matches report."
}
```
> Status options: `VERIFIED`, `MISMATCH`, `PENALIZED`

**Response:** `"Survey verified successfully — status: VERIFIED"`

---

### Get Foreman Penalty Count
**GET** `/api/surveys/foreman/{foremanId}/penalties`
> Token required

**Response:** Number (e.g. `2`)

---

## 8. ANALYTICS SERVICE — `http://localhost:8088`

### Get Manager Dashboard
**GET** `/api/analytics/dashboard?payPeriod=2026-06`
> Token required

**Response:**
```json
{
    "sites": [...],
    "equipment": [...],
    "pendingSurveys": [...],
    "payrollSummary": [...],
    "generatedAt": "2026-06-21T09:59:55"
}
```

---

## User Roles & What They Can Do

| Role | Permissions |
|---|---|
| `ADMIN` | Approve/reject user registrations, view all pending users |
| `MANAGER` | View analytics dashboard, oversee all operations |
| `SUPERVISOR` | Assign tasks, submit group photo, verify surveys, manage equipment state |
| `WORKER` | Clock in/out, view assigned tasks |

---

## Common Errors

| Error | Meaning | Fix |
|---|---|---|
| `403 Forbidden` | No token or wrong HTTP method | Add `Authorization: Bearer <token>` header |
| `401 Unauthorized` | Token expired or invalid | Login again to get a fresh token |
| `"Already clocked in today"` | Worker already has attendance record | Expected behavior |
| `"Worker is not assigned to this site"` | Site assignment missing | Assign worker to site first via Worker Service |
| `"Email already registered"` | Duplicate registration | Use a different email |
| `"Account not yet approved by admin"` | Status still PENDING | Admin needs to approve via `/api/admin/approve/{id}` |

---

## Typical Mobile App Flow

### Worker Daily Flow
1. **Login** → get token
2. **Clock In** → POST `/api/attendance/clock-in` with GPS coordinates
3. **View Tasks** → GET `/api/tasks/worker/{workerId}/today`
4. **Update Task** → PUT `/api/tasks/{taskId}/status`
5. **Clock Out** → POST `/api/attendance/clock-out`

### Supervisor Daily Flow
1. **Login** → get token
2. **Assign Tasks** → POST `/api/tasks` for each worker
3. **Submit Group Photo** → (AI service — coming soon)
4. **Submit Survey** → POST `/api/surveys`
5. **Update Equipment** → PUT `/api/equipment/{id}/state`

### Admin Flow
1. **Login** → get token
2. **View Pending** → GET `/api/admin/pending`
3. **Approve/Reject** → PUT `/api/admin/approve/{id}` or `/api/admin/reject/{id}`

### Manager Flow
1. **Login** → get token
2. **View Dashboard** → GET `/api/analytics/dashboard?payPeriod=2026-06`
3. **Process Payroll** → POST `/api/payroll` for each worker
4. **Mark Paid** → PUT `/api/payroll/{id}/pay`
