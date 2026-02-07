export type StatusKey = "MIN" | "BONUS" | "SKIP" | "FAIL";

type StatusMeta = {
  emoji: string;
  label: string;
};

export const STATUS_META: Record<StatusKey, StatusMeta> = {
  MIN: { emoji: "✅", label: "MIN" },
  BONUS: { emoji: "⭐", label: "BONUS" },
  SKIP: { emoji: "↩️", label: "SKIP" },
  FAIL: { emoji: "❌", label: "FAIL" },
};

const FALLBACK_META: StatusMeta = { emoji: "❓", label: "UNKNOWN" };

function isStatusKey(status: unknown): status is StatusKey {
  return status === "MIN" || status === "BONUS" || status === "SKIP" || status === "FAIL";
}

export function getStatusEmoji(status: unknown): string {
  return isStatusKey(status) ? STATUS_META[status].emoji : FALLBACK_META.emoji;
}

export function getStatusLabel(status: unknown): string {
  return isStatusKey(status) ? STATUS_META[status].label : FALLBACK_META.label;
}
