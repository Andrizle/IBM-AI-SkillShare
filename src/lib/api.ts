export interface Medication {
  id: string;
  name: string;
  dosage: string;
  times: string[];
  notes: string | null;
  active: number;
  created_at: string;
}

export interface DoseLog {
  id: string;
  medication_id: string;
  scheduled_time: string;
  taken_at: string | null;
  date: string;
  status: "taken" | "missed" | "pending";
  created_at: string;
}

export interface MedicationWithLogs extends Medication {
  recent_logs: DoseLog[];
}

export interface AiAnalysis {
  id: string;
  summary: string;
  recommendations: { medication: string; suggestion: string }[];
  ran_at: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// Medications
export const getMedications = () => request<Medication[]>("/api/medications");

export const getMedication = (id: string) =>
  request<MedicationWithLogs>(`/api/medications/${id}`);

export const createMedication = (data: {
  name: string;
  dosage: string;
  times: string[];
  notes?: string;
}) => request<Medication>("/api/medications", { method: "POST", body: JSON.stringify(data) });

export const updateMedication = (
  id: string,
  data: Partial<{ name: string; dosage: string; times: string[]; notes: string }>
) =>
  request<{ ok: boolean }>(`/api/medications/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const deleteMedication = (id: string) =>
  request<{ ok: boolean }>(`/api/medications/${id}`, { method: "DELETE" });

export const logDose = (
  id: string,
  data: { scheduled_time: string; status: "taken" | "missed" | "pending"; date: string; taken_at?: string }
) =>
  request<DoseLog>(`/api/medications/${id}/log`, {
    method: "POST",
    body: JSON.stringify(data),
  });

export const getDoseLogs = (id: string) =>
  request<DoseLog[]>(`/api/medications/${id}/logs`);

// AI
export const getAnalyses = () => request<AiAnalysis[]>("/api/ai/analyses");

export const triggerAnalysis = () =>
  request<AiAnalysis>("/api/ai/analyse", { method: "POST" });

// Notifications
export const getVapidPublicKey = () =>
  request<{ publicKey: string }>("/api/notifications/vapid-public-key");

export const subscribePush = (subscription: PushSubscriptionJSON) =>
  request<{ ok: boolean }>("/api/notifications/subscribe", {
    method: "POST",
    body: JSON.stringify(subscription),
  });

export const unsubscribePush = (endpoint: string) =>
  request<{ ok: boolean }>("/api/notifications/subscribe", {
    method: "DELETE",
    body: JSON.stringify({ endpoint }),
  });

export const sendTestPush = () =>
  request<{ ok: boolean; sent: number }>("/api/notifications/test", { method: "POST" });

// Helpers
export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function nowHHMM() {
  return new Date().toTimeString().slice(0, 5);
}
