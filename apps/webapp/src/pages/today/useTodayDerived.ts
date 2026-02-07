import { useMemo } from "react";
import type { TodayItem } from "../../shared/domain/types";

type Flag = "MIN" | "BONUS" | "SKIP";

export function useTodayDerived(args: {
  today: { first_uncompleted: TodayItem | null; all: TodayItem[] } | null;
  focusOverrideId: number | null;
  pending: Flag | null;
  note: string;
}) {
  const boot = args.today === null;
  const all = args.today?.all ?? [];

  const waiting = useMemo(() => {
    return all.filter((x: TodayItem) => x.type === "DO" && x.status_view == null);
  }, [all]);

  const baseCurrent = useMemo(() => {
    const first = args.today?.first_uncompleted ?? null;
    if (first && first.type === "DO" && first.status_view == null) return first;
    return waiting[0] ?? null;
  }, [args.today, waiting]);

  const current = useMemo(() => {
    if (args.focusOverrideId == null) return baseCurrent;
    const found =
      all.find(
        (x) =>
          x.challenge_id === args.focusOverrideId &&
          x.type === "DO" &&
          x.status_view == null
      ) ?? null;
    return found ?? baseCurrent;
  }, [all, args.focusOverrideId, baseCurrent]);

  const challengeTitle = boot ? "…" : current?.title ?? "На сегодня всё";
  const currentStatus = boot ? null : current?.status_view ?? null;

  const noteLabel =
    args.pending === "SKIP"
      ? "Причина паузы (обязательно)"
      : args.pending === "BONUS"
      ? "Комментарий (что было сверх?)"
      : "Комментарий";

  const notePlaceholder =
    args.pending === "SKIP"
      ? "Например: сделал меньше, устал, болит плечо, мало времени…"
      : "Коротко, по желанию…";

  const noteRequired = args.pending === "SKIP";

  const canSave =
    !boot &&
    current != null &&
    args.pending != null &&
    (!noteRequired || args.note.trim().length > 0);

  const maxLen = args.pending === "SKIP" ? 200 : 140;

  return {
    boot,
    baseCurrent,
    waiting,
    current: boot ? null : current,
    challengeTitle,
    currentStatus,
    noteLabel,
    notePlaceholder,
    noteRequired,
    canSave,
    maxLen,
  };
}
