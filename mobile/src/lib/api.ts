import Constants from 'expo-constants';
import { Platform } from 'react-native';

// On web we talk to localhost directly; on a device we reuse the Metro host's
// LAN IP (the machine running `expo start` is also running the backend).
// EXPO_PUBLIC_API_HOST overrides both — required when Metro runs in tunnel
// mode, where hostUri is an exp.direct domain that doesn't reach the backend.
function backendHost(): string {
  const override = process.env.EXPO_PUBLIC_API_HOST;
  if (override) return override;
  if (Platform.OS === 'web') return 'localhost';
  const hostUri = Constants.expoConfig?.hostUri;
  return hostUri ? hostUri.split(':')[0] : 'localhost';
}

const H = backendHost();

export const API = {
  auth: `http://${H}:8081`,
  worker: `http://${H}:8082`,
  attendance: `http://${H}:8083`,
  equipment: `http://${H}:8084`,
  task: `http://${H}:8085`,
  payroll: `http://${H}:8086`,
  survey: `http://${H}:8087`,
  analytics: `http://${H}:8088`,
  ai: `http://${H}:9000`,
};

export type Role = 'WORKER' | 'SUPERVISOR' | 'MANAGER' | 'ADMIN';

export interface Session {
  token: string;
  email: string;
  role: Role;
  userId: number | null;
  fullName: string | null;
  companyId: number | null;
}

function decodeJwt(token: string): {
  role: Role;
  userId: number | null;
  fullName: string | null;
  companyId: number | null;
} {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      role: (payload.role ?? 'WORKER') as Role,
      userId: typeof payload.userId === 'number' ? payload.userId : null,
      fullName: typeof payload.fullName === 'string' ? payload.fullName : null,
      companyId: typeof payload.companyId === 'number' ? payload.companyId : null,
    };
  } catch {
    return { role: 'WORKER', userId: null, fullName: null, companyId: null };
  }
}

/** POST /api/auth/login — returns a raw JWT string, or a plain error message. */
export async function login(email: string, password: string): Promise<Session> {
  const res = await fetch(`${API.auth}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const text = (await res.text()).trim();
  const looksLikeJwt = text.split('.').length === 3 && text.length > 60;
  if (!res.ok || !looksLikeJwt) {
    throw new Error(text || `Login failed (${res.status})`);
  }
  return { token: text, email, ...decodeJwt(text) };
}

export async function register(input: {
  fullName: string;
  email: string;
  password: string;
  phoneNumber: string;
  role: Role;
  joinCode: string;
}): Promise<string> {
  const res = await fetch(`${API.auth}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return res.text();
}

/** Create a new company and its first (owner) admin. */
export async function registerCompany(input: {
  companyName: string;
  fullName: string;
  email: string;
  password: string;
  phoneNumber: string;
}): Promise<string> {
  const res = await fetch(`${API.auth}/api/auth/register-company`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return res.text();
}

export interface CompanyInfo {
  id: number;
  name: string;
  joinCode: string;
  plan: 'FREE' | 'PREMIUM';
  usage: Record<Role, { active: number; limit: number }>;
}

export async function getCompany(token: string, companyId: number): Promise<CompanyInfo> {
  const res = await fetch(`${API.auth}/api/companies/${companyId}`, { headers: authed(token) });
  if (!res.ok) throw new Error(`Company failed (${res.status})`);
  return res.json();
}

// ---------- premium upgrade (Paystack) ----------
export interface PremiumPrice {
  amount: number; // smallest currency unit, e.g. pesewas
  currency: string;
  mock: boolean;
}

export async function getPremiumPrice(token: string): Promise<PremiumPrice> {
  const res = await fetch(`${API.auth}/api/companies/premium-price`, { headers: authed(token) });
  if (!res.ok) throw new Error(`Price failed (${res.status})`);
  return res.json();
}

export interface UpgradeInit {
  reference: string;
  authorizationUrl: string;
  mock: boolean;
  amount: number;
  currency: string;
  alreadyPremium?: boolean;
}

export async function upgradeInit(token: string, companyId: number, email: string): Promise<UpgradeInit> {
  const res = await fetch(`${API.auth}/api/companies/${companyId}/upgrade/init`, {
    method: 'POST',
    headers: authed(token),
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error(`Upgrade init failed (${res.status})`);
  return res.json();
}

export async function upgradeVerify(
  token: string,
  companyId: number,
  reference: string,
): Promise<{ success: boolean; message: string; company?: CompanyInfo }> {
  const res = await fetch(`${API.auth}/api/companies/${companyId}/upgrade/verify`, {
    method: 'POST',
    headers: authed(token),
    body: JSON.stringify({ reference }),
  });
  if (!res.ok) throw new Error(`Upgrade verify failed (${res.status})`);
  return res.json();
}

function authed(token: string): Record<string, string> {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

export async function clockIn(
  token: string,
  body: { workerId: number; siteId: number; gpsLat: number; gpsLng: number },
): Promise<string> {
  const res = await fetch(`${API.attendance}/api/attendance/clock-in`, {
    method: 'POST',
    headers: authed(token),
    body: JSON.stringify(body),
  });
  return res.text();
}

export async function clockOut(
  token: string,
  body: { workerId: number; siteId: number },
): Promise<string> {
  const res = await fetch(`${API.attendance}/api/attendance/clock-out`, {
    method: 'POST',
    headers: authed(token),
    body: JSON.stringify(body),
  });
  return res.text();
}

export interface Site {
  id: number;
  name: string;
  location: string;
  gpsLat: number;
  gpsLng: number;
  radiusMeters: number;
}

export async function getSites(token: string): Promise<Site[]> {
  const res = await fetch(`${API.worker}/api/workers/sites`, { headers: authed(token) });
  if (!res.ok) throw new Error(`Sites failed (${res.status})`);
  return res.json();
}

export interface SiteAssignment {
  id: number;
  workerId: number;
  site: Site;
  assignedDate: string;
}

/** The site this user is actually assigned to, or null if they have none.
 *  No fallback — an unassigned user (e.g. an admin) genuinely has no site. */
export async function getWorkerSite(token: string, workerId: number): Promise<Site | null> {
  const sites = await getSites(token);
  for (const site of sites) {
    try {
      const res = await fetch(`${API.worker}/api/workers/sites/${site.id}/workers`, {
        headers: authed(token),
      });
      if (!res.ok) continue;
      const assignments: { workerId: number }[] = await res.json();
      if (assignments.some((a) => a.workerId === workerId)) return site;
    } catch {
      /* keep scanning */
    }
  }
  return null;
}

export async function getSiteWorkers(token: string, siteId: number): Promise<SiteAssignment[]> {
  const res = await fetch(`${API.worker}/api/workers/sites/${siteId}/workers`, {
    headers: authed(token),
  });
  if (!res.ok) throw new Error(`Site roster failed (${res.status})`);
  return res.json();
}

export async function createSite(
  token: string,
  body: { name: string; location: string; gpsLat: number; gpsLng: number; radiusMeters: number },
): Promise<string> {
  const res = await fetch(`${API.worker}/api/workers/sites`, {
    method: 'POST',
    headers: authed(token),
    body: JSON.stringify(body),
  });
  return res.text();
}

export async function assignWorkerToSite(
  token: string,
  workerId: number,
  siteId: number,
): Promise<string> {
  const res = await fetch(`${API.worker}/api/workers/assign`, {
    method: 'POST',
    headers: authed(token),
    body: JSON.stringify({ workerId, siteId }),
  });
  return res.text();
}

/** Upload a group photo; backend forwards it to the AI service and updates attendance. */
export async function verifyGroupPhoto(
  token: string,
  siteId: number,
  photo: { uri: string; name: string; type: string },
): Promise<string> {
  const form = new FormData();
  if (photo.uri.startsWith('data:') || photo.uri.startsWith('blob:')) {
    // web: convert the picker result into a real Blob
    const blob = await (await fetch(photo.uri)).blob();
    form.append('file', blob, photo.name);
  } else {
    // native: RN understands { uri, name, type } file descriptors
    form.append('file', photo as unknown as Blob);
  }
  const res = await fetch(
    `${API.attendance}/api/attendance/verify-group-photo?siteId=${siteId}`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    },
  );
  return res.text();
}

export type EquipmentState =
  | 'AVAILABLE'
  | 'IN_USE'
  | 'UNDER_REPAIR'
  | 'DAMAGED'
  | 'DECOMMISSIONED';

export interface Equipment {
  id: number;
  name: string;
  equipmentCode: string;
  siteId: number;
  state: EquipmentState;
  type?: string | null;
  hasProof?: boolean;
  proofUpdatedAt?: string | null;
}

export async function getEquipment(token: string): Promise<Equipment[]> {
  const res = await fetch(`${API.equipment}/api/equipment`, { headers: authed(token) });
  if (!res.ok) throw new Error(`Equipment failed (${res.status})`);
  return res.json();
}

/** Admin registers a new asset and assigns it to a site. */
export async function createEquipment(
  token: string,
  body: { equipmentCode: string; name: string; type: string; siteId: number },
): Promise<string> {
  const res = await fetch(`${API.equipment}/api/equipment/register`, {
    method: 'POST',
    headers: authed(token),
    body: JSON.stringify(body),
  });
  return res.text();
}

export async function getWorkerPayroll(token: string, workerId: number): Promise<any[]> {
  const res = await fetch(`${API.payroll}/api/payroll/worker/${workerId}`, {
    headers: authed(token),
  });
  if (!res.ok) throw new Error(`Payroll failed (${res.status})`);
  return res.json();
}

export interface PayrollRecord {
  id: number;
  workerId: number;
  payPeriod: string;
  amount: number | null;
  daysWorked: number | null;
  paymentMethod: string;
  momoNumber: string | null;
  momoNetwork: string | null;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'EXCLUDED_GHOST_WORKER';
}

export async function getPayrollByPeriod(token: string, payPeriod: string): Promise<PayrollRecord[]> {
  const res = await fetch(`${API.payroll}/api/payroll/period/${payPeriod}`, { headers: authed(token) });
  if (!res.ok) throw new Error(`Payroll failed (${res.status})`);
  return res.json();
}

/** Trigger payment for a record. Mobile-money methods are paid out via Paystack. */
export async function payPayroll(token: string, payrollId: number): Promise<string> {
  const res = await fetch(`${API.payroll}/api/payroll/${payrollId}/pay`, {
    method: 'PUT',
    headers: authed(token),
  });
  return res.text();
}

export async function submitSurvey(
  token: string,
  body: { siteId: number; foremanId: number; reportText: string; photoUrl: string },
): Promise<string> {
  const res = await fetch(`${API.survey}/api/surveys`, {
    method: 'POST',
    headers: authed(token),
    body: JSON.stringify(body),
  });
  return res.text();
}

export async function getDashboard(token: string, payPeriod: string): Promise<any> {
  const res = await fetch(
    `${API.analytics}/api/analytics/dashboard?payPeriod=${encodeURIComponent(payPeriod)}`,
    { headers: authed(token) },
  );
  if (!res.ok) throw new Error(`Dashboard failed (${res.status})`);
  return res.json();
}

// ---------- tasks ----------
export interface WorkerTask {
  id: number;
  siteId: number;
  workerId: number;
  assignedBy: number | null;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'NOT_COMPLETED';
  taskDate: string;
}

export async function getWorkerTasksToday(token: string, workerId: number): Promise<WorkerTask[]> {
  const res = await fetch(`${API.task}/api/tasks/worker/${workerId}/today`, {
    headers: authed(token),
  });
  if (!res.ok) throw new Error(`Tasks failed (${res.status})`);
  return res.json();
}

/** Supervisor assigns a free-text task to a worker for today. */
export async function createTask(
  token: string,
  body: { siteId: number; workerId: number; assignedBy: number; description: string },
): Promise<string> {
  const res = await fetch(`${API.task}/api/tasks`, {
    method: 'POST',
    headers: authed(token),
    body: JSON.stringify(body),
  });
  return res.text();
}

export async function updateTaskStatus(
  token: string,
  taskId: number,
  status: WorkerTask['status'],
): Promise<string> {
  const res = await fetch(`${API.task}/api/tasks/${taskId}/status`, {
    method: 'PUT',
    headers: { ...authed(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  return res.text();
}

// ---------- admin approvals ----------
export interface PendingUser {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  role: Role;
  status: string;
}

export async function getPendingUsers(token: string, companyId?: number | null): Promise<PendingUser[]> {
  const q = companyId != null ? `?companyId=${companyId}` : '';
  const res = await fetch(`${API.auth}/api/admin/pending${q}`, { headers: authed(token) });
  if (!res.ok) throw new Error(`Pending list failed (${res.status})`);
  return res.json();
}

export async function approveUser(token: string, userId: number): Promise<string> {
  const res = await fetch(`${API.auth}/api/admin/approve/${userId}`, {
    method: 'PUT',
    headers: authed(token),
  });
  return res.text();
}

export async function rejectUser(token: string, userId: number): Promise<string> {
  const res = await fetch(`${API.auth}/api/admin/reject/${userId}`, {
    method: 'PUT',
    headers: authed(token),
  });
  return res.text();
}

/** Fire/deactivate an employee — frees their seat and blocks sign-in. */
export async function removeUser(token: string, userId: number): Promise<string> {
  const res = await fetch(`${API.auth}/api/admin/remove/${userId}`, {
    method: 'PUT',
    headers: authed(token),
  });
  return res.text();
}

// ---------- face enrollment ----------
export interface ActiveUser {
  id: number;
  fullName: string;
  email: string;
  role: Role;
}

export async function getActiveUsers(token: string, companyId?: number | null): Promise<ActiveUser[]> {
  const q = companyId != null ? `?companyId=${companyId}` : '';
  const res = await fetch(`${API.auth}/api/admin/users${q}`, { headers: authed(token) });
  if (!res.ok) throw new Error(`User list failed (${res.status})`);
  return res.json();
}

/** Register one worker's face with the AI service (single clear face per photo). */
export async function registerFace(
  workerId: number,
  photo: { uri: string; name: string; type: string },
): Promise<string> {
  const form = new FormData();
  if (photo.uri.startsWith('data:') || photo.uri.startsWith('blob:')) {
    const blob = await (await fetch(photo.uri)).blob();
    form.append('file', blob, photo.name);
  } else {
    form.append('file', photo as unknown as Blob);
  }
  const res = await fetch(`${API.ai}/register-face?worker_id=${workerId}`, {
    method: 'POST',
    body: form,
  });
  const text = await res.text();
  try {
    const json = JSON.parse(text);
    return json.message ?? json.detail ?? text;
  } catch {
    return text;
  }
}

export async function updateEquipmentState(
  token: string,
  equipmentId: number,
  state: EquipmentState,
  proofImage?: string,
): Promise<string> {
  const res = await fetch(`${API.equipment}/api/equipment/${equipmentId}/state`, {
    method: 'PUT',
    headers: authed(token),
    body: JSON.stringify(proofImage ? { state, proofImage } : { state }),
  });
  return res.text();
}

/** Fetch the base64 photo proof for an asset, or null if none. */
export async function getEquipmentProof(token: string, equipmentId: number): Promise<string | null> {
  const res = await fetch(`${API.equipment}/api/equipment/${equipmentId}/proof`, {
    headers: authed(token),
  });
  if (res.status === 204) return null;
  if (!res.ok) return null;
  const data = await res.json();
  return data?.proofImage ?? null;
}

// ---------- survey review ----------
export interface Survey {
  id: number;
  siteId: number;
  foremanId: number;
  reportText: string;
  hasPhoto: boolean; // the actual photo is fetched on demand via getSurveyPhoto
  status: 'SUBMITTED' | 'VERIFIED' | 'MISMATCH' | 'PENALIZED';
  createdAt?: string;
}

/** Fetch a single report's photo (base64 data URI) on demand, or null. */
export async function getSurveyPhoto(token: string, surveyId: number): Promise<string | null> {
  const res = await fetch(`${API.survey}/api/surveys/${surveyId}/photo`, { headers: authed(token) });
  if (res.status === 204 || !res.ok) return null;
  const data = await res.json();
  return data?.photoUrl ?? null;
}

export async function getSurveysByStatus(token: string, status: Survey['status']): Promise<Survey[]> {
  const res = await fetch(`${API.survey}/api/surveys/status/${status}`, { headers: authed(token) });
  if (!res.ok) throw new Error(`Surveys failed (${res.status})`);
  return res.json();
}

/** Admin view: every report across all statuses, newest first. */
export async function getAllSurveys(token: string): Promise<Survey[]> {
  const statuses: Survey['status'][] = ['SUBMITTED', 'VERIFIED', 'MISMATCH', 'PENALIZED'];
  const lists = await Promise.all(
    statuses.map((s) => getSurveysByStatus(token, s).catch(() => [] as Survey[])),
  );
  return lists.flat().sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
}

export async function verifySurvey(
  token: string,
  surveyId: number,
  body: { verifiedBy: number; status: 'VERIFIED' | 'MISMATCH' | 'PENALIZED'; verificationNotes: string },
): Promise<string> {
  const res = await fetch(`${API.survey}/api/surveys/${surveyId}/verify`, {
    method: 'PUT',
    headers: authed(token),
    body: JSON.stringify(body),
  });
  return res.text();
}
