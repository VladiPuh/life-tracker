
import { useEffect, useMemo, useState } from "react";;
import { LifeTrackerApi } from "./shared/api/lifetracker";
import { getInitData } from "./shared/tg/initData";
import { useNav } from "./app/router/useNav";
import { useBack } from "./app/router/useBack";
import { TodayScreen } from "./features/today/TodayScreen";
import { DetailScreen } from "./features/detail/DetailScreen";
import { TemplatesScreen } from "./features/templates/TemplatesScreen";
import { AddScreen } from "./features/add/AddScreen";
import { useTodayState } from "./state/today";
import {hasTelegramWebApp, initTelegram, logTelegramReady, bindTelegramBackButton,} from "./shared/tg/webapp";
import type { TemplateItem, HistoryResponse, ChallengePatch, ChallengeFull } from "./shared/domain/types";


export default function App() {  
  const [templates, setTemplates] = useState<TemplateItem[] | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const {today, showAll, loadToday, setFlag, resetShowAll, toggleShowAll,} = useTodayState();
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editMiss, setEditMiss] = useState<"FAIL"|"MIN"|"BONUS"|"SKIP">("FAIL");
  const [editActive, setEditActive] = useState(true);
  const tgPresent = hasTelegramWebApp();
  const initData = getInitData();
  const initLen = initData.length;
  const tgOk = tgPresent && initLen > 0;
  const [challengeFull, setChallengeFull] = useState<ChallengeFull | null>(null);
  const { screen, go, goToday, goTemplates, goAdd } = useNav();

  useEffect(() => {
    if (screen === "TODAY") {
      resetShowAll();
    }
  }, [screen]);

  useEffect(() => {
  if (!tgPresent) return;

  initTelegram();
  logTelegramReady();
}, [tgPresent]);

  useEffect(() => {
    console.log("[DBG] screen=", screen, "showAll=", showAll);
  }, [screen, showAll]);


  useBack({
    enabled: tgOk && screen !== "TODAY",
    onBack: () => {
      resetShowAll();
      goToday();
    },
  });

    // iOS Telegram может дергать history/back без BackButton UI.
  // Наша цель: при любом системном back/history/restore — свернуть список.
  useEffect(() => {
    const onSystemNav = () => {
      resetShowAll();
    };

    window.addEventListener("popstate", onSystemNav);
    window.addEventListener("hashchange", onSystemNav);
    window.addEventListener("pageshow", onSystemNav);

    return () => {
      window.removeEventListener("popstate", onSystemNav);
      window.removeEventListener("hashchange", onSystemNav);
      window.removeEventListener("pageshow", onSystemNav);
    };
  }, []);

  useEffect(() => {
    const shouldShow = screen === "DETAIL" || screen === "ADD" || screen === "TEMPLATES";

    const onTgBack = () => {
      resetShowAll();
      goToday();
    };

    return bindTelegramBackButton({
      enabled: tgOk,
      shouldShow,
      onBack: onTgBack,
    });
  }, [tgOk, screen, goToday]);


  // Add wizard state (MVP)
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newMissPolicy, setNewMissPolicy] = useState<"FAIL"|"MIN"|"BONUS"|"SKIP">("FAIL");

  const selected = useMemo(() => {
    if (!today || selectedId == null) return null;
    return today.all.find(x => x.challenge_id === selectedId) ?? null;
  }, [today, selectedId]);


  async function loadChallenge(challengeId: number) {
    setErr(null);
    const data = await LifeTrackerApi.getChallenge(challengeId);
    setChallengeFull(data);
    setEditMiss(data.miss_policy);
    setEditActive(data.is_active);
    setEditDesc(data.description ?? "");
  }

  async function loadHistory(challengeId: number) {
    setErr(null);
    const data = await LifeTrackerApi.getHistory(challengeId, 30);    
    setHistory(data);
  }

  async function loadTemplates() {
    setErr(null);
    const data = await LifeTrackerApi.getTemplates();
    setTemplates(data);
  }

  async function addTemplate(template_id: number) {
    setErr(null);
    await LifeTrackerApi.addTemplate(template_id);
    await loadToday();
    goToday();
  }

  async function createChallenge() {
    setErr(null);
    if (!newTitle.trim()) {
      setErr("Название обязательно");
      return;
    }
    await LifeTrackerApi.createChallenge({
      title: newTitle.trim(),
      description: newDesc.trim() || null,
      miss_policy: newMissPolicy,
    });
    setNewTitle(""); setNewDesc(""); setNewMissPolicy("FAIL");
    await loadToday();
    goToday();
  }

  async function saveTitle(challengeId: number) {
    setErr(null);
    const payload: ChallengePatch = { title: editTitle.trim() || null };
    await LifeTrackerApi.patchChallenge(challengeId, payload);
    await loadToday();
    await loadChallenge(challengeId);
    // обновим selected (чтобы сразу отрисовалось)
    setSelectedId(challengeId);
  }

  async function saveDesc(challengeId: number) {
    setErr(null);
    const payload: ChallengePatch = { description: editDesc.trim() || null };
    await LifeTrackerApi.patchChallenge(challengeId, payload);
    await loadToday();
    await loadChallenge(challengeId);
  };

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: 16, fontFamily: "system-ui, Arial" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        {!tgOk && (
          <div style={{
            marginTop: 10,
            padding: 10,
            border: "1px dashed #555",
            borderRadius: 10,
            fontSize: 12,
            opacity: 0.9
          }}>
            <div><b>DEBUG</b></div>
            <div>tgPresent: {String(tgPresent)}</div>
            <div>initDataLen: {initLen}</div>
            <div>tgOk: {String(tgOk)}</div>
            <div>API_BASE: /api</div>
            <div>todayLoaded: {String(Boolean(today))}</div>
          <div>err: {err ?? "—"}</div>
          </div>
        )}

        <h2 style={{ margin: 0 }}>Life-Tracker</h2>
        {!tgOk && (
          <div style={{ marginTop: 10, padding: 10, border: "1px solid #f99", borderRadius: 10 }}>
           <div style={{ fontWeight: 700 }}>Открыто не внутри Telegram WebApp</div>
           <div style={{ opacity: 0.8, fontSize: 12, marginTop: 4 }}>
             Telegram.WebApp: {tgPresent ? "есть" : "нет"} • initDataLen: {initLen}
           </div>
           <div style={{ opacity: 0.8, fontSize: 12, marginTop: 6 }}>
             Открой Mini App на телефоне (Android/iOS) или в Telegram Desktop, который открывает встроенно.
           </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => { resetShowAll(); goToday(); loadToday(); }}>Сегодня</button>
          <button onClick={() => { goTemplates(); loadTemplates(); }}>Шаблоны</button>
          <button onClick={() => goAdd()}>Добавить</button>
        </div>
      </div>

      {today && (
        <div style={{ marginTop: 6, opacity: 0.7, fontSize: 12 }}>
          {today.date}
        </div>
      )}

      {err && (
        <div style={{ marginTop: 12, padding: 10, border: "1px solid #f99", borderRadius: 8 }}>
          Ошибка: {err}
        </div>
      )}

      {/* TODAY */}
      {screen === "TODAY" && (
        <TodayScreen
          today={today}
          showAll={showAll}
          onToggleShowAll={toggleShowAll}
          onSetFlagFirst={(flag: "MIN" | "BONUS" | "SKIP" | "FAIL") =>
            setFlag(today!.first_uncompleted!.challenge_id, flag)
          }
          onGoDetail={(challengeId: number) => {
            setSelectedId(challengeId);

            const found = today?.all.find((x) => x.challenge_id === challengeId) ?? null;
            if (found) {
              setEditTitle(found.title);
            }

            setEditDesc("");
            go("DETAIL");
            loadHistory(challengeId).catch((e) => setErr(String(e)));
            loadChallenge(challengeId).catch((e) => setErr(String(e)));
          }}
        />
      )}

      {/* DETAIL */}
      {screen === "DETAIL" && selected && (
        <DetailScreen
          selected={selected}
          challengeFull={challengeFull}
          history={history}
          editTitle={editTitle}
          setEditTitle={setEditTitle}
          editDesc={editDesc}
          setEditDesc={setEditDesc}
          editMiss={editMiss}
          setEditMiss={setEditMiss}
          editActive={editActive}
          setEditActive={setEditActive}
          onBack={() => {
            resetShowAll();
            goToday();
          }}
          onSetFlag={(flag) => setFlag(selected.challenge_id, flag)}
          onSaveTitle={() => saveTitle(selected.challenge_id)}
          onSaveDesc={() => saveDesc(selected.challenge_id)}
          onSavePolicyAndActive={async () => {
            setErr(null);
            await LifeTrackerApi.patchChallenge(selected.challenge_id, {
              miss_policy: editMiss,
              is_active: editActive,
            });
            await loadToday();
            await loadChallenge(selected.challenge_id);
          }}
        />
      )}

      {/* TEMPLATES */}
      {screen === "TEMPLATES" && (
        <TemplatesScreen
          templates={templates}
          onAdd={(templateId) => addTemplate(templateId)}
        />
      )}

      {/* ADD */}
      {screen === "ADD" && (
        <AddScreen
          newTitle={newTitle}
          setNewTitle={setNewTitle}
          newDesc={newDesc}
          setNewDesc={setNewDesc}
          newMissPolicy={newMissPolicy}
          setNewMissPolicy={setNewMissPolicy}
          onBack={() => {
            resetShowAll();
            goToday();
          }}
          onCreate={createChallenge}
        />
      )}
    </div>
  );
}

