import { getInitData } from "./shared/tg/initData";
import { useEffect, useState } from "react";
import {
  hasTelegramWebApp,
  initTelegram,
  logTelegramReady,
  bindTelegramBackButton,
} from "./shared/tg/webapp";
import { useNav } from "./app/router/useNav";
import { useBack } from "./app/router/useBack";

import DetailScreen from "./features/detail/DetailScreen";
import { TemplatesScreen } from "./features/templates/TemplatesScreen";
import { useTemplatesState } from "./state/templates";
import { AddScreen } from "./features/add/AddScreen";
import { useTodayState } from "./state/today";
import { useAddState } from "./state/add";

import { TodayPage } from "./pages/TodayPage";
import MyChallengesPage from "./pages/MyChallengesPage";
import { HistoryPage } from "./pages/HistoryPage";

type TabId = "insights" | "history" | "today" | "new" | "templates" | "profile";
type PlaceholderKind = "INSIGHTS" | "PROFILE";

function PlaceholderCard(props: { title: string; text: string }) {
  return (
    <div
      style={{
        padding: 12,
        border: "1px solid var(--lt-border)",
        borderRadius: 12,
        marginTop: 12,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{props.title}</div>
      <div style={{ opacity: 0.75, lineHeight: 1.35 }}>{props.text}</div>
    </div>
  );
}

function BottomNav(props: {
  active: TabId;
  onGo: (tab: TabId) => void;
}) {
  const Item = (p: {
    id: TabId;
    label: string;
    emphasize?: boolean;
    onClick: () => void;
  }) => {
    const isActive = props.active === p.id;

    return (
      <button
        onClick={p.onClick}
        style={{
          flex: 1,
          padding: "10px 6px",
          border: "none",
          background: "transparent",
          cursor: "pointer",
          opacity: isActive ? 1 : 0.6,
          fontWeight: p.emphasize ? 800 : 600,
          letterSpacing: p.emphasize ? -0.2 : 0,
        }}
        aria-label={p.label}
        title={p.label}
      >
        {p.label}
      </button>
    );
  };

  return (
    <div
      style={{
        flexShrink: 0,
        paddingTop: 10,
        paddingBottom: 10,
        background: "var(--lt-card)",
        backdropFilter: "blur(10px)",
        borderTop: "1px solid var(--lt-border)",
        color: "var(--lt-text)",
        display: "flex",
        gap: 6,
      }}
    >
      <Item id="insights" label="Инсайты" onClick={() => props.onGo("insights")} />
      <Item id="history" label="История" onClick={() => props.onGo("history")} />
      <Item id="today" label="Сегодня" emphasize onClick={() => props.onGo("today")} />
      <Item id="new" label="Новый" emphasize onClick={() => props.onGo("new")} />
      <Item id="templates" label="Шаблоны" onClick={() => props.onGo("templates")} />
      <Item id="profile" label="Профиль" onClick={() => props.onGo("profile")} />
    </div>
  );
}

declare const __BUILD_ID__: string;

export default function App() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Заглушки для будущих экранов (честно, без “перекидывания в Today”)
  const [placeholder, setPlaceholder] = useState<PlaceholderKind | null>(null);

  const { showAll, loadToday, resetShowAll } = useTodayState();

  const tgPresent = hasTelegramWebApp();
  const initData = getInitData();
  const initLen = initData.length;
  const tgOk = tgPresent && initLen > 0;

  const { screen, go, goToday } = useNav();

  const { templates, addTemplate } = useTemplatesState();
  const { newTitle, setNewTitle, newDesc, setNewDesc, newMissPolicy, setNewMissPolicy, create } =
    useAddState();

  useEffect(() => {
    if (screen === "TODAY") {
      resetShowAll();
    }
  }, [screen, resetShowAll]);

  useEffect(() => {
    if (!tgPresent) return;
    initTelegram();
    logTelegramReady();
  }, [tgPresent]);

  useEffect(() => {
    console.log("[DBG] screen=", screen, "showAll=", showAll, "placeholder=", placeholder);
  }, [screen, showAll, placeholder]);

  // Back внутри приложения:
  // - если открыт placeholder → закрыть placeholder
  // - иначе обычный back к Today
  useBack({
    enabled: tgOk && (screen !== "TODAY" || placeholder !== null),
    onBack: () => {
      resetShowAll();
      if (placeholder) {
        setPlaceholder(null);
        return;
      }
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
  }, [resetShowAll]);

  // Telegram BackButton: показываем, если мы не в чистом Today
  useEffect(() => {
    const shouldShow =
      placeholder !== null ||
      screen === "DETAIL" ||
      screen === "ADD" ||
      screen === "TEMPLATES" ||
      screen === "HISTORY";

    const onTgBack = () => {
      resetShowAll();
      if (placeholder) {
        setPlaceholder(null);
        return;
      }
      goToday();
    };

    return bindTelegramBackButton({
      enabled: tgOk,
      shouldShow,
      onBack: onTgBack,
    });
  }, [tgOk, screen, goToday, resetShowAll, placeholder]);

  // active tab
  const activeTab: TabId =
    placeholder === "INSIGHTS"
      ? "insights"
      : placeholder === "PROFILE"
      ? "profile"
      : screen === "ADD"
      ? "new"
      : screen === "TEMPLATES"
      ? "templates"
      : screen === "HISTORY"
      ? "history"
      : "today";

  return (
    <div
      style={{
        maxWidth: 520,
        margin: "0 auto",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        fontFamily: "system-ui, Arial",
      }}
    >
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        paddingLeft: 16,
        paddingRight: 16,
        paddingBottom: 16,
        paddingTop: "calc(16px + env(safe-area-inset-top))",
        WebkitOverflowScrolling: "touch",
      }}
    >    
      {err && (
        <div style={{ marginTop: 12, padding: 10, border: "1px solid #f99", borderRadius: 8 }}>
          Ошибка: {err}
        </div>
      )}

      {/* PLACEHOLDERS (тихо, без CTA) */}
      {screen === "TODAY" && placeholder === "INSIGHTS" && (
        <PlaceholderCard
          title="Инсайты"
          text="Этот экран появится позже. Сейчас важнее факт и устойчивость."
        />
      )}
      {screen === "TODAY" && placeholder === "PROFILE" && (
        <PlaceholderCard
          title="Профиль"
          text="Этот экран появится позже. Сейчас — только действие и факт."
        />
      )}

      {/* TODAY */}
      {screen === "TODAY" && placeholder === null && (
        <TodayPage onGoChallenges={() => go("CHALLENGES")} />
      )}

      {/* HISTORY */}
      {screen === "HISTORY" && <HistoryPage />}

      {screen === "CHALLENGES" && (
        <MyChallengesPage
          onOpen={(id) => {
            setSelectedId(id);
            go("DETAIL");
          }}
        />
      )}

      {/* DETAIL */}
      {screen === "DETAIL" && selectedId != null && (
        <DetailScreen
          challengeId={selectedId}
          onBack={() => go("CHALLENGES")}
        />
      )}

      {/* TEMPLATES */}
      {screen === "TEMPLATES" && (
        <TemplatesScreen templates={templates} onAdd={(templateId) => addTemplate(templateId)} />
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
          onCreate={async () => {
            setErr(null);
            try {
              await create();
              await loadToday();
              goToday();
            } catch (e) {
              setErr(String(e));
            }
          }}
        />
      )}
      </div>

      <BottomNav
        active={activeTab}
        onGo={(tab) => {
          // Заглушки — остаёмся на TODAY, но показываем отдельную “плашку-экран”
          if (tab === "insights") {
            setPlaceholder("INSIGHTS");
            go("TODAY");
            return;
          }
          if (tab === "profile") {
            setPlaceholder("PROFILE");
            go("TODAY");
            return;
          }

          // Реальные экраны — сбрасываем placeholder
          setPlaceholder(null);

          if (tab === "history") return go("HISTORY");
          if (tab === "today") return go("TODAY");
          if (tab === "new") return go("ADD");
          if (tab === "templates") return go("TEMPLATES");
        }}
      />
      <div
        style={{
          marginTop: 14,
          paddingBottom: 6,
          fontSize: 10,
          lineHeight: "10px",
          opacity: 0.28,
          textAlign: "center",
          userSelect: "none",
          pointerEvents: "none",
        }}
      >
        build: {__BUILD_ID__}
        </div>
            
      <div style={{ height: "env(safe-area-inset-bottom)" }} />
    </div>
  );
}
