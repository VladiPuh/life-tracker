import { useEffect, useState, useRef } from "react";
import { useTodayState } from "../../state/today";
import { TodayCard } from "./";
import { FocusSection } from "./";
import { useTodayDerived } from "./useTodayDerived";
import type { TodayItem } from "../../shared/domain/types";

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

  const {
    boot,
    waiting,
    current,
    challengeTitle,
    currentStatus,
    noteLabel,
    notePlaceholder,
    canSave,
    maxLen,
  } = useTodayDerived({
    today: today ?? null,
    focusOverrideId,
    pending,
    note,
  });

  useEffect(() => {
    if (!boot) return;
    // пока today не загрузился — форма фиксации должна быть гарантированно закрыта
    setPending(null);
    setNote("");
    setSavedPulse(false);
    setErr(null);
  }, [boot]);

  useEffect(() => {
    // Если override стал невалидным (челлендж уже отмечен сегодня / пропал) — сбрасываем
    if (!today) return;
    if (focusOverrideId == null) return;

    const it = today.all.find((x: TodayItem) => x.challenge_id === focusOverrideId);
    if (!it || it.status_view != null) {
      setFocusOverrideId(null);
      return;
    }
  }, [today, focusOverrideId]);

  useEffect(() => {
    void loadToday();
  }, [loadToday]);

  useEffect(() => {
    if (!savedPulse) return;
    const t = window.setTimeout(() => setSavedPulse(false), 1200);
    return () => window.clearTimeout(t);
  }, [savedPulse]);

  const closeForm = () => {
    setPending(null);
    setNote("");
  };

  const clearNote = () => {
    setNote("");
    setSavedPulse(false);
  };

  const saveForm = async () => {
    if (boot) return;
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

  const requestPending = (flag: Flag) => {
    if (boot) return;
    if (saving || !current) return;
    setPending(flag);
    setSavedPulse(false);
  };

  const hasNoDoChallenges = false;

  const onNextFocus = () => {
    if (boot) return;
    if (!waiting.length) return;

    const curId = current?.challenge_id ?? null;
    const idx =
      curId != null ? waiting.findIndex((x: TodayItem) => x.challenge_id === curId) : -1;

    const next = waiting[(idx + 1 + waiting.length) % waiting.length];
    setFocusOverrideId(next.challenge_id);
    closeForm();
  };

  const onOpenPick = () => {
    if (boot) return;
    if (!waiting.length) return;

    const r = focusCardRef.current?.getBoundingClientRect();
    if (r) {
      const top = Math.round(r.top + 8);
      setPickTop(Math.max(72, top));
    } else {
      setPickTop(120);
    }

    setPickOpen(true);
  };

  // HARD GATE: do not render intermediate UI before the first real /today payload.
  // No skeletons here: empty is better than dirty.
  if (today == null) {
    return <div />;
  }

  return (
    <div>
      <FocusSection
        boot={boot}
        pickOpen={pickOpen}
        pickTop={pickTop}
        onClosePick={() => setPickOpen(false)}
        waiting={waiting}
        current={current}
        onPickChallenge={(id: number) => {
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

      {hasNoDoChallenges && (
        <TodayCard title="Не делать">
          <div style={{ opacity: 0.7, fontSize: 13 }}>Список (свернуто) — следующим шагом</div>
        </TodayCard>
      )}

      <TodayCard title="Мои челленджи" onClick={props.onGoChallenges}>
        <div style={{ fontSize: 13, opacity: 0.75 }}>Все ваши цели и настройки — в одном месте</div>
      </TodayCard>
    </div>
  );
}
