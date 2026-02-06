import { useCallback, useMemo, useState } from "react";
import { LifeTrackerApi } from "../shared/api/lifetracker";

type ChallengeType = "DO" | "NO_DO";
type MissPolicy = "FAIL" | "MIN";

export function useAddState() {
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  // UI labels:
  // - DO    = "Активный"   (если не отметил — FAIL)
  // - NO_DO = "Постоянный" (если не отметил — MIN)
  const [newType, setNewType] = useState<ChallengeType>("DO");

  const derivedMissPolicy = useMemo<MissPolicy>(
    () => (newType === "DO" ? "FAIL" : "MIN"),
    [newType]
  );

  const reset = useCallback(() => {
    setNewTitle("");
    setNewDesc("");
    setNewType("DO");
  }, []);

  const create = useCallback(async () => {
    if (!newTitle.trim()) {
      throw new Error("Название обязательно");
    }

    await LifeTrackerApi.createChallenge({
      title: newTitle.trim(),
      description: newDesc.trim() || null,
      type: newType,
      miss_policy: derivedMissPolicy,
    });

    reset();
  }, [newTitle, newDesc, newType, derivedMissPolicy, reset]);

  return {
    newTitle,
    setNewTitle,
    newDesc,
    setNewDesc,

    newType,
    setNewType,
    derivedMissPolicy, // если захочешь показывать подпись в UI

    create,
    reset,
  };
}
