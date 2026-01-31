import type { RefObject } from "react";
import { TodayCard } from "./TodayCard";

type WaitingItem = {
  challenge_id: number;
  title: string;
  status_view: string;
};

type CurrentItem = {
  challenge_id: number;
  title: string;
  status_view: string;
} | null;

function StatusButton(props: {
  title: string;
  icon: string;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      title={props.title}
      aria-label={props.title}
      onClick={props.onClick}
      style={{
        padding: "14px 16px",
        borderRadius: 14,
        border: "1px solid var(--lt-border)",
        background: "var(--lt-card2)",
        color: "var(--lt-text)",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 88,
        height: 74,
        gap: 4,
      }}
    >
      <div style={{ fontSize: 26, lineHeight: 1 }}>{props.icon}</div>
      <div style={{ fontSize: 12, opacity: 0.75 }}>{props.label}</div>
    </button>
  );
}

export function FocusSection(props: {
  // picker modal
  pickOpen: boolean;
  pickTop: number;
  onClosePick: () => void;
  waiting: WaitingItem[];
  current: CurrentItem;
  onPickChallenge: (id: number) => void;

  // focus header
  focusCardRef: RefObject<HTMLDivElement | null>;
  challengeTitle: string;
  currentStatus: string | null;
  onOpenPick: () => void;
  onNextFocus: () => void;

  // error
  err: string | null;

  // fixation/form
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
}) {
  const waitingCount = props.waiting.length;

  return (
    <>
      {props.pickOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={props.onClosePick}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999,
            background: "rgba(0,0,0,0.55)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              left: 16,
              right: 16,
              top: props.pickTop,
              borderRadius: 18,
              border: "1px solid var(--lt-border)",
              background: "var(--lt-card)",
              padding: 14,
              maxHeight: `calc(100vh - ${props.pickTop}px - 120px)`,
              overflow: "auto",
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: 10 }}>Выбери фокус</div>

            {props.waiting
              .filter((x) => x.challenge_id !== props.current?.challenge_id)
              .map((x) => (
                <button
                  key={x.challenge_id}
                  onClick={() => props.onPickChallenge(x.challenge_id)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 10px",
                    borderRadius: 14,
                    border: "1px solid var(--lt-border)",
                    background: "var(--lt-card2)",
                    color: "var(--lt-text)",
                    cursor: "pointer",
                    marginBottom: 8,
                  }}
                >
                  {x.title}
                </button>
              ))}

            <button
              onClick={props.onClosePick}
              style={{
                width: "100%",
                marginTop: 6,
                padding: "12px 12px",
                borderRadius: 14,
                border: "1px solid var(--lt-border)",
                background: "transparent",
                color: "var(--lt-text)",
                cursor: "pointer",
              }}
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      {/* Фокус дня + фиксация — единый контейнер */}
      <div ref={props.focusCardRef}>
        <TodayCard title="Фокус дня">
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{props.challengeTitle}</div>

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
                    title="Текущий статус на сегодня"
                  >
                    Сегодня: {props.currentStatus}
                  </span>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 8, marginLeft: "auto", paddingRight: 2 }}>
              <button
                title="Заменить"
                aria-label="Заменить"
                onClick={props.onOpenPick}
                disabled={!waitingCount}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  border: "1px solid var(--lt-border)",
                  background: "var(--lt-card2)",
                  color: "var(--lt-text)",
                  cursor: waitingCount ? "pointer" : "default",
                  opacity: waitingCount ? 1 : 0.5,
                  display: "grid",
                  placeItems: "center",
                  userSelect: "none",
                  fontSize: 16,
                  lineHeight: "16px",
                }}
              >
                ⟳
              </button>

              <button
                title="Следующий"
                aria-label="Следующий"
                onClick={props.onNextFocus}
                disabled={!waitingCount}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  border: "1px solid var(--lt-border)",
                  background: "var(--lt-card2)",
                  color: "var(--lt-text)",
                  cursor: waitingCount ? "pointer" : "default",
                  opacity: waitingCount ? 1 : 0.5,
                  display: "grid",
                  placeItems: "center",
                  userSelect: "none",
                  fontSize: 16,
                  lineHeight: "16px",
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

          {/* Фиксация / end-state */}
          {props.current ? (
            <div style={{ display: "flex", gap: 14, marginTop: 14, flexWrap: "wrap" }}>
              <StatusButton
                title="Минимальный шаг выполнен"
                icon="✅"
                label="Есть"
                onClick={() => props.requestPending("MIN")}
              />
              <StatusButton
                title="Сделал больше обычного"
                icon="⭐"
                label="Сверх"
                onClick={() => props.requestPending("BONUS")}
              />
              <StatusButton
                title="Сегодня пауза (с причиной)"
                icon="↩️"
                label="Пауза"
                onClick={() => props.requestPending("SKIP")}
              />
            </div>
          ) : (
            <div style={{ marginTop: 10, fontSize: 13, opacity: 0.75 }}>На сегодня всё.</div>
          )}

          {props.pending && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>{props.noteLabel}</div>

              <div style={{ maxWidth: 420 }}>
                <textarea
                  value={props.note}
                  onChange={(e) => props.setNote(e.target.value.slice(0, props.maxLen))}
                  rows={3}
                  maxLength={props.maxLen}
                  placeholder={props.notePlaceholder}
                  style={{
                    width: "100%",
                    resize: "none",
                    padding: 10,
                    borderRadius: 12,
                    border: "1px solid var(--lt-border)",
                    outline: "none",
                    fontFamily: "inherit",
                    fontSize: 13,
                    boxSizing: "border-box",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginTop: 4,
                    fontSize: 11,
                    opacity: 0.6,
                  }}
                >
                  {props.note.length}/{props.maxLen}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 10, alignItems: "center" }}>
                <button
                  onClick={props.saveForm}
                  disabled={!props.canSave || props.saving}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(0,0,0,0.12)",
                    background: props.canSave ? "white" : "rgba(0,0,0,0.04)",
                    cursor: props.canSave && !props.saving ? "pointer" : "not-allowed",
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
                    border: "1px solid rgba(0,0,0,0.12)",
                    background: "transparent",
                    cursor: "pointer",
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
                    border: "1px solid rgba(0,0,0,0.12)",
                    background: "transparent",
                    cursor: "pointer",
                    opacity: 0.8,
                  }}
                >
                  Закрыть
                </button>

                {props.savedPulse && (
                  <div style={{ fontSize: 12, opacity: 0.75 }}>Зафиксировано</div>
                )}
              </div>
            </div>
          )}
        </TodayCard>
      </div>
    </>
  );
}
