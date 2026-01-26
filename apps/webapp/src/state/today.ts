import { useCallback, useMemo, useState } from "react";
import type { TodayResponse } from "../shared/domain/types";
import { LifeTrackerApi } from "../shared/api/lifetracker";

type Flag = "MIN" | "BONUS" | "SKIP" | "FAIL";

export function useTodayState() {
  const [today, setToday] = useState<TodayResponse | null>(null);
  const [showAll, setShowAll] = useState(false);

  const selectedById = useMemo(() => {
    const map = new Map<number, TodayResponse["all"][number]>();
    for (const ch of today?.all ?? []) map.set(ch.challenge_id, ch);
    return map;
  }, [today]);

  const loadToday = useCallback(async () => {
    const data = await LifeTrackerApi.getToday();
    setToday(data);
  }, []);

  const setFlag = useCallback(async (challenge_id: number, flag: Flag) => {
    await LifeTrackerApi.setDailyFlag(challenge_id, flag);
    await loadToday();
  }, [loadToday]);

  const resetShowAll = useCallback(() => setShowAll(false), []);
  const toggleShowAll = useCallback(() => setShowAll((v) => !v), []);

  return {
    today,
    setToday, // оставляем на время миграции (потом уберём)
    showAll,
    setShowAll, // оставляем на время миграции (потом уберём)

    selectedById,

    loadToday,
    setFlag,

    resetShowAll,
    toggleShowAll,
  };
}
