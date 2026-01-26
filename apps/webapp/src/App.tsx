import { useEffect, useMemo, useState } from "react";
import WebApp from "@twa-dev/sdk";

type StatusView = "WAITING" | "MIN" | "BONUS" | "SKIP" | "FAIL";

type TodayItem = {
  challenge_id: number;
  title: string;
  status_view: StatusView;
};

type TodayResponse = {
  date: string;
  first_uncompleted: TodayItem | null;
  all: TodayItem[];
};

type TemplateItem = {
  id: number;
  title: string;
  description?: string | null;
  miss_policy: "FAIL" | "MIN" | "BONUS" | "SKIP";
};

type HistoryItem = {
  date: string;
  status_view: StatusView;
  minutes_fact: number | null;
  comment: string | null;
};

type HistoryResponse = {
  challenge_id: number;
  items: HistoryItem[];
};

type ChallengePatch = {
  title?: string | null;
  description?: string | null;
  miss_policy?: "FAIL" | "MIN" | "BONUS" | "SKIP";
  is_active?: boolean;
};

type ChallengeFull = {
  id: number;
  title: string;
  description: string | null;
  miss_policy: "FAIL" | "MIN" | "BONUS" | "SKIP";
  is_active: boolean;
};

const API_BASE = "/api";
const DEV = import.meta.env.DEV;

function getInitData(): string {
  // 1) если Telegram WebApp уже инициализировался
  const fromWebApp = WebApp?.initData ?? "";
  if (fromWebApp) return fromWebApp;

  // 2) fallback: если Telegram передал данные в URL hash
  const hash = window.location.hash || "";
  const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  return params.get("tgWebAppData") ?? "";
}

DEV && console.log("[env]", {
  hasTelegram: typeof (window as any).Telegram !== "undefined",
  initDataLen: (WebApp?.initData ?? "").length,
  platform: WebApp?.platform,
});

DEV && console.log("[DEPLOY]", {
  build: "CF-PAGES",
  time: new Date().toISOString(),
});

DEV && console.log("[TG DEBUG] initDataLen:", (WebApp?.initData ?? "").length);


async function apiGet<T>(path: string): Promise<T> {
  const initData = getInitData();
  DEV && console.log("[apiGet]", {
    url: `${API_BASE}${path}`,
    initDataLen: initData.length,
  });
  const r = await fetch(`${API_BASE}${path}`, {
    headers: {
      "ngrok-skip-browser-warning": "1",
      "X-Telegram-Init-Data": initData,
    },
  });

  if (!r.ok) throw new Error(`GET ${path} failed: ${r.status}`);
  return r.json();
}


async function apiPost<T>(path: string, body?: any): Promise<T> {
  const initData = getInitData();
  const r = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "1",
      "X-Telegram-Init-Data": initData,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error(`POST ${path} failed: ${r.status}`);
  return r.json();
}

async function apiPatch<T>(path: string, body: any): Promise<T> {
  const initData = getInitData();
  const r = await fetch(`${API_BASE}${path}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "1",
      "X-Telegram-Init-Data": initData,
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`PATCH ${path} failed: ${r.status}`);
  return r.json();
}

function StatusPill({ s }: { s: StatusView }) {
  const label =
    s === "WAITING" ? "В ожидании" :
    s === "MIN" ? "MIN" :
    s === "BONUS" ? "BONUS" :
    s === "SKIP" ? "SKIP" : "FAIL";

  return (
    <span style={{
      display: "inline-block",
      padding: "4px 10px",
      borderRadius: 999,
      border: "1px solid #ccc",
      fontSize: 12
    }}>
      {label}
    </span>
  );
}

function FlagButtons({ onSet }: { onSet: (flag: "MIN"|"BONUS"|"SKIP"|"FAIL") => void }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <button onClick={() => onSet("MIN")}>MIN</button>
      <button onClick={() => onSet("BONUS")}>BONUS</button>
      <button onClick={() => onSet("SKIP")}>SKIP</button>
      <button onClick={() => onSet("FAIL")}>FAIL</button>
    </div>
  );
}

type Screen = "TODAY" | "TEMPLATES" | "ADD" | "DETAIL";

DEV && console.log("[Telegram.WebApp]", (window as any).Telegram?.WebApp ? "PRESENT" : "MISSING");
DEV && console.log("[initDataLen]", (WebApp?.initData ?? "").length);


export default function App() {
  const [screen, setScreen] = useState<Screen>("TODAY");
  const [today, setToday] = useState<TodayResponse | null>(null);
  const [todayFetchState, setTodayFetchState] = useState<string>("idle");
  const [showAll, setShowAll] = useState(false);
  const [templates, setTemplates] = useState<TemplateItem[] | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editMiss, setEditMiss] = useState<"FAIL"|"MIN"|"BONUS"|"SKIP">("FAIL");
  const [editActive, setEditActive] = useState(true);
  const tgPresent = Boolean((window as any).Telegram?.WebApp);
  const initData = getInitData();
  const initLen = initData.length;
  const tgOk = tgPresent && initLen > 0;
  const [challengeFull, setChallengeFull] = useState<ChallengeFull | null>(null);
    useEffect(() => {
      if (!tgOk) return;
      loadToday().catch((e) => setErr(String(e)));
    }, [tgOk])
    useEffect(() => {
      if (screen !== "TODAY") setShowAll(false);
    }, [screen]);

  // Add wizard state (MVP)
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newMissPolicy, setNewMissPolicy] = useState<"FAIL"|"MIN"|"BONUS"|"SKIP">("FAIL");

  const selected = useMemo(() => {
    if (!today || selectedId == null) return null;
    return today.all.find(x => x.challenge_id === selectedId) ?? null;
  }, [today, selectedId]);

  async function loadToday() {
    setTodayFetchState("started");
    setErr(null);

    try {
     const data = await apiGet<TodayResponse>("/today");
      setTodayFetchState("json ok");
      setToday(data);
    } catch (e) {
     setTodayFetchState("error");
     throw e;
    }
  }

  async function loadChallenge(challengeId: number) {
    setErr(null);
    const data = await apiGet<ChallengeFull>(`/challenges/${challengeId}`);
    setChallengeFull(data);
    setEditMiss(data.miss_policy);
    setEditActive(data.is_active);
    setEditDesc(data.description ?? "");
  }

  async function loadHistory(challengeId: number) {
    setErr(null);
    const data = await apiGet<HistoryResponse>(`/challenges/${challengeId}/history?days=30`);
    setHistory(data);
  }

  async function setFlag(challenge_id: number, flag: "MIN"|"BONUS"|"SKIP"|"FAIL") {
    setErr(null);
    await apiPost("/daily-log/upsert", { challenge_id, flag });
    await loadToday();
  }

  async function loadTemplates() {
    setErr(null);
    const data = await apiGet<TemplateItem[]>("/templates");
    setTemplates(data);
  }

  async function addTemplate(template_id: number) {
    setErr(null);
    await apiPost(`/templates/${template_id}/add`);
    await loadToday();
    setScreen("TODAY");
  }

  async function createChallenge() {
    setErr(null);
    if (!newTitle.trim()) {
      setErr("Название обязательно");
      return;
    }
    await apiPost("/challenges", {
      title: newTitle.trim(),
      description: newDesc.trim() || null,
      miss_policy: newMissPolicy,
    });
    setNewTitle(""); setNewDesc(""); setNewMissPolicy("FAIL");
    await loadToday();
    setScreen("TODAY");
  }

  async function saveTitle(challengeId: number) {
    setErr(null);
    const payload: ChallengePatch = { title: editTitle.trim() || null };
    await apiPatch(`/challenges/${challengeId}`, payload);
    await loadToday();
    await loadChallenge(challengeId);
    // обновим selected (чтобы сразу отрисовалось)
    setSelectedId(challengeId);
  }

  async function saveDesc(challengeId: number) {
    setErr(null);
    const payload: ChallengePatch = { description: editDesc.trim() || null };
    await apiPatch(`/challenges/${challengeId}`, payload);
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
            <div>API_BASE: {API_BASE}</div>
            <div>todayLoaded: {String(Boolean(today))}</div>
            <div>todayFetchState: {todayFetchState}</div>
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
          <button onClick={() => {setShowAll(false);setScreen("TODAY");loadToday();}}>Сегодня</button>
          <button onClick={() => { setScreen("TEMPLATES"); loadTemplates(); }}>Шаблоны</button>
          <button onClick={() => setScreen("ADD")}>Добавить</button>
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
        <>
          <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
            <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 14, opacity: 0.7 }}>Первый невыполненный</div>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>
                    {today
                      ? (today.first_uncompleted ? today.first_uncompleted.title : "Все выполнено ✅")
                      : "Загрузка..."}
                  </div>
                </div>
                <StatusPill s={today ? (today.first_uncompleted?.status_view ?? "WAITING") : "WAITING"} />
              </div>

              {today?.first_uncompleted ? (
                <div style={{ marginTop: 10 }}>
                  <FlagButtons onSet={(flag) => setFlag(today.first_uncompleted!.challenge_id, flag)} />
                </div>
              ) : (
                <div style={{ marginTop: 10, opacity: 0.6, fontSize: 12 }}>
                  На сегодня всё отмечено. Нажми “Показать все”, чтобы увидеть список.
                </div>
              )}
            </div>

            <button onClick={() => setShowAll((v) => !v)}>
              {showAll ? "Скрыть" : "Показать все"}
            </button>
          </div>

          {showAll && (
            <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
              {today?.all.map((ch) => (
                <div
                  key={ch.challenge_id}
                  style={{ padding: 12, border: "1px solid #ddd", borderRadius: 12, cursor: "pointer" }}
                  onClick={() => {
                    setSelectedId(ch.challenge_id);
                    setEditTitle(ch.title);
                    setEditDesc("");
                    setScreen("DETAIL");
                    loadHistory(ch.challenge_id).catch((e) => setErr(String(e)));
                    loadChallenge(ch.challenge_id).catch((e) => setErr(String(e)));
                  }}
                  >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontWeight: 600 }}>{ch.title}</div>
                    <StatusPill s={ch.status_view} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* DETAIL */}
      {screen === "DETAIL" && selected && (
        <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
          <button onClick={() => { setShowAll(false); setScreen("TODAY"); }}>← Назад</button>
          <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{selected.title}</div>
              <StatusPill s={selected.status_view} />
              </div>

<div style={{ marginTop: 12, width: "100%" }}>
                <div style={{ display: "grid", gap: 8 }}>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>
                    Название
                  </div>

                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    style={{
                     width: "100%",
                     padding: 10,
                     borderRadius: 8,
                      border: "1px solid #ccc",
                      boxSizing: "border-box",
                    }}
                  />

                  <button
                    style={{ alignSelf: "flex-start" }}
                    onClick={() => saveTitle(selected.challenge_id)}
                  >
                   Сохранить
                  </button>
                </div>

                <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>Если не отметил до конца дня</div>

                  <select
                   value={editMiss}
                   onChange={(e) => setEditMiss(e.target.value as any)}
                   style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
                 >
                   <option value="FAIL">FAIL</option>
                   <option value="SKIP">SKIP</option>
                   <option value="MIN">MIN</option>
                   <option value="BONUS">BONUS</option>
                  </select>

                  <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                   <input
                     type="checkbox"
                      checked={editActive}
                      onChange={(e) => setEditActive(e.target.checked)}
                    />
                    Активен
                  </label>

                  <button
                    style={{ alignSelf: "flex-start" }}
                    onClick={async () => {
                      setErr(null);
                      await apiPatch(`/challenges/${selected.challenge_id}`, {
                        miss_policy: editMiss,
                        is_active: editActive,
                      });
                      await loadToday();
                      await loadChallenge(selected.challenge_id);
                   }}
                 >
                    Сохранить политику и активность
                 </button>
                </div>

            </div>
            <div style={{ marginTop: 10 }}>
              <FlagButtons onSet={(flag) => setFlag(selected.challenge_id, flag)} />
            </div>
            <div style={{ marginTop: 12, width: "100%" }}>
              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ fontSize: 12, opacity: 0.8 }}>Описание</div>

                <textarea
                 value={editDesc}
                 onChange={(e) => setEditDesc(e.target.value)}
                  style={{
                   width: "100%",
                    padding: 10,
                   borderRadius: 8,
                    border: "1px solid #ccc",
                    boxSizing: "border-box",
                  }}
                  rows={4}
                  placeholder="Что именно делать"
                />

                <button
                 style={{ alignSelf: "flex-start" }}
                  onClick={() => saveDesc(selected.challenge_id)}
                >
                 Сохранить описание
                </button>

                <div style={{ opacity: 0.7, fontSize: 12 }}>
                  Текущее: {challengeFull && challengeFull.id === selected.challenge_id
                   ? (challengeFull.description ?? "— нет описания —")
                   : "Загрузка..."}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 10, opacity: 0.7, fontSize: 12 }}>
              История и редактор — следующий шаг (подключим /history и PATCH).
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>История (30 дней)</div>

            {!history || history.challenge_id !== selected.challenge_id ? (
              <div style={{ opacity: 0.7, fontSize: 12 }}>Загрузка...</div>
            ) : history.items.length === 0 ? (
              <div style={{ opacity: 0.7, fontSize: 12 }}>Пока нет записей</div>
            ) : (
              <div style={{ display: "grid", gap: 6 }}>
                {history.items.map((it) => (
                  <div key={it.date} style={{ padding: 10, border: "1px solid #eee", borderRadius: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: 13 }}>{it.date}</div>
                      <StatusPill s={it.status_view} />
                    </div>
                    {(it.minutes_fact != null || it.comment) && (
                      <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
                        {it.minutes_fact != null ? `Мин: ${it.minutes_fact}` : ""}
                        {it.minutes_fact != null && it.comment ? " • " : ""}
                        {it.comment ?? ""}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* TEMPLATES */}
      {screen === "TEMPLATES" && (
        <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
          <div style={{ opacity: 0.7, fontSize: 13 }}>
            Выбери шаблон и добавь в свои челенджи.
          </div>

          {(templates ?? []).map(t => (
            <div key={t.id} style={{ padding: 12, border: "1px solid #ddd", borderRadius: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{t.title}</div>
                  <div style={{ opacity: 0.7, fontSize: 12 }}>{t.description ?? ""}</div>
                </div>
                <button onClick={() => addTemplate(t.id)}>Добавить</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD */}
      {screen === "ADD" && (
        <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
          <button onClick={() => setScreen("TODAY")}>← Назад</button>

          <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 12 }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Добавить челендж</div>
            <div style={{ opacity: 0.7, fontSize: 12, marginTop: 4 }}>
              MVP: делаем короткий мастер (название + политика пропуска).
            </div>

            <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
              <label>
                Название*
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
                  placeholder="Напр. Reading"
                />
              </label>

              <label>
                Описание (опционально)
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
                  placeholder="Что именно делать"
                  rows={3}
                />
              </label>

              <label>
                Если не отметил до конца дня:
                <select
                  value={newMissPolicy}
                  onChange={(e) => setNewMissPolicy(e.target.value as any)}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
                >
                  <option value="FAIL">FAIL</option>
                  <option value="SKIP">SKIP</option>
                  <option value="MIN">MIN</option>
                  <option value="BONUS">BONUS</option>
                </select>
              </label>

              <button onClick={createChallenge}>Создать</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

