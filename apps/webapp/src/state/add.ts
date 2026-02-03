import { useCallback, useState } from "react";
import { LifeTrackerApi } from "../shared/api/lifetracker";

type MissPolicy = "FAIL" | "MIN";

export function useAddState() {
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newMissPolicy, setNewMissPolicy] = useState<MissPolicy>("FAIL");

  const reset = useCallback(() => {
    setNewTitle("");
    setNewDesc("");
    setNewMissPolicy("FAIL");
  }, []);

  const create = useCallback(async () => {
    if (!newTitle.trim()) {
      throw new Error("Название обязательно");
    }

    await LifeTrackerApi.createChallenge({
      title: newTitle.trim(),
      description: newDesc.trim() || null,
      miss_policy: newMissPolicy,
    });

    reset();
  }, [newTitle, newDesc, newMissPolicy, reset]);

  return {
    newTitle, setNewTitle,
    newDesc, setNewDesc,
    newMissPolicy, setNewMissPolicy,
    create,
    reset,
  };
}
