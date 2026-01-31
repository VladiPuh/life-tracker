import { useEffect, useState, useRef } from "react";
import { useTodayState } from "../state/today";
import { TodayCard } from "./today/TodayCard";
import { FocusSection } from "./today/FocusSection";


export function TodayPage(props: { onGoChallenges: () => void }) {
  type Flag = "MIN" | "BONUS" | "SKIP";
  const [pending, setPending] = useState<Flag | null>(null);
  const [note, setNote] = useState<string>("");
  const [savedPulse, setSavedPulse] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const { today, loadToday, setFlag } = useTodayState();
  const [focusOverrideId, setFocusOverrideId] = useState<number | null>(null);
  const [pickOpen, setPickOpen] = useState(false);
  const focusCardRef = useRef<HTMLDivElement | null>(null);
  const [pickTop, setPickTop] = useState<number>(120);
  const baseCurrent = today?.first_uncompleted ?? null;

  const waiting = (today?.all ?? []).filter((x) => x.status_view === "WAITING");

  const current =
    focusOverrideId != null
      ? (today?.all ?? []).find((x) => x.challenge_id === focusOverrideId) ?? baseCurrent
      : baseCurrent;

  useEffect(() => {
    // Если override стал невалидным (челлендж уже отмечен сегодня / пропал) — сбрасываем
    if (!today) return;
    if (focusOverrideId == null) return;

    const it = today.all.find((x) => x.challenge_id === focusOverrideId);
    if (!it || it.status_view !== "WAITING") setFocusOverrideId(null);
  }, [today, focusOverrideId]);

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
  const requestPending = (flag: Flag) => {
    if (saving || !current || pending) return;
    setPending(flag);
    setSavedPulse(false);
  };

  // TODO: условие появления блока НЕ ДЕЛАТЬ (когда есть challenge типа “avoid/не делать”)
  const hasNoDoChallenges = false;

    const onNextFocus = () => {
    if (!waiting.length) return;

    const curId = current?.challenge_id ?? null;
    const idx = curId != null ? waiting.findIndex((x) => x.challenge_id === curId) : -1;
    const next = waiting[(idx + 1 + waiting.length) % waiting.length];

    setFocusOverrideId(next.challenge_id);
    closeForm(); // на всякий случай закрываем форму статуса
  };

  const onOpenPick = () => {
    if (!waiting.length) return;

    const r = focusCardRef.current?.getBoundingClientRect();
    if (r) {
      const top = Math.round(r.top + 8); // модалка начинается примерно на уровне "Фокус дня"
      // ограничим, чтобы не прилипало к самому верху
      setPickTop(Math.max(72, top));
    } else {
      setPickTop(120);
    }

    setPickOpen(true);
  };

  return (
    <div>
      <FocusSection
        pickOpen={pickOpen}
        pickTop={pickTop}
        onClosePick={() => setPickOpen(false)}
        waiting={waiting}
        current={current}
        onPickChallenge={(id) => {
          setFocusOverrideId(id);
          setPickOpen(false);
          closeForm();
        }}
        focusCardRef={focusCardRef}
        challengeTitle={challengeTitle}
        currentStatus={currentStatus}
        onOpenPick={onOpenPick}
        onNextFocus={onNextFocus}
        err={err}
        requestPending={requestPending}
        saving={saving}
        pending={pending}
        noteLabel={noteLabel}
        notePlaceholder={notePlaceholder}
        note={note}
        setNote={setNote}
        maxLen={maxLen}
        canSave={canSave}
        saveForm={saveForm}
        clearNote={clearNote}
        closeForm={closeForm}
        savedPulse={savedPulse}
      />

      {/* НЕ ДЕЛАТЬ — появляется только если есть такие челленджи */}
      {hasNoDoChallenges && (
        <TodayCard title="Не делать">
          <div style={{ opacity: 0.7, fontSize: 13 }}>Список (свернуто) — следующим шагом</div>
        </TodayCard>
      )}

      {/* Мои челленджи — слот под будущий список/экран */}
      <TodayCard title="Мои челленджи"
        onClick={props.onGoChallenges}
      >
        <div style={{ fontSize: 13, opacity: 0.75 }}>
          Все ваши цели и настройки — в одном месте
        </div>
      </TodayCard>
    </div>
  );
}
