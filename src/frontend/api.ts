/// <reference types="vite/client" />

const BASE = (import.meta.env.VITE_API_BASE ?? "") as string;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${path}`);
  }
  return res.json() as Promise<T>;
}

export interface LifecycleSnapshot {
  bananaId: string;
  stage: string;
  ripeness: number;
  peelStakedWei: string;
  stakeCount: number;
  events: { toStage: string; ripenessAt: number; ts: string }[];
}

export async function health(): Promise<{ status: string; ts: string }> {
  return request("/api/health");
}

export async function getLifecycle(bananaId: string): Promise<LifecycleSnapshot> {
  return request(`/api/lifecycle/${encodeURIComponent(bananaId)}`);
}

export async function postStake(input: {
  bananaId: string;
  amountWei: string;
  userOpHash: string;
}): Promise<LifecycleSnapshot> {
  return request("/api/stake", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export interface LeaderRow {
  bananaId: string;
  peelStakedWei: string;
  stage: string;
  stakeCount: number;
  ripeness: number;
}

export interface ProtocolStats {
  totalBananas: number;
  totalPeelWei: string;
  ascended: number;
  eventCount: number;
}

export interface EventRow {
  bananaId: string;
  toStage: string;
  ripenessAt: number;
  ts: string;
}

export async function getLeaderboard(limit?: number): Promise<LeaderRow[]> {
  const qs = limit !== undefined ? `?limit=${limit}` : "";
  return request(`/api/leaderboard${qs}`);
}

export async function getStats(): Promise<ProtocolStats> {
  return request("/api/stats");
}

export async function getEvents(limit?: number): Promise<EventRow[]> {
  const qs = limit !== undefined ? `?limit=${limit}` : "";
  return request(`/api/events${qs}`);
}

export function connectLifecycleWs(onMessage: (data: unknown) => void): WebSocket {
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  const ws = new WebSocket(`${protocol}//${location.host}/ws`);
  ws.addEventListener("message", (event) => {
    try {
      onMessage(JSON.parse(event.data as string) as unknown);
    } catch {
      // malformed frame — swallow
    }
  });
  return ws;
}
