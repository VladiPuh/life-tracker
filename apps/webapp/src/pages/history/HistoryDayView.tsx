import type { CSSProperties } from "react";
import type { HistoryDayDetailDto } from "./dto";
import { useEffect, useState } from "react";
import { HistoryChallengeRow } from "./HistoryChallengeRow";
import { HistoryChallengeEdit } from "./HistoryChallengeEdit";


export function HistoryDayView(props: {
  shellStyle: CSSProperties;
  dateLabel: string;
  detail: HistoryDayDetailDto;
  err: string | null;
  statusLabel: (s: unknown) => string;
}) {
  const { shellStyle, dateLabel, detail, err, statusLabel } = props;
    
  const [editingId, setEditingId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 1400);
    return () => window.clearTimeout(t);
  }, [toast]);

  return (
    <div style={shellStyle}>
      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>{dateLabel}</div>

      {err && (
        <div
          style={{
            marginTop: 10,
            padding: 12,
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.12)",
            background: "rgba(0,0,0,0.02)",
            fontSize: 12,
          }}
        >
          Не удалось загрузить день: {err}
        </div>
      )}

      {detail.items.length === 0 ? (
        <div style={{ opacity: 0.7 }}>Нет фактов за этот день.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {detail.items.map((it) => {
            const isEditing = editingId === it.challenge_id;

            if (isEditing) {
                return (
                <HistoryChallengeEdit
                    key={`${it.challenge_id}`}
                    it={it}
                    dateLabel={dateLabel}
                    onCancel={() => setEditingId(null)}
                    onSave={() => {
                        setEditingId(null);
                        setToast(`Изменения сохранены (${dateLabel})`);
                        }}
                />
                );
            }

            return (
                <HistoryChallengeRow
                key={`${it.challenge_id}`}
                it={it}
                statusLabel={statusLabel}
                onEdit={() => setEditingId(it.challenge_id)}
                />
            );
            })}
        </div>
      )}
            {toast && (
        <div
          style={{
            position: "fixed",
            left: 16,
            right: 16,
            bottom: 16,
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.14)",
            background: "rgba(255,255,255,0.92)",
            fontSize: 12,
            opacity: 0.95,
            zIndex: 50,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
