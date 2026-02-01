import { useMemo } from "react";

export type TodayItem = {
  challenge_id: number;
  title: string;
  status_view: string;
};

type TodayPayload = {
  first_uncompleted: TodayItem | null;
  all: TodayItem[];
} | null;

type Flag = "MIN" | "BONUS" | "SKIP";

export function useTodayDerived(args: {
  today: TodayPayload;
  focusOverrideId: number | null;
  pending: Flag | null;
  note: string;
}) {
  const waiting = useMemo(() => {
    return (args.today?.all ?? []).filter((x) => x.status_view === "WAITING");
  }, [args.today]);

  const baseCurrent = args.today?.first_uncompleted ?? waiting[0] ?? null;

  const current = useMemo(() => {
    if (args.focusOverrideId == null) return baseCurrent;
    const found =
      (args.today?.all ?? []).find((x) => x.challenge_id === args.focusOverrideId) ?? null;
    return found ?? baseCurrent;
  }, [args.today, args.focusOverrideId, baseCurrent]);


  const challengeTitle = current?.title ?? "На сегодня всё";
  const currentStatus = current?.status_view ?? null;

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
    current != null &&
    args.pending != null &&
    (!noteRequired || args.note.trim().length > 0);

  const maxLen = args.pending === "SKIP" ? 200 : 140;

  return {
    baseCurrent,
    waiting,
    current,
    challengeTitle,
    currentStatus,
    noteLabel,
    notePlaceholder,
    noteRequired,
    canSave,
    maxLen,
  };
}
