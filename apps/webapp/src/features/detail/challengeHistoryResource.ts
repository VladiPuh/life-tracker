import { apiGet } from "../../shared/api/client";
import type { StatusKey } from "../../shared/statusMeta";

export type ChallengeHistoryItem = {
  date: string;
  status_view: StatusKey | string;
  minutes_fact?: number | null;
  comment?: string | null;
};

type ChallengeHistoryResp = {
  challenge_id: number;
  items: ChallengeHistoryItem[];
};

type CacheKey = `${number}:${number}`;

const historyCache = new Map<CacheKey, ChallengeHistoryItem[]>();
const historyInFlight = new Map<CacheKey, Promise<ChallengeHistoryItem[]>>();

function key(challengeId: number, days: number): CacheKey {
  return `${challengeId}:${days}`;
}

export function readChallengeHistoryCache(
  challengeId: number,
  days: number
): ChallengeHistoryItem[] | null {
  return historyCache.get(key(challengeId, days)) ?? null;
}

export async function fetchChallengeHistory(
  challengeId: number,
  days: number
): Promise<ChallengeHistoryItem[]> {
  const json = await apiGet<ChallengeHistoryResp>(`/challenges/${challengeId}/history?days=${days}`);
  const next = Array.isArray(json?.items) ? json.items : [];
  historyCache.set(key(challengeId, days), next);
  return next;
}

export function prefetchChallengeHistory(
  challengeId: number,
  days: number
): Promise<ChallengeHistoryItem[]> {
  const k = key(challengeId, days);

  const cached = historyCache.get(k);
  if (cached) return Promise.resolve(cached);

  const inFlight = historyInFlight.get(k);
  if (inFlight) return inFlight;

  const req = fetchChallengeHistory(challengeId, days).finally(() => {
    historyInFlight.delete(k);
  });

  historyInFlight.set(k, req);
  return req;
}
