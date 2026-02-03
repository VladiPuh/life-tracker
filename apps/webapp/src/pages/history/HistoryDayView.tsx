import type { CSSProperties } from "react";
import type { HistoryDayDetailDto } from "./dto";
import { useEffect, useState } from "react";
import { HistoryChallengeRow } from "./HistoryChallengeRow";
import { HistoryChallengeEdit } from "./HistoryChallengeEdit";
import { LifeTrackerApi } from "../../shared/api/lifetracker";


export function HistoryDayView(props: {
  shellStyle: CSSProperties;
  dateLabel: string;
  detail: HistoryDayDetailDto;
  err: string | null;
  statusLabel: (s: unknown) => string;
  onPatchItem?: (
    challenge_id: number,
    patch: { status_view: "MIN" | "BONUS" | "SKIP" | "FAIL"; minutes_fact: number | null; comment: string | null }
  ) => void;
}) {
  const { shellStyle, dateLabel, detail, err, statusLabel, onPatchItem } = props;
    
  const [editingId, setEditingId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  useEffect(() => {
      // Override BackBar while editing: Back == Cancel (reset + close)
      if (editingId !== null) {
        (window as any).__LT_BACK_OVERRIDE__ = () => {
          const cancel = (window as any).__LT_EDIT_CANCEL__ as undefined | (() => boolean | void);

          // Если cancel зарегистрирован — он сам решает, закрывать edit или нет.
          // Даже если cancel вернул false (юзер нажал "не отменять") — считаем back обработанным.
          if (typeof cancel === "function") {
            cancel();
            return true;
          }

          // fallback: если cancel не зарегистрирован — хотя бы закрыть edit
          setSaveError(null);
          setEditingId(null);
          return true;
        };

        return () => {
          if ((window as any).__LT_BACK_OVERRIDE__) {
            delete (window as any).__LT_BACK_OVERRIDE__;
          }
        };
      }

      if ((window as any).__LT_BACK_OVERRIDE__) {
        delete (window as any).__LT_BACK_OVERRIDE__;
      }
    }, [editingId]);
    
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
          {detail.items.map((it, idx) => {
            const isEditing = editingId === it.challenge_id;

            if (isEditing) {
              return (
                <div
                  key={`${it.challenge_id}`}
                  style={{
                    borderRadius: 16,
                    padding: 14,
                    background: "rgba(0,0,0,0.22)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <HistoryChallengeEdit
                    it={it}
                    dateLabel={dateLabel}
                    errorText={saveError}
                    onCancel={() => {
                      setSaveError(null);
                      setEditingId(null);
                    }}
                    onSave={async (draft) => {
                      try {
                        setSaveError(null);

                        // FAIL/SKIP требуют комментарий (иначе backend вернёт 422)
                        if ((draft.status_view === "FAIL" || draft.status_view === "SKIP") && !draft.comment) {
                          setSaveError("Для FAIL/SKIP нужен комментарий");
                          return;
                        }

                        await LifeTrackerApi.setDailyFlag(
                          it.challenge_id,
                          draft.status_view,
                          draft.comment,
                          draft.minutes_fact,
                        );

                        onPatchItem?.(it.challenge_id, {
                          status_view: draft.status_view,
                          minutes_fact: draft.minutes_fact,
                          comment: draft.comment,
                        });

                        setSaveError(null);
                        setEditingId(null);
                        setToast("Сохранено");
                      } catch (e: any) {
                        const msg = e?.message || e?.response?.data?.detail || "Ошибка сохранения";
                        setSaveError(msg);
                        setToast(msg);
                      }
                    }}
                  />
                </div>
              );
            }

            return (
              <div
                key={`${it.challenge_id}`}
                style={{
                  borderRadius: 14,
                  padding: 12,
                  background: idx % 2 === 0 ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.14)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <HistoryChallengeRow
                  it={it}
                  statusLabel={statusLabel}
                  onEdit={() => {
                    setSaveError(null);
                    setEditingId(it.challenge_id);
                  }}
                />
              </div>
            );

            })}
        </div>
      )}
            {toast && (
              <div
                style={{
                  position: "fixed",
                  left: 12,
                  right: 12,
                  top: "calc(10px + var(--safe-top, 0px))",
                  zIndex: 2000,

                  padding: "10px 14px",
                  borderRadius: 12,

                  background: "rgba(0,0,0,0.78)",
                  border: "1px solid rgba(255,255,255,0.12)",

                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 600,
                  textAlign: "center",

                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",

                  pointerEvents: "none",
                }}
              >
                {toast}
              </div>
            )}
    </div>
  );
}
