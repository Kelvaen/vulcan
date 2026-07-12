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
}

function decodeJwt(token: string): { role: Role; userId: number | null; fullName: string | null } {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      role: (payload.role ?? 'WORKER') as Role,
      userId: typeof payload.userId === 'number' ? payload.userId : null,
      fullName: typeof payload.fullName === 'string' ? payload.fullName : null,
    };
  } catch {
    return { role: 'WORKER', userId: null, fullName: null };
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
}): Promise<string> {
  const res = await fetch(`${API.auth}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return res.text();
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

/** Find the site this worker is assigned to by scanning site assignments. */
export async function getWorkerSite(token: string, workerId: number): Promise<Site | null> {
  const sites = await getSites(token);
  for (const site of sites) {
    try {
      const res = await fetch(`${API.worker}/api/workers/sites/${site.id}/workers`, {
        headers: authed(token),
      });
      if (!res.ok) continue;
      const assignments: Array<{ workerId: number }> = await res.json();
      if (assignments.some((a) => a.workerId === workerId)) return site;
    } catch {
      /* keep scanning */
    }
  }
  return sites[0] ?? null;
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
}

export async function getEquipment(token: string): Promise<Equipment[]> {
  const res = await fetch(`${API.equipment}/api/equipment`, { headers: authed(token) });
  if (!res.ok) throw new Error(`Equipment failed (${res.status})`);
  return res.json();
}

export async function getWorkerPayroll(token: string, workerId: number): Promise<any[]> {
  const res = await fetch(`${API.payroll}/api/payroll/worker/${workerId}`, {
    headers: authed(token),
  });
  if (!res.ok) throw new Error(`Payroll failed (${res.status})`);
  return res.json();
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

export async function getPendingUsers(token: string): Promise<PendingUser[]> {
  const res = await fetch(`${API.auth}/api/admin/pending`, { headers: authed(token) });
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
