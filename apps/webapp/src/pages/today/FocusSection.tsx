import { useRef, type RefObject } from "react";
import { TodayCard } from "./TodayCard";
import type { TodayItem } from "../../shared/domain/types";
import { StatusButton } from "./components/StatusButton";
import { FocusPickDialog } from "./components/FocusPickDialog";
import { useAutosizeTextarea } from "../../shared/ui/useAutosizeTextarea";

type FocusSectionProps = {
  boot: boolean;

  pickOpen: boolean;
  pickTop: number;
  onClosePick: () => void;

  waiting: TodayItem[];
  current: TodayItem | null;
  onPickChallenge: (id: number) => void;

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

function SkeletonBar(props: { w: number; h: number; r?: number }) {
  const { w, h, r = 10 } = props;
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: r,
        background:
          "linear-gradient(90deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.12) 45%, rgba(255,255,255,0.06) 100%)",
        backgroundSize: "220% 100%",
        animation: "ltSk 1.15s ease-in-out infinite",
      }}
    />
  );
}

export function FocusSection(props: FocusSectionProps) {
  const noteRef = useRef<HTMLTextAreaElement | null>(null);
  useAutosizeTextarea(noteRef, props.note ?? "", { minHeight: 88, maxHeight: 220 });

  const waitingDo = props.waiting.filter((x) => x.type === "DO");
  const waitingCount = waitingDo.length;
  const hasFocus = Boolean(props.current);
  const commentRequired = props.pending === "SKIP";
  const needRed = commentRequired && props.note.trim().length === 0;

  if (props.boot) {
    return (
      <>
        <style>
          {`@keyframes ltSk{0%{background-position:0% 0}100%{background-position:220% 0}}`}
        </style>

        <div ref={props.focusCardRef}>
          <TodayCard title="Фокус дня">
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <SkeletonBar w={220} h={18} r={10} />
                <div style={{ marginTop: 8 }}>
                  <SkeletonBar w={140} h={14} r={999} />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 14, marginTop: 14, justifyContent: "center" }}>
              <SkeletonBar w={92} h={36} r={999} />
              <SkeletonBar w={92} h={36} r={999} />
              <SkeletonBar w={92} h={36} r={999} />
            </div>
          </TodayCard>
        </div>
      </>
    );
  }

  const titleText = hasFocus
    ? props.challengeTitle
    : waitingCount
      ? "Фокус не выбран"
      : "На сегодня всё.";

  return (
    <>
      <FocusPickDialog
        pickOpen={props.pickOpen}
        pickTop={props.pickTop}
        onClosePick={props.onClosePick}
        waiting={waitingDo}
        current={hasFocus ? props.current : null}
        onPickChallenge={props.onPickChallenge}
      />

      <div ref={props.focusCardRef}>
        <TodayCard title="Фокус дня">
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{titleText}</div>

              {hasFocus && props.currentStatus && (
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

          {hasFocus ? (
            <div
              style={{
                display: "flex",
                gap: 14,
                marginTop: 14,
                justifyContent: "center",
                width: "100%",
                flexWrap: "wrap",
              }}
            >
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

              <div style={{ position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: "50%",
                    transform: "translate(-50%, -115%)",
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <button
                    type="button"
                    onClick={props.onOpenPick}
                    disabled={!waitingCount}
                    title="Выбрать челлендж"
                    aria-label="Выбрать челлендж"
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 999,
                      border: "none",
                      background: "transparent",
                      color: "var(--lt-text)",
                      opacity: waitingCount ? 0.9 : 0.4,
                      cursor: waitingCount ? "pointer" : "default",
                      padding: 0,
                      lineHeight: 1,
                      fontSize: 18,
                    }}
                  >
                    🎯
                  </button>

                  <button
                    type="button"
                    onClick={props.onNextFocus}
                    disabled={!waitingCount}
                    title="Следующий челлендж"
                    aria-label="Следующий челлендж"
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 999,
                      border: "none",
                      background: "transparent",
                      color: "var(--lt-text)",
                      opacity: waitingCount ? 0.9 : 0.4,
                      cursor: waitingCount ? "pointer" : "default",
                      padding: 0,
                      lineHeight: 1,
                      fontSize: 18,
                    }}
                  >
                    →
                  </button>
                </div>

                <StatusButton
                  title="Сегодня пауза (с причиной)"
                  icon="↩️"
                  label="Пауза"
                  selected={props.pending === "SKIP"}
                  onClick={() => props.requestPending("SKIP")}
                />
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 14, textAlign: "center" }}>
              {waitingCount ? (
                <button
                  type="button"
                  onClick={props.onOpenPick}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(255,255,255,0.06)",
                    color: "var(--lt-text)",
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Выбрать фокус
                </button>
              ) : (
                <div style={{ fontSize: 13, opacity: 0.75 }}>
                  Поздравляю, возвращайся завтра! Или создай новый челлендж прямо сейчас.
                </div>
              )}
            </div>
          )}

          {props.pending && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 6 }}>{props.noteLabel}</div>

              <div style={{ maxWidth: 420 }}>
                <div
                  style={{
                    padding: 10,
                    borderRadius: 12,
                    border: needRed
                      ? "1px solid rgba(212,68,68,0.45)"
                      : "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.03)",
                  }}
                >
                  <div style={{ position: "relative" }}>
                    <textarea
                      ref={noteRef}
                      value={props.note}
                      onChange={(e) => props.setNote(e.target.value.slice(0, props.maxLen))}
                      rows={3}
                      placeholder={props.notePlaceholder}
                      className="autosize-ta"
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
                        background: "rgba(255,255,255,0.02)",
                      }}
                    />

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
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 8, alignItems: "center", flexWrap: "wrap" }}>
                <button
                  onClick={props.saveForm}
                  disabled={!props.canSave || props.saving}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid var(--lt-border)",
                    background: props.canSave ? "var(--lt-card2)" : "rgba(0,0,0,0.04)",
                    color: "var(--lt-text)",
                    fontWeight: 800,
                    cursor: props.canSave ? "pointer" : "default",
                  }}
                >
                  {props.saving ? "Сохраняю..." : "Сохранить"}
                </button>

                <button
                  onClick={props.clearNote}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid var(--lt-border)",
                    background: "transparent",
                    opacity: 0.85,
                    cursor: "pointer",
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
                    opacity: 0.85,
                    cursor: "pointer",
                  }}
                >
                  Закрыть
                </button>

                {props.savedPulse && <div style={{ fontSize: 12, opacity: 0.75 }}>Зафиксировано</div>}
              </div>
            </div>
          )}
        </TodayCard>
      </div>
    </>
  );
}
