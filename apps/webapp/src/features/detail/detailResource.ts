import { apiDelete, apiGet, apiPatch } from "../../shared/api/client";

export type ChallengeDto = {
  id: number;
  type: "DO" | "NO_DO";
  title: string;
  description: string | null;
  is_active: boolean;
  icon?: string | null;
  miss_policy?: "FAIL" | "MIN";
  goal?: string | null;
  checkpoints?: string | null;
  min_activity_text?: string | null;
  min_minutes?: number | null;
  bonus_text?: string | null;
  constraints?: string | null;
  success_metrics?: string | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ChallengeListItem = {
  id: number;
  title: string;
  description?: string | null;
  type: "DO" | "NO_DO";
  is_active: boolean;
  icon?: string | null;
};

const challengeCache = new Map<number, ChallengeDto>();
const challengeInFlight = new Map<number, Promise<ChallengeDto>>();
let challengesListCache: ChallengeListItem[] | null = null;
let challengesListInFlight: Promise<ChallengeListItem[]> | null = null;

export function readChallengesListCache(): ChallengeListItem[] | null {
  return challengesListCache;
}

export async function fetchChallengesList(): Promise<ChallengeListItem[]> {
  const json = await apiGet<ChallengeListItem[]>("/challenges");
  const next = Array.isArray(json) ? json : [];
  challengesListCache = next;

  for (const item of next) {
    const prev = challengeCache.get(item.id);
    challengeCache.set(item.id, { ...(prev ?? ({} as ChallengeDto)), ...item });
  }
  return next;
}

export function prefetchChallengesList(): Promise<ChallengeListItem[]> {
  if (challengesListCache !== null) return Promise.resolve(challengesListCache);
  if (challengesListInFlight) return challengesListInFlight;

  const req = fetchChallengesList().finally(() => {
    challengesListInFlight = null;
  });
  challengesListInFlight = req;
  return req;
}

export function readChallengeCache(challengeId: number): ChallengeDto | null {
  return challengeCache.get(challengeId) ?? null;
}

export function writeChallengeCache(challenge: ChallengeDto): void {
  challengeCache.set(challenge.id, challenge);
}

export async function fetchChallenge(challengeId: number): Promise<ChallengeDto> {
  const json = await apiGet<ChallengeDto>(`/challenges/${challengeId}`);
  challengeCache.set(challengeId, json);

  if (challengesListCache) {
    challengesListCache = challengesListCache.map((x) =>
      x.id === challengeId
        ? {
            ...x,
            title: json.title,
            description: json.description,
            type: json.type,
            is_active: json.is_active,
            icon: json.icon ?? x.icon ?? null,
          }
        : x
    );
  }
  return json;
}

export function prefetchChallenge(challengeId: number): Promise<ChallengeDto> {
  const cached = challengeCache.get(challengeId);
  if (cached) return Promise.resolve(cached);

  const inFlight = challengeInFlight.get(challengeId);
  if (inFlight) return inFlight;

  const req = fetchChallenge(challengeId).finally(() => {
    challengeInFlight.delete(challengeId);
  });

  challengeInFlight.set(challengeId, req);
  return req;
}

export async function patchChallengeActive(challengeId: number, is_active: boolean): Promise<void> {
  await apiPatch(`/challenges/${challengeId}`, { is_active });

  const prev = challengeCache.get(challengeId);
  if (prev) {
    challengeCache.set(challengeId, { ...prev, is_active });
  }
  if (challengesListCache) {
    challengesListCache = challengesListCache.map((x) =>
      x.id === challengeId ? { ...x, is_active } : x
    );
  }
}

export async function deleteChallenge(challengeId: number): Promise<void> {
  await apiDelete(`/challenges/${challengeId}`);
  challengeCache.delete(challengeId);

  if (challengesListCache) {
    challengesListCache = challengesListCache.filter((x) => x.id !== challengeId);
  }
}
