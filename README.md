# Vulcan — Field & Workforce Intelligence Platform

> An AI-Powered Workforce & Operations Automation Solution for Construction and Mining in West Africa
>
> **CODEQUEST 2026 Submission — Group 3**

---

## Team Members

| # | Full Name | Index Number |
|---|---|---|
| 1 | Agana Theopilus Asaah | 6130524 |
| 2 | Ansong Frimpong Edmund | 6141224 |
| 3 | Adusei Kelvin | 6129624 |
| 4 | Acquah James Kofi Dadzie | 6126224 |
| 5 | Kyei Rooney Adu Gyamfi | 6166524 |

---

## What is Vulcan?

Vulcan is a field and workforce intelligence platform targeting construction and mining operations in West Africa. It addresses ghost worker fraud, lack of real-time field visibility, unbanked workforce payroll challenges, and untracked equipment through a suite of microservices and a mobile application.

---

## System Architecture

| Layer | Technology | Role |
|---|---|---|
| Mobile App | Expo + TypeScript | Worker, supervisor, manager & admin-facing interface |
| Backend | Spring Boot (Java) Microservices | Business logic, data management, scheduling |
| AI Service | Python / FastAPI | Face detection for attendance verification |
| Database | PostgreSQL | Shared relational database |

---

## Microservices

| Service | Port | Responsibility |
|---|---|---|
| auth-service | 8081 | Registration, JWT login, admin approval |
| worker-service | 8082 | Site registration, worker-to-site assignments |
| attendance-service | 8083 | Clock in/out, ghost worker detection scheduler |
| equipment-service | 8084 | Equipment registration and state tracking |
| task-service | 8085 | Daily task assignment and tracking |
| payroll-service | 8086 | Automated payroll with MoMo, bank & cheque support |
| site-survey-service | 8087 | Foreman reports and supervisor verification |
| analytics-service | 8088 | Aggregated dashboard for managers |
| ai-services (FastAPI) | 9000 | Face registration & group-photo attendance verification |

---

## Prerequisites

Make sure you have the following installed before running the project:

- **Java 25** — [Microsoft OpenJDK](https://www.microsoft.com/openjdk)
- **Maven** — bundled with IntelliJ, or just use the included Maven wrapper (`mvnw`)
- **PostgreSQL 17+** — [Download here](https://www.postgresql.org/download/windows/)
- **Python 3.13** — for the AI face detection service
- **IntelliJ IDEA Community** (optional) — [Download here](https://www.jetbrains.com/idea/download)
- **Git** — [Download here](https://git-scm.com/download/win)

---

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/Kelvaen/vulcan.git
cd vulcan
```

### 2. Set Up PostgreSQL

1. Open **pgAdmin** (or `psql`)
2. Create a database named `vulcandb`

### 3. Configure the Database Password

Every service reads the password from the `DB_PASSWORD` environment variable and falls back to a default. Either set `DB_PASSWORD` to your local PostgreSQL password, or update the password line in each service's `application.properties`:

```
backend/<service-name>/src/main/resources/application.properties
```

```properties
spring.datasource.password=${DB_PASSWORD:YOUR_POSTGRES_PASSWORD}
```

The services that call other services have additional URL configs — leave those as-is since all services run locally.

### 4. Set Up the AI Service (Python)

```bash
cd ai-services
python -m venv venv
venv\Scripts\pip install -r requirements.txt
```

### 5. Run Everything

**Option A — one click:** run `start-vulcan.bat` in the repo root. It opens one window per service (8 backend + AI) using each service's Maven wrapper.

**Option B — IntelliJ:** open each service under `backend/`, let Maven import, select the Java 25 SDK, and run the application class.

To pre-build all backend services once (downloads all dependencies), run `build-all.bat`.

### 6. Start Order

Start the services in this order to avoid dependency issues:

1. `auth-service` (8081)
2. `worker-service` (8082)
3. `attendance-service` (8083)
4. `equipment-service` (8084)
5. `task-service` (8085)
6. `payroll-service` (8086)
7. `site-survey-service` (8087)
8. `analytics-service` (8088)
9. AI face detection (9000)

### 7. Run the Mobile App

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with your phone — you need the **latest Expo Go** from the App Store /
Play Store (the project is on SDK 57). The app automatically sends all API calls to the
laptop running `expo start`, so the backend must be running on that same machine.

- **Phone and laptop must be on the same Wi-Fi network.**
- **Windows Firewall:** click *Allow* when prompted for Java and Node — otherwise login hangs.
- **Tunnel mode** — if the QR won't connect over LAN, tell the app where the backend is, then tunnel:
  ```powershell
  $env:EXPO_PUBLIC_API_HOST="<your laptop's LAN IP>"
  npx expo start --tunnel
  ```
- **First login on a fresh database:** `admin@vulcan.com` / `ChangeMe!2026` — this admin is
  created automatically by auth-service (override with `VULCAN_ADMIN_EMAIL` / `VULCAN_ADMIN_PASSWORD`).
  Register other users in the app, then approve them from the admin account. Change the default
  password after first login.
- No phone handy? `npm run web` runs the same app in a browser.

---

## Configuration (environment variables)

Everything runs with sensible dev defaults — set these to override, and **always set the first
three in any real deployment**:

| Variable | Default | Used by |
|---|---|---|
| `VULCAN_JWT_SECRET` | dev secret (in code) | all backend services — token signing/validation |
| `DB_PASSWORD` | `kelvin` | all backend services + AI service |
| `VULCAN_ADMIN_PASSWORD` | `ChangeMe!2026` | auth-service — seeded admin |
| `VULCAN_ADMIN_EMAIL` | `admin@vulcan.com` | auth-service — seeded admin |
| `VULCAN_CORS_ORIGINS` | localhost + LAN patterns | backend services — allowed browser origins |
| `VULCAN_CORS_ORIGIN_REGEX` | localhost + LAN regex | AI service — allowed browser origins |
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` | `localhost` / `5432` / `vulcandb` / `postgres` | AI service |
| `EXPO_PUBLIC_API_HOST` | auto-detected | mobile app — backend host (needed in tunnel mode) |

> All services must share the same `VULCAN_JWT_SECRET`, since every service validates the
> tokens that auth-service signs.

---

## Testing the API

Use **Postman** to test endpoints. All endpoints require a JWT token in the `Authorization` header (except registration and login).

### Get a Token

**POST** `http://localhost:8081/api/auth/login`

```json
{
    "email": "your_email@example.com",
    "password": "your_password"
}
```

Use the returned token in subsequent requests:

```
Authorization: Bearer <token>
```

### Key Endpoints

| Method | URL | Description |
|---|---|---|
| POST | /api/auth/register | Register a new user |
| POST | /api/auth/login | Login and get JWT token |
| GET | /api/admin/pending | Get pending user approvals |
| PUT | /api/admin/approve/{id} | Approve a user |
| POST | /api/workers/sites | Create a site |
| POST | /api/workers/assign | Assign worker to site |
| POST | /api/attendance/clock-in | Clock in (GPS + site validated) |
| POST | /api/attendance/clock-out | Clock out |
| POST | /api/equipment/register | Register equipment |
| PUT | /api/equipment/{id}/state | Update equipment state |
| POST | /api/tasks | Assign a task |
| POST | /api/payroll | Create payroll record |
| POST | /api/surveys | Submit site survey |
| PUT | /api/surveys/{id}/verify | Verify a survey |
| GET | /api/analytics/dashboard | Manager analytics dashboard |

See **API_DOCUMENTATION.md** for the full endpoint reference.

---

## Key Features

- **Ghost Worker Detection** — Automated daily scheduler marks absent workers and flags anyone with 60+ consecutive absent days for removal
- **AI Face Verification** — One group photo per day verifies the whole crew against registered face embeddings (DeepFace / Facenet)
- **Location-Based Attendance** — Clock-in validates worker is assigned to the claimed site
- **Automated Payroll** — Days worked pulled directly from attendance records; supports MTN MoMo, Telecel Cash, AirtelTigo Money, bank transfer, and cheque
- **Cross-Service Analytics** — Manager dashboard aggregates live data from all services
- **JWT Security** — All endpoints protected with role-based JWT authentication

---

## Notes for Teammates

- The database schema is created automatically by Hibernate when you first run each service — you don't need to run any SQL scripts
- Each service connects to the same `vulcandb` database but manages its own tables
- If a service fails to start, check that PostgreSQL is running and the password in `application.properties` is correct
- The ghost worker scheduler runs at 11:59 PM (mark absences) and 12:30 AM (check ghost workers) daily — this is automatic once the attendance service is running
- The AI service downloads Facenet model weights to `~/.deepface/weights/` on first use
