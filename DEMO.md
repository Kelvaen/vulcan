# Vulcan — 5-Minute Demo Script

A guided walkthrough for presenting Vulcan. Total time: ~5 minutes with a phone, ~4 on web.

## Before the demo (one-time, ~5 min)

1. `start-vulcan.bat` — wait until all service windows show *"Started ...Application"*
2. `seed-demo-data.bat` — creates the demo crew, site, equipment, tasks, attendance, payroll and a pending report
3. Phone: `cd mobile && npx expo start` and scan with Expo Go — or web: `cd mobile && npm run web`
4. **Enroll one real face** (best moment of the demo): sign in as the supervisor →
   *Roll Call → Enroll Face* → pick a teammate → photograph their face once

| Account | Email | Password |
|---|---|---|
| Admin | admin@vulcan.com | ChangeMe!2026 |
| Supervisor | kofi@vulcan.com | kofi12345 |
| Worker | yaw@vulcan.com | worker123 |
| Manager | efua@vulcan.com | efua12345 |

---

## The pitch (30 s)

> Construction and mining sites in West Africa lose money to **ghost workers**, have **no live
> view of the field**, and pay a largely **unbanked workforce**. Vulcan fixes all three with a
> phone: AI-verified attendance, mobile-money payroll, and live operations data — running on
> 8 microservices and a face-recognition AI service.

## Act 1 — The worker (60 s) · sign in as `yaw@vulcan.com`

- Point out the **role-based app**: a worker sees only Home, Equipment, Pay
- **Clock In** → GPS-geofenced: the button only works inside the site boundary; the card flips
  to *"On site · GPS verified"*
- **Today's tasks** — assigned by the supervisor, live from task-service; tick one off
- **Pay tab** — GH₵ amounts via **MTN MoMo** (no bank account needed); days worked come
  straight from verified attendance

## Act 2 — The supervisor (90 s) · sign in as `kofi@vulcan.com`

- Two new tabs appear: **Report** and **Roll Call** (same app, same login screen)
- **Roll Call → Group Photo**: photograph the crew (include the enrolled teammate) →
  *Verify Attendance* → DeepFace matches faces to enrolled workers and updates attendance —
  **present/absent counters on screen**. Ghost workers physically can't pass this check.
- **Report → Submit**: daily site report with checklist and notes
- **Report → Review Queue**: the seeded pending report — **Verify / Mismatch / Penalise**.
  Penalties accumulate against foremen who misreport.

## Act 3 — Management (60 s)

- Sign in as `efua@vulcan.com` (manager) → lands straight on the **Dashboard**: live headcount,
  equipment fleet health, payroll totals, pending surveys — aggregated across all services
- Sign in as `admin@vulcan.com` → **Approvals tab**: the registration queue. Register a fresh
  account from the sign-in screen ("Create an account") on another device and approve it live.

## Act 4 — Under the hood (30 s, optional)

- Show the 9 service windows: 8 Spring Boot microservices + FastAPI AI service
- `README.md` has the architecture table; every endpoint is documented in `API_DOCUMENTATION.md`
- Security: JWT auth on every service, env-var secrets, CORS locked to dev origins

---

## Talking points if asked

- **Offline reality**: PIN + phone auth, low-end Android friendly; sync designed for 2G
- **Why microservices?** Each concern (attendance, payroll, surveys...) scales and fails independently
- **Face data**: only 128-number embeddings are stored, not photos
- **Payments**: MTN MoMo, Telecel Cash, AT Money, bank transfer and cheque all modelled
- **Ghost worker rule**: 60+ unexplained absences auto-flags and excludes from pay runs

## If something breaks

- A service window closed → run `start-vulcan.bat` again (it reuses running ones' ports safely)
- "Network error" in the app on a phone → phone must be on the same Wi-Fi; allow Java/Node
  through Windows Firewall
- Roll call finds 0 faces → enroll faces first (*Roll Call → Enroll Face*), good lighting helps
