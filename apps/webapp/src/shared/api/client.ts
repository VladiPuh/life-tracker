import { getInitData } from "../tg/initData";

const API_BASE = "/api";
const DEV = import.meta.env.DEV;

async function request<T>(method: "GET" | "POST" | "PATCH", path: string, body?: any): Promise<T> {
  const initData = getInitData();

  if (DEV && method === "GET") {
    console.log("[apiGet]", { url: `${API_BASE}${path}`, initDataLen: initData.length });
  }

  const headers: Record<string, string> = {
    "ngrok-skip-browser-warning": "1",
    "X-Telegram-Init-Data": initData,
  };

  if (method !== "GET") headers["Content-Type"] = "application/json";

  const r = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!r.ok) throw new Error(`${method} ${path} failed: ${r.status}`);
  return r.json();
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>("GET", path);
}

export function apiPost<T>(path: string, body?: any): Promise<T> {
  return request<T>("POST", path, body);
}

export function apiPatch<T>(path: string, body: any): Promise<T> {
  return request<T>("PATCH", path, body);
}
