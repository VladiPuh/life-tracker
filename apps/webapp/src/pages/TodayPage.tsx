import { useEffect, useState } from "react";
import { useTodayState } from "../state/today";
import type { ReactNode } from "react";



function Card(props: {
  title?: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  const isClickable = Boolean(props.onClick);

  return (
    <section
      onClick={props.onClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={(e) => {
        if (!isClickable) return;
        if (e.key === "Enter" || e.key === " ") props.onClick?.();
      }}
      style={{
        padding: 14,
        border: "1px solid var(--lt-border)",
        borderRadius: 14,
        background: "var(--lt-card)",
        marginBottom: 12,

        cursor: isClickable ? "pointer" : "default",
        userSelect: isClickable ? "none" : "auto",
      }}
    >
      {props.title && (
        <div style={{ fontWeight: 700, marginBottom: 10 }}>{props.title}</div>
      )}

      {props.children}
    </section>
  );
}

function StatusButton(props: {
  title: string;
  icon: ReactNode;
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

export function TodayPage(props: { onGoChallenges: () => void }) {
  type Flag = "MIN" | "BONUS" | "SKIP";
  const [pending, setPending] = useState<Flag | null>(null);
  const [note, setNote] = useState<string>("");
  const [savedPulse, setSavedPulse] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const { today, loadToday, setFlag } = useTodayState();
  const current = today?.first_uncompleted ?? null;
  useEffect(() => {
    void loadToday();
  }, [loadToday]);
  useEffect(() => {
    if (!savedPulse) return;
    const t = window.setTimeout(() => setSavedPulse(false), 1200);
    return () => window.clearTimeout(t);
  }, [savedPulse]);


  // Поддержим твой UI текстами, без вычислений
  const challengeTitle = current?.title ?? "На сегодня всё";
  const currentStatus = current?.status_view ?? null;

  const closeForm = () => {
    setPending(null);
    setNote("");
  };

  const clearNote = () => {
    setNote("");
    setSavedPulse(false);
  };

  const saveForm = async () => {
    if (saving) return;
    if (!current || !pending) return;

    setSaving(true);
    setErr(null);

    try {
      const trimmed = note.trim();
      await setFlag(current.challenge_id, pending, trimmed.length ? trimmed : null);

      closeForm();
      setSavedPulse(true);
    } catch (e) {
      setErr(String(e));
    } finally {
      setSaving(false);
    }
  };

  const noteLabel =
    pending === "SKIP"
      ? "Причина паузы (обязательно)"
      : pending === "BONUS"
      ? "Комментарий (что было сверх?)"
      : "Комментарий";

  const notePlaceholder =
    pending === "SKIP"
      ? "Например: сделал меньше, устал, болит плечо, мало времени…"
      : "Коротко, по желанию…";

  const noteRequired = pending === "SKIP";
  const canSave = current != null && pending != null && (!noteRequired || note.trim().length > 0);
  const maxLen = pending === "SKIP" ? 200 : 140;

  // TODO: условие появления блока НЕ ДЕЛАТЬ (когда есть challenge типа “avoid/не делать”)
  const hasNoDoChallenges = false;

  return (
    <div>

      {/* Фокус дня + фиксация — единый контейнер */}
      <Card title="Фокус дня">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 800 }}>{challengeTitle}</div>
            {currentStatus && (
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
                  Сегодня: {currentStatus}
                </span>
              </div>
            )}
          </div>
        </div>
        {err && (
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
            Не удалось сохранить: {err}
          </div>
        )}

        {/* Фиксация / end-state */}
        {current ? (
          <div style={{ display: "flex", gap: 14, marginTop: 14, flexWrap: "wrap" }}>
            <StatusButton
              title="Минимальный шаг выполнен"
              icon="✅"
              label="Есть"
              onClick={() => {
                if (saving || !current || pending) return;
                setPending("MIN");
                setSavedPulse(false);
              }}
            />
            <StatusButton
              title="Сделал больше обычного"
              icon="⭐"
              label="Сверх"
              onClick={() => {
                if (saving || !current || pending) return;
                setPending("BONUS");
                setSavedPulse(false);
              }}
            />
            <StatusButton
              title="Сегодня пауза (с причиной)"
              icon="↩️"
              label="Пауза"
              onClick={() => {
                if (saving || !current || pending) return;
                setPending("SKIP");
                setSavedPulse(false);
              }}
            />
          </div>
        ) : (
          <div style={{ marginTop: 10, fontSize: 13, opacity: 0.75 }}>
            На сегодня всё.
          </div>
        )}

        {pending && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>
              {noteLabel}
            </div>

            <div style={{ maxWidth: 420 }}>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, maxLen))}
                rows={3}
                maxLength={maxLen}
                placeholder={notePlaceholder}
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
                {note.length}/{maxLen}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 10, alignItems: "center" }}>
              <button
                onClick={saveForm}
                disabled={!canSave || saving}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(0,0,0,0.12)",
                  background: canSave ? "white" : "rgba(0,0,0,0.04)",
                  cursor: canSave && !saving ? "pointer" : "not-allowed",
                  fontWeight: 700,
                }}
              >
                {saving ? "Сохраняю…" : "Сохранить"}
              </button>

              <button
                onClick={clearNote}
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
                onClick={closeForm}
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

              {savedPulse && (
                <div style={{ fontSize: 12, opacity: 0.75 }}>
                  Зафиксировано
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* НЕ ДЕЛАТЬ — появляется только если есть такие челленджи */}
      {hasNoDoChallenges && (
        <Card title="Не делать">
          <div style={{ opacity: 0.7, fontSize: 13 }}>Список (свернуто) — следующим шагом</div>
        </Card>
      )}

      {/* Мои челленджи — слот под будущий список/экран */}
      <Card
        title="Мои челленджи"
        onClick={props.onGoChallenges}
      >
        <div style={{ fontSize: 13, opacity: 0.75 }}>
          Все ваши цели и настройки — в одном месте
        </div>
      </Card>
    </div>
  );
}
