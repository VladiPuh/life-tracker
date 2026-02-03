import { useMemo, useState } from "react";
import type { HistoryDayDetailItemDto } from "./dto";

export type EditDraft = {
  status_view: "MIN" | "BONUS" | "SKIP" | "FAIL";
  minutes_fact: number | null;
  comment: string | null;
};

export function useHistoryEditDraft(it: HistoryDayDetailItemDto) {
  const initial = useMemo<EditDraft>(
    () => ({
      status_view: it.status_view,
      minutes_fact: it.minutes_fact ?? null,
      comment: it.comment ?? null,
    }),
    [it]
  );

  const [draft, setDraft] = useState<EditDraft>(initial);

  const dirty =
    draft.status_view !== initial.status_view ||
    (draft.minutes_fact ?? null) !== (initial.minutes_fact ?? null) ||
    (draft.comment ?? null) !== (initial.comment ?? null);

  return {
    draft,
    setDraft,
    dirty,
    reset: () => setDraft(initial),
  };
}
