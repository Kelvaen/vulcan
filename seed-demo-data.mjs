// Vulcan demo data seeder. Run AFTER start-vulcan.bat, once all services are up.
// Safe to run twice: existing users, sites, equipment and today's records are skipped.
//   node seed-demo-data.mjs

const AUTH = 'http://localhost:8081';
const WORK = 'http://localhost:8082';
const ATT = 'http://localhost:8083';
const EQ = 'http://localhost:8084';
const TASK = 'http://localhost:8085';
const PAY = 'http://localhost:8086';
const SUR = 'http://localhost:8087';

let token = '';

async function call(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

const log = (label, msg) => console.log(`${label.padEnd(28)}: ${typeof msg === 'string' ? msg : JSON.stringify(msg).slice(0, 80)}`);

const adminEmail = process.env.VULCAN_ADMIN_EMAIL || 'admin@vulcan.com';
const adminPass = process.env.VULCAN_ADMIN_PASSWORD || 'ChangeMe!2026';

console.log('== Vulcan demo seeder ==');

// --- admin login ---
token = '';
const loginRes = await call('POST', `${AUTH}/api/auth/login`, { email: adminEmail, password: adminPass });
if (typeof loginRes !== 'string' || !loginRes.startsWith('eyJ')) {
  console.error(`Admin login failed: ${loginRes}`);
  process.exit(1);
}
token = loginRes;
log('admin login', 'OK');

// --- users ---
const people = [
  { fullName: 'Yaw Boateng', email: 'yaw@vulcan.com', password: 'worker123', phoneNumber: '0241112223', role: 'WORKER' },
  { fullName: 'Ama Serwaa', email: 'ama@vulcan.com', password: 'ama12345', phoneNumber: '0201112223', role: 'WORKER' },
  { fullName: 'Kofi Adjei', email: 'kofi@vulcan.com', password: 'kofi12345', phoneNumber: '0261112224', role: 'SUPERVISOR' },
  { fullName: 'Efua Frimpong', email: 'efua@vulcan.com', password: 'efua12345', phoneNumber: '0271112225', role: 'MANAGER' },
];
for (const u of people) log(`register ${u.email}`, await call('POST', `${AUTH}/api/auth/register`, u));

// --- approve everyone pending ---
const pending = await call('GET', `${AUTH}/api/admin/pending`);
for (const p of Array.isArray(pending) ? pending : []) {
  log(`approve ${p.email}`, await call('PUT', `${AUTH}/api/admin/approve/${p.id}`));
}

// --- email -> id map ---
const users = await call('GET', `${AUTH}/api/admin/users`);
const ids = Object.fromEntries((Array.isArray(users) ? users : []).map((u) => [u.email, u.id]));

// --- sites ---
let sites = await call('GET', `${WORK}/api/workers/sites`);
const siteNames = (Array.isArray(sites) ? sites : []).map((s) => s.name);
if (!siteNames.includes('Obuasi Site A')) {
  log('site Obuasi Site A', await call('POST', `${WORK}/api/workers/sites`, { name: 'Obuasi Site A', location: 'Obuasi, Ashanti', gpsLat: 6.2027, gpsLng: -1.6631, radiusMeters: 150 }));
}
if (!siteNames.includes('Tarkwa Site B')) {
  log('site Tarkwa Site B', await call('POST', `${WORK}/api/workers/sites`, { name: 'Tarkwa Site B', location: 'Tarkwa, Western', gpsLat: 5.3018, gpsLng: -1.993, radiusMeters: 200 }));
}
sites = await call('GET', `${WORK}/api/workers/sites`);
const siteA = (Array.isArray(sites) ? sites : []).find((s) => s.name === 'Obuasi Site A');

// --- assignments ---
for (const e of ['yaw@vulcan.com', 'ama@vulcan.com', 'kofi@vulcan.com']) {
  log(`assign ${e}`, await call('POST', `${WORK}/api/workers/assign`, { workerId: ids[e], siteId: siteA.id }));
}

// --- equipment (skip codes that already exist) ---
const existing = await call('GET', `${EQ}/api/equipment`);
const codes = (Array.isArray(existing) ? existing : []).map((x) => x.equipmentCode);
const fleet = [
  { name: 'CAT 320 Excavator', equipmentCode: 'VLC-EQ-0041' },
  { name: 'DAF Tipper Truck', equipmentCode: 'VLC-EQ-0087' },
  { name: 'Concrete Mixer M400', equipmentCode: 'VLC-EQ-0012' },
  { name: 'Genset 150 kVA', equipmentCode: 'VLC-EQ-0060' },
  { name: 'Toyota Hilux Crew Cab', equipmentCode: 'VLC-EQ-0009' },
];
for (const f of fleet) {
  if (codes.includes(f.equipmentCode)) log(`equip ${f.equipmentCode}`, 'exists, skipped');
  else log(`equip ${f.equipmentCode}`, await call('POST', `${EQ}/api/equipment/register`, { ...f, siteId: siteA.id }));
}

// --- today's tasks (skip workers that already have one) ---
const taskPlan = [
  { email: 'yaw@vulcan.com', description: 'Rebar tying - Block C footing' },
  { email: 'ama@vulcan.com', description: 'Aggregate haulage - Pit 2 to crusher' },
];
for (const t of taskPlan) {
  const todays = await call('GET', `${TASK}/api/tasks/worker/${ids[t.email]}/today`);
  if (Array.isArray(todays) && todays.length > 0) log(`task ${t.email}`, 'exists, skipped');
  else log(`task ${t.email}`, await call('POST', `${TASK}/api/tasks`, { workerId: ids[t.email], siteId: siteA.id, assignedBy: ids['kofi@vulcan.com'], description: t.description }));
}

// --- clock-ins inside the geofence (service refuses duplicates itself) ---
for (const e of ['yaw@vulcan.com', 'ama@vulcan.com']) {
  log(`clock-in ${e}`, await call('POST', `${ATT}/api/attendance/clock-in`, { workerId: ids[e], siteId: siteA.id, gpsLat: 6.2028, gpsLng: -1.663 }));
}

// --- payroll for the current month (skip if a record exists) ---
const period = new Date().toISOString().slice(0, 7);
for (const e of ['yaw@vulcan.com', 'ama@vulcan.com']) {
  const records = await call('GET', `${PAY}/api/payroll/worker/${ids[e]}`);
  if (Array.isArray(records) && records.some((r) => r.payPeriod === period)) log(`payroll ${e}`, 'exists, skipped');
  else log(`payroll ${e}`, await call('POST', `${PAY}/api/payroll`, { workerId: ids[e], payPeriod: period, amount: 1140.0, daysWorked: 12, paymentMethod: 'MTN_MOMO', momoNumber: '0241112223', momoNetwork: 'MTN' }));
}

// --- one submitted survey so the review queue has content ---
log('survey', await call('POST', `${SUR}/api/surveys`, { siteId: siteA.id, foremanId: ids['kofi@vulcan.com'], reportText: 'Foundation pour 75% complete on Block C. Mixer M400 serviced. No incidents.', photoUrl: 'local://demo' }));

console.log(`
== Demo accounts ==
  admin      : ${adminEmail} / ${adminPass}
  worker     : yaw@vulcan.com / worker123
  worker     : ama@vulcan.com / ama12345
  supervisor : kofi@vulcan.com / kofi12345
  manager    : efua@vulcan.com / efua12345
Done.`);
