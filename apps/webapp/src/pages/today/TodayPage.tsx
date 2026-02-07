import { useEffect, useState, useRef } from "react";
import { useTodayState } from "../../state/today";
import { TodayCard } from "./";
import { FocusSection } from "./";
import { useTodayDerived } from "./useTodayDerived";
import type { TodayItem } from "../../shared/domain/types";
import { CongratsToast } from "../../shared/congrats/CongratsToast";

const CONGRATS_TITLE = "День зафиксирован";
const LS_CONGRATS_PREFIX = "lt_congrats_shown_for_";
const CONGRATS_LINES: string[] = [
  "Зафиксировано.",
  "День сложился.",
  "Сделано.",
  "Хорошо. Продолжаем завтра.",
  "Ты не пропускаешь себя.",
  "Запись есть — этого достаточно.",
  "Тихо, ровно, по делу.",
  "Сегодня отмечено.",
  "Есть факт. Есть история.",
  "День закрыт.",
  "Спокойно.",
  "Ок.",
];

export function TodayPage(props: { onGoChallenges: () => void; onGoHistory: () => void }) {
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
  const [congratsOpen, setCongratsOpen] = useState(false);
  const [congratsText, setCongratsText] = useState("Зафиксировано.");

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

  const closeCongrats = () => {
    if (today) {
      try {
        localStorage.setItem(`${LS_CONGRATS_PREFIX}${today.date}`, "1");
      } catch {
        // ignore
      }
    }
    setCongratsOpen(false);
  };

  useEffect(() => {
    if (today == null) return;    
    if (congratsOpen) return;

    const allDone = 
      (today.all ?? []).length > 0 && 
      (today.all ?? []).every((x) => x.status_view != null);
    if (!allDone) return;

    const dateKey = `${LS_CONGRATS_PREFIX}${today.date}`;
    const already = (() => {
      try {
        return localStorage.getItem(dateKey) === "1";
      } catch {
        return false;
      }
    })();

    if (already) return;

    // pick a line (no heavy randomness; stable enough)
    const idx = Math.abs(String(today.date).split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % CONGRATS_LINES.length;
    setCongratsText(CONGRATS_LINES[idx] ?? "Зафиксировано.");
    setCongratsOpen(true);
    try {
      localStorage.setItem(dateKey, "1");
    } catch {}    
  }, [today, congratsOpen]);

  // HARD GATE: do not render intermediate UI before the first real /today payload.
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


      <TodayCard title="История" onClick={props.onGoHistory}>
        <div style={{ fontSize: 13, opacity: 0.75 }}>Прошлые дни и редактирование фактов</div>
      </TodayCard>

      <TodayCard title="Мои челленджи" onClick={props.onGoChallenges}>
        <div style={{ fontSize: 13, opacity: 0.75 }}>Все ваши цели и настройки — в одном месте</div>
      </TodayCard>

      {congratsOpen && (
        <CongratsToast title={CONGRATS_TITLE} text={congratsText} onClose={closeCongrats} />
      )}
    </div>
  );
}
