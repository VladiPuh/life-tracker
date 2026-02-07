import { apiGet } from "../../shared/api/client";

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

const challengeCache = new Map<number, ChallengeDto>();
const challengeInFlight = new Map<number, Promise<ChallengeDto>>();

export function readChallengeCache(challengeId: number): ChallengeDto | null {
  return challengeCache.get(challengeId) ?? null;
}

export function writeChallengeCache(challenge: ChallengeDto): void {
  challengeCache.set(challenge.id, challenge);
}

export async function fetchChallenge(challengeId: number): Promise<ChallengeDto> {
  const json = await apiGet<ChallengeDto>(`/challenges/${challengeId}`);
  challengeCache.set(challengeId, json);
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
