import type { HistoryDayDetailDto } from "../dto";
import { HistoryChallengeRow } from "../HistoryChallengeRow";

type Item = HistoryDayDetailDto["items"][number];

export function HistoryItemCard(props: {
  it: Item;
  idx: number;
  statusLabel: (s: unknown) => string;
  onEdit: () => void;
}) {
  const { it, idx, statusLabel, onEdit } = props;

  return (
    <div
      style={{
        borderRadius: 14,
        padding: 12,
        background: idx % 2 === 0 ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.14)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <HistoryChallengeRow it={it} statusLabel={statusLabel} onEdit={onEdit} />
    </div>
  );
}
