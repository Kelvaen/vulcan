# Vulcan — Setup Guide

How to get the whole system (backend + AI service + mobile app) running on a
fresh Windows laptop. Everything here runs **on your own machine**.

The `.bat` launchers resolve their own paths, so there is nothing to edit — they
work from wherever the project folder lives.

---

## If you already cloned the repo before, read this first

The commit history was rewritten (some commits were re-attributed), so an older
clone has diverged from the server. Sync it exactly once:

```bash
git status          # if this shows local changes you want to keep, run: git stash
git fetch origin
git reset --hard origin/master
```

`reset --hard` discards local commits/edits — that is intentional and is the only
clean way back in sync after a rewritten history. After this, future `git pull`s
are smooth again.

Then refresh the two things that changed:

```bash
cd mobile && npm install    # picks up newly added packages (e.g. expo-location)
```
```bash
build-all.bat               # rebuilds the backend with the latest code
```

If you have never actually *run* it on this laptop, also do the one-time setup
below (Steps 1–3), which is not stored in the repo.

---

## Fresh setup

### Step 0 — Get the code
```bash
git clone https://github.com/Kelvaen/vulcan.git
```

### Step 1 — Install four tools
- **JDK 21** (Eclipse Temurin 21 is easiest) — the backend needs Java 21
- **Node.js** (LTS) — for the mobile app
- **Python 3.13** — for the face-recognition service (tick "Add to PATH")
- **PostgreSQL 17** — during install, set the **postgres password to `kelvin`**

Check them:
```bash
java -version && node -v && python --version && psql --version
```

### Step 2 — Create the database
The app creates its own tables, but the empty database must exist first:
```bash
psql -U postgres -c "CREATE DATABASE vulcandb;"
```
If your postgres password is not `kelvin`, set it once: `setx DB_PASSWORD "yourpassword"`.

### Step 3 — Build the AI (face) service
The Python virtual environment is not in the repo, so build it once. This
downloads TensorFlow/DeepFace (~1–2 GB, needs internet):
```bash
cd ai-services && python -m venv venv && venv\Scripts\pip install -r requirements.txt
```

### Step 4 — Build the backend
First run downloads the Java dependencies:
```bash
build-all.bat
```

### Step 5 — (Optional) API keys
Only if you want real Paystack and login-alert emails. Run these yourself, then
reopen your terminal. Skip them and both features stay in safe demo mode.
```bash
setx PAYSTACK_SECRET_KEY "sk_test_your_test_key"
```
```bash
setx BREVO_API_KEY "your_brevo_key"
```
Use a Paystack **test** key (`sk_test_…`), never a live key, for demos.

### Step 6 — Start the backend + AI service
Double-click **`start-vulcan.bat`** in File Explorer. It opens 9 windows (8 Java
services on ports 8081–8088 + the AI service on 9000). Give it 1–2 minutes. The
first face enrollment also downloads the face model once (needs internet).

### Step 7 — Run the mobile app
```bash
cd mobile && npm install
```
Then either scan the QR code with **Expo Go** (phone and laptop on the **same
Wi-Fi**):
```bash
npx expo start
```
…or open it in a browser with `mobile\start-web.bat`.

### Step 8 — Load demo data
With the backend running:
```bash
seed-demo-data.bat
```

Demo logins:
- `admin@vulcan.com` / `ChangeMe!2026` — admin
- `kofi@vulcan.com` / `kofi12345` — supervisor
- `yaw@vulcan.com` / `worker123` — worker

---

## Troubleshooting

- **App can't reach the backend** → phone and laptop must be on the **same Wi-Fi**.
- **A Java window shows a Postgres connection error** → your postgres password
  isn't `kelvin`; fix with the `DB_PASSWORD` step above.
- **Geofenced clock-in blocks you** → you're outside the site's radius. Create a
  site with "Use my current location", or widen its radius.
- **Ports in use** → services use 8081–8088 and 9000; close anything else on those.
