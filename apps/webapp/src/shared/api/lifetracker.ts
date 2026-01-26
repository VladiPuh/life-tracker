import { apiGet, apiPost, apiPatch } from "./client";
import type {
  TodayResponse,
  TemplateItem,
  HistoryResponse,
  ChallengePatch,
  ChallengeFull,
} from "../domain/types";

export const LifeTrackerApi = {
  // Today
  getToday(): Promise<TodayResponse> {
    return apiGet<TodayResponse>("/today");
  },

  // Challenge
  getChallenge(challengeId: number): Promise<ChallengeFull> {
    return apiGet<ChallengeFull>(`/challenges/${challengeId}`);
  },

  getHistory(challengeId: number, days = 30): Promise<HistoryResponse> {
    return apiGet<HistoryResponse>(`/challenges/${challengeId}/history?days=${days}`);
  },

  patchChallenge(challengeId: number, payload: ChallengePatch): Promise<{ ok: true }> {
    return apiPatch(`/challenges/${challengeId}`, payload) as Promise<{ ok: true }>;
  },

  // Daily log
  setDailyFlag(challenge_id: number, flag: "MIN" | "BONUS" | "SKIP" | "FAIL"): Promise<{ ok: true }> {
    return apiPost("/daily-log/upsert", { challenge_id, flag }) as Promise<{ ok: true }>;
  },

  // Templates
  getTemplates(): Promise<TemplateItem[]> {
    return apiGet<TemplateItem[]>("/templates");
  },

  addTemplate(template_id: number): Promise<{ challenge_id: number }> {
    return apiPost(`/templates/${template_id}/add`) as Promise<{ challenge_id: number }>;
  },

  // Create challenge (MVP)
  createChallenge(payload: {
    title: string;
    description: string | null;
    miss_policy: "FAIL" | "MIN" | "BONUS" | "SKIP";
  }): Promise<{ id: number }> {
    return apiPost("/challenges", payload) as Promise<{ id: number }>;
  },
} as const;
