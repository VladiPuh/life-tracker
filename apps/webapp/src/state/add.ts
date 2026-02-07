import { useCallback, useMemo, useState } from "react";
import { LifeTrackerApi } from "../shared/api/lifetracker";

type ChallengeType = "DO" | "NO_DO";
type MissPolicy = "FAIL" | "MIN";

type EditPayload = {
  id: number;
  title: string;
  description?: string | null;
  type: ChallengeType;
};

export function useAddState() {
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  // UI labels:
  // - DO    = "Активный"   (если не отметил — FAIL)
  // - NO_DO = "Постоянный" (если не отметил — MIN)
  const [newType, setNewType] = useState<ChallengeType>("DO");

  // Режим редактирования (null = создание)
  const [editingId, setEditingId] = useState<number | null>(null);

  const derivedMissPolicy = useMemo<MissPolicy>(
    () => (newType === "DO" ? "FAIL" : "MIN"),
    [newType]
  );

  const reset = useCallback(() => {
    setNewTitle("");
    setNewDesc("");
    setNewType("DO");
    setEditingId(null);
  }, []);

  const startEdit = useCallback((ch: EditPayload) => {
    setEditingId(ch.id);
    setNewTitle(ch.title ?? "");
    setNewDesc(ch.description ?? "");
    setNewType(ch.type);
  }, []);

  const save = useCallback(async () => {
    const title = newTitle.trim();
    const description = newDesc.trim() || null;

    if (!title) {
      throw new Error("Название обязательно");
    }

    if (editingId !== null) {
      // ВАЖНО: используем patchChallenge, потому что updateChallenge у тебя нет
      await LifeTrackerApi.patchChallenge(editingId, {
        title,
        description,
        type: newType,
        miss_policy: derivedMissPolicy,
      });
    } else {
      await LifeTrackerApi.createChallenge({
        title,
        description,
        type: newType,
        miss_policy: derivedMissPolicy,
      });
    }

    reset();
  }, [newTitle, newDesc, newType, derivedMissPolicy, editingId, reset]);

  return {
    newTitle,
    setNewTitle,
    newDesc,
    setNewDesc,

    newType,
    setNewType,
    derivedMissPolicy,

    editingId,
    startEdit,

    save,
    reset,
  };
}
