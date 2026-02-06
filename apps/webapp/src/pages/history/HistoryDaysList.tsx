import type { CSSProperties } from "react";
import type { DayVm } from "./dto";

export function HistoryDaysList(props: {
  shellStyle: CSSProperties;
  days: DayVm[];
  openingDay: string | null;
  hasAny: boolean;
  err: string | null;
  loading: boolean;
  daysDataIsNull: boolean;
  onOpenDay: (day: string) => void;
}) {
  const { shellStyle, days, openingDay, hasAny, err, loading,  onOpenDay } = props;

  const isBoot = false; // boot gated in HistoryPage

  return (
    <div style={shellStyle}>
      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>История</div>

      <div style={{ fontSize: 13, opacity: 0.7, maxWidth: 420, marginBottom: 14 }}>
        Факты по дням. Нажми на день — увидишь детали.
      </div>

      {err && (
        <div
          style={{
            marginBottom: 12,
            padding: 12,
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.12)",
            background: "rgba(0,0,0,0.02)",
            fontSize: 12,
            opacity: 0.8,
          }}
        >
          Не удалось загрузить историю: {err}
        </div>
      )}

      {/* ✅ ВАЖНО: пока идёт первый fetch — НЕ показываем "Пока здесь нет фактов" */}
      {!hasAny ? (

        <div
          style={{
            padding: 14,
            borderRadius: 14,
            border: "1px solid rgba(0,0,0,0.08)",
            background: "rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }}>
            Пока здесь нет фактов
          </div>
          <div style={{ fontSize: 13, opacity: 0.75, maxWidth: 420 }}>
            История появится после первых отметок в Today.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {days.map((x) => {
            const isOpening = openingDay === x.date;
            return (
              <div
                key={x.date}
                role="button"
                tabIndex={0}
                aria-disabled={Boolean(openingDay)}
                onClick={() => onOpenDay(x.date)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onOpenDay(x.date);
                }}
                style={{
                  padding: 14,
                  borderRadius: 14,
                  border: isOpening ? "1px solid rgba(0,0,0,0.20)" : "1px solid rgba(0,0,0,0.08)",
                  background: isOpening ? "rgba(0,0,0,0.06)" : "rgba(0,0,0,0.02)",
                  cursor: openingDay ? "default" : "pointer",
                  userSelect: "none",
                  transform: isOpening ? "scale(0.985)" : "scale(1)",
                  transition: "transform 140ms ease, background 140ms ease, border-color 140ms ease",
                  willChange: "transform",
                  opacity: openingDay && !isOpening ? 0.85 : 1,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 800 }}>{x.dateLabel}</div>
                  <div style={{ fontSize: 12, opacity: 0.65, whiteSpace: "nowrap" }}>
                    {isOpening ? "открываю…" : `записей: ${x.total}`}
                  </div>
                </div>

                <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>✅ {x.min}</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>⭐ {x.bonus}</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>↩️ {x.skip}</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>❌ {x.fail}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ✅ убрали "Загрузка..." совсем */}
      {loading && !isBoot ? <div style={{ height: 0 }} /> : null}
    </div>
  );
}
