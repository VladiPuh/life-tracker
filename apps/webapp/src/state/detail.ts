import { useCallback, useState } from "react";
import type { ChallengeFull, HistoryResponse, ChallengePatch } from "../shared/domain/types";
import { LifeTrackerApi } from "../shared/api/lifetracker";

export function useDetailState() {
  const [challengeFull, setChallengeFull] = useState<ChallengeFull | null>(null);
  const [history, setHistory] = useState<HistoryResponse | null>(null);

  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editMiss, setEditMiss] = useState<"FAIL" | "MIN">("FAIL");
  const [editActive, setEditActive] = useState(true);

  const loadChallenge = useCallback(async (challengeId: number) => {
    const data = await LifeTrackerApi.getChallenge(challengeId);
    setChallengeFull(data);
    setEditMiss(data.miss_policy === "MIN" ? "MIN" : "FAIL");
    setEditActive(data.is_active);
    setEditDesc(data.description ?? "");
    setEditTitle(data.title ?? "");
  }, []);

  const loadHistory = useCallback(async (challengeId: number) => {
    const data = await LifeTrackerApi.getHistory(challengeId, 30);
    setHistory(data);
  }, []);

  const saveTitle = useCallback(async (challengeId: number) => {
    const payload: ChallengePatch = { title: editTitle.trim() || null };
    await LifeTrackerApi.patchChallenge(challengeId, payload);
    await loadChallenge(challengeId);
  }, [editTitle, loadChallenge]);

  const saveDesc = useCallback(async (challengeId: number) => {
    const payload: ChallengePatch = { description: editDesc.trim() || null };
    await LifeTrackerApi.patchChallenge(challengeId, payload);
    await loadChallenge(challengeId);
  }, [editDesc, loadChallenge]);

  const savePolicyAndActive = useCallback(async (challengeId: number) => {
    await LifeTrackerApi.patchChallenge(challengeId, {
      miss_policy: editMiss,
      is_active: editActive,
    });
    await loadChallenge(challengeId);
  }, [editMiss, editActive, loadChallenge]);

  return {
    challengeFull,
    history,

    editTitle, setEditTitle,
    editDesc, setEditDesc,
    editMiss, setEditMiss,
    editActive, setEditActive,

    loadChallenge,
    loadHistory,
    saveTitle,
    saveDesc,
    savePolicyAndActive,
  };
}
