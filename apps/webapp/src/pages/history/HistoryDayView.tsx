import type { CSSProperties } from "react";

type HistoryDayDetailItemDto = {
  challenge_id: number;
  title: string;
  status_view: "MIN" | "BONUS" | "SKIP" | "FAIL";
  minutes_fact: number | null;
  comment: string | null;
};

type HistoryDayDetailDto = {
  date: string;
  items: HistoryDayDetailItemDto[];
};

export function HistoryDayView(props: {
  shellStyle: CSSProperties;
  dateLabel: string;
  detail: HistoryDayDetailDto;
  err: string | null;
  statusLabel: (s: unknown) => string;
}) {
  const { shellStyle, dateLabel, detail, err, statusLabel } = props;

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
          {detail.items.map((it) => (
            <div
              key={`${it.challenge_id}`}
              style={{
                padding: 14,
                borderRadius: 14,
                border: "1px solid rgba(0,0,0,0.08)",
                background: "rgba(0,0,0,0.02)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 800 }}>{it.title}</div>
                <div style={{ fontSize: 12, opacity: 0.8, whiteSpace: "nowrap" }}>
                  {statusLabel(it.status_view)}
                </div>
              </div>

              {(it.minutes_fact != null || (it.comment ?? "").trim().length > 0) && (
                <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8, lineHeight: 1.35 }}>
                  {it.minutes_fact != null && <div>Минут: {it.minutes_fact}</div>}
                  {(it.comment ?? "").trim().length > 0 && <div>Комментарий: {it.comment}</div>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
