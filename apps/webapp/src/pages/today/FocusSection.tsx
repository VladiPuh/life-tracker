import type { RefObject } from "react";
import { TodayCard } from "./TodayCard";
import type { TodayItem } from "../../shared/domain/types";
import { StatusButton } from "./components/StatusButton";
import { FocusPickDialog } from "./components/FocusPickDialog";

type Props = {
  pickOpen: boolean;
  pickTop: number;
  onClosePick: () => void;

  waiting: TodayItem[];
  current: TodayItem | null;

  onPickChallenge: (id: number) => void;
};

type FocusSectionProps = Props & {
  focusCardRef: RefObject<HTMLDivElement | null>;
  challengeTitle: string;
  currentStatus: string | null;
  onOpenPick: () => void;
  onNextFocus: () => void;

  err: string | null;

  requestPending: (flag: "MIN" | "BONUS" | "SKIP") => void;
  saving: boolean;
  pending: "MIN" | "BONUS" | "SKIP" | null;

  noteLabel: string;
  notePlaceholder: string;
  note: string;
  setNote: (v: string) => void;
  maxLen: number;

  canSave: boolean;
  saveForm: () => void;
  clearNote: () => void;
  closeForm: () => void;

  savedPulse: boolean;
};

export function FocusSection(props: FocusSectionProps) {
  const waitingCount = props.waiting.length;
  const commentRequired = props.pending === "SKIP";

  return (
    <>
      <FocusPickDialog
        pickOpen={props.pickOpen}
        pickTop={props.pickTop}
        onClosePick={props.onClosePick}
        waiting={props.waiting}
        current={props.current}
        onPickChallenge={props.onPickChallenge}
      />

      <div ref={props.focusCardRef}>
        <TodayCard title="Фокус дня">
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 800 }}>
                {props.challengeTitle}
              </div>

              {props.currentStatus && (
                <div style={{ marginTop: 6 }}>
                  <span
                    style={{
                      fontSize: 12,
                      padding: "4px 8px",
                      borderRadius: 999,
                      border: "1px solid rgba(0,0,0,0.12)",
                      background: "var(--lt-card)",
                      opacity: 0.85,
                    }}
                  >
                    Сегодня: {props.currentStatus}
                  </span>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
              <button
                onClick={props.onOpenPick}
                disabled={!waitingCount}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  border: "1px solid var(--lt-border)",
                  background: "var(--lt-card2)",
                  opacity: waitingCount ? 1 : 0.5,
                }}
              >
                ⟳
              </button>

              <button
                onClick={props.onNextFocus}
                disabled={!waitingCount}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  border: "1px solid var(--lt-border)",
                  background: "var(--lt-card2)",
                  opacity: waitingCount ? 1 : 0.5,
                }}
              >
                →
              </button>
            </div>
          </div>

          {props.err && (
            <div
              style={{
                marginTop: 10,
                padding: 10,
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.12)",
                background: "var(--lt-card)",
                fontSize: 12,
                opacity: 0.8,
              }}
            >
              Не удалось сохранить: {props.err}
            </div>
          )}

          {props.current ? (
            <div style={{ display: "flex", gap: 14, marginTop: 14 }}>
              <StatusButton
                title="Минимальный шаг выполнен"
                icon="✅"
                label="Есть"
                selected={props.pending === "MIN"}
                onClick={() => props.requestPending("MIN")}
              />

              <StatusButton
                title="Сделал больше обычного"
                icon="⭐"
                label="Сверх"
                selected={props.pending === "BONUS"}
                onClick={() => props.requestPending("BONUS")}
              />

              <StatusButton
                title="Сегодня пауза (с причиной)"
                icon="↩️"
                label="Пауза"
                selected={props.pending === "SKIP"}
                onClick={() => props.requestPending("SKIP")}
              />
            </div>
          ) : (
            <div style={{ marginTop: 10, fontSize: 13, opacity: 0.75 }}>
              На сегодня всё.
            </div>
          )}

          {props.pending && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 6 }}>
                {props.noteLabel}
                {commentRequired && (
                  <span
                    style={{
                      marginLeft: 6,
                      fontWeight: 700,
                      color: "#d44",
                    }}
                  >
                    обязательно
                  </span>
                )}
              </div>

              <div style={{ maxWidth: 420 }}>
                <div style={{ position: "relative" }}>
                  <textarea
                    value={props.note}
                    onChange={(e) =>
                      props.setNote(e.target.value.slice(0, props.maxLen))
                    }
                    rows={3}
                    placeholder={props.notePlaceholder}
                    style={{
                      width: "100%",
                      resize: "none",
                      padding: 10,
                      paddingRight: 48,
                      paddingBottom: 28,
                      borderRadius: 12,
                      border: "1px solid var(--lt-border)",
                      outline: "none",
                      fontSize: 13,
                      boxSizing: "border-box",
                    }}
                  />

                  {/* счётчик ВНУТРИ textarea */}
                  <div
                    style={{
                      position: "absolute",
                      right: 10,
                      bottom: 8,
                      fontSize: 11,
                      opacity: 0.6,
                      pointerEvents: "none",
                    }}
                  >
                    {props.note.length}/{props.maxLen}
                  </div>
                </div>
              </div>

              {/* КНОПКИ — ближе к textarea */}
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  marginTop: 8,
                  alignItems: "center",
                }}
              >
                <button
                  onClick={props.saveForm}
                  disabled={!props.canSave || props.saving}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid var(--lt-border)",
                    background: props.canSave
                      ? "var(--lt-card2)"
                      : "rgba(0,0,0,0.04)",
                    color: "var(--lt-text)",
                    fontWeight: 700,
                  }}
                >
                  {props.saving ? "Сохраняю…" : "Сохранить"}
                </button>

                <button
                  onClick={props.clearNote}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid var(--lt-border)",
                    background: "transparent",
                    opacity: 0.8,
                  }}
                >
                  Очистить
                </button>

                <button
                  onClick={props.closeForm}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid var(--lt-border)",
                    background: "transparent",
                    opacity: 0.8,
                  }}
                >
                  Закрыть
                </button>

                {props.savedPulse && (
                  <div style={{ fontSize: 12, opacity: 0.75 }}>
                    Зафиксировано
                  </div>
                )}
              </div>
            </div>
          )}
        </TodayCard>
      </div>
    </>
  );
}
