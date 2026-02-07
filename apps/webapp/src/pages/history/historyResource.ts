import { apiGet, apiPost } from "../../shared/api/client";
import type { HistoryDayDetailDto } from "./dto";

export type HistoryDayDto = {
  date: string;
  total: number;
  min: number;
  bonus: number;
  skip: number;
  fail: number;
};

let historyDaysCache: HistoryDayDto[] | null = null;
let historyDaysInFlight: Promise<HistoryDayDto[]> | null = null;

const historyDayDetailCache = new Map<string, HistoryDayDetailDto>();
const historyDayDetailInFlight = new Map<string, Promise<HistoryDayDetailDto>>();

export function readHistoryDaysCache(): HistoryDayDto[] | null {
  return historyDaysCache;
}

export function readHistoryDayDetailCache(day: string): HistoryDayDetailDto | null {
  return historyDayDetailCache.get(day) ?? null;
}

export async function fetchHistoryDays(): Promise<HistoryDayDto[]> {
  const json = await apiGet<HistoryDayDto[]>("/history/days");
  const next = Array.isArray(json) ? json : [];
  historyDaysCache = next;
  return next;
}

export function prefetchHistoryDays(): Promise<HistoryDayDto[]> {
  if (historyDaysCache !== null) return Promise.resolve(historyDaysCache);
  if (historyDaysInFlight) return historyDaysInFlight;

  const req = fetchHistoryDays().finally(() => {
    historyDaysInFlight = null;
  });

  historyDaysInFlight = req;
  return req;
}

export async function fetchHistoryDayDetail(day: string): Promise<HistoryDayDetailDto> {
  const json = await apiGet<HistoryDayDetailDto>(`/history/day/${day}`);
  historyDayDetailCache.set(day, json);
  return json;
}

export function prefetchHistoryDayDetail(day: string): Promise<HistoryDayDetailDto> {
  const cached = historyDayDetailCache.get(day);
  if (cached && cached.date === day) return Promise.resolve(cached);

  const inFlight = historyDayDetailInFlight.get(day);
  if (inFlight) return inFlight;

  const req = fetchHistoryDayDetail(day).finally(() => {
    historyDayDetailInFlight.delete(day);
  });

  historyDayDetailInFlight.set(day, req);
  return req;
}

export async function setHistoryDailyFlag(
  challenge_id: number,
  flag: "MIN" | "BONUS" | "SKIP" | "FAIL",
  comment?: string | null,
  minutes_fact?: number | null
): Promise<{ ok: true }> {
  return apiPost("/daily-log/upsert", {
    challenge_id,
    flag,
    comment: comment ?? null,
    minutes_fact: minutes_fact ?? null,
  }) as Promise<{ ok: true }>;
}
