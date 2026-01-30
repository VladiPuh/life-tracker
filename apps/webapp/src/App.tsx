import { useEffect, useState } from "react";
import {
  initTelegram,
  logTelegramReady,
  bindTelegramBackButton,
} from "./shared/tg/webapp";
import { useNav } from "./app/router/useNav";
import { AppShell } from "./app/shell/AppShell";
import { BottomNav } from "./app/shell/BottomNav";
import DetailScreen from "./features/detail/DetailScreen";
import { TemplatesScreen } from "./features/templates/TemplatesScreen";
import { useTemplatesState } from "./state/templates";
import { AddScreen } from "./features/add/AddScreen";
import { useTodayState } from "./state/today";
import { useAddState } from "./state/add";
import { PlaceholderCard } from "./shared/ui/PlaceholderCard";
import { useTelegramBootstrap } from "./shared/tg/useTelegramBootstrap";
import type { TabId } from "./app/shell/BottomNav";
import { TodayPage } from "./pages/TodayPage";
import MyChallengesPage from "./pages/MyChallengesPage";
import { HistoryPage } from "./pages/HistoryPage";

type PlaceholderKind = "INSIGHTS" | "PROFILE";

declare const __BUILD_ID__: string;
const BUILD_LABEL = __BUILD_ID__;

export default function App() {
  const { tgPresent, tgOk } = useTelegramBootstrap();
  const [ selectedId, setSelectedId] = useState<number | null>(null);
  const [ placeholder, setPlaceholder] = useState<PlaceholderKind | null>(null);
  const { showAll, resetShowAll } = useTodayState();
  const { screen, canGoBack, go, goBack, goToday, goTemplates, goAdd } = useNav();
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

  // Telegram BackButton: показываем, если мы не в чистом Today
  useEffect(() => {
    const shouldShow =
      placeholder !== null || canGoBack;

    const onTgBack = () => {
      resetShowAll();
      if (placeholder) {
        setPlaceholder(null);
        return;
      }
      goBack();
    };

    return bindTelegramBackButton({
      enabled: tgOk,
      shouldShow,
      onBack: onTgBack,
    });
  }, [tgOk, placeholder, canGoBack, goBack, resetShowAll]);

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
  const pageTitle =
    placeholder === "INSIGHTS"
      ? "Инсайты"
      : placeholder === "PROFILE"
      ? "Профиль"
      : screen === "HISTORY"
      ? "История"
      : screen === "TEMPLATES"
      ? "Шаблоны"
      : screen === "ADD"
      ? "Новый"
      : screen === "CHALLENGES"
      ? "Челленджи"
      : screen === "DETAIL"
      ? "Челлендж"
      : "Сегодня";

  return (
    <AppShell
      title={pageTitle}
      buildLabel={BUILD_LABEL}
      bottomNav={
        <BottomNav
          active={activeTab}
          onGo={(tab: TabId) => {
            if (tab !== "insights" && tab !== "profile") setPlaceholder(null);

            if (tab === "today") return goToday();
            if (tab === "history") return go("HISTORY");
            if (tab === "new") return goAdd();
            if (tab === "templates") return goTemplates();

            if (tab === "insights") {
              goToday();
              setPlaceholder("INSIGHTS");
              return;
            }

            if (tab === "profile") {
              goToday();
              setPlaceholder("PROFILE");
              return;
            }
          }}
        />
      }
      >
      {/* тут остается ровно то, что было внутри scroll area */}
      {screen === "TODAY" ? (
        placeholder === "INSIGHTS" ? (
          <PlaceholderCard title="Инсайты" text="Скоро" />
        ) : placeholder === "PROFILE" ? (
          <PlaceholderCard title="Профиль" text="Скоро" />
        ) : (
          <TodayPage onGoChallenges={() => { setPlaceholder(null); go("CHALLENGES"); }} />
        )
      ) : screen === "HISTORY" ? (
        <HistoryPage />
      ) : screen === "CHALLENGES" ? (
        <MyChallengesPage
          onOpen={(id) => {
            setSelectedId(id);
            go("DETAIL");
          }}
        />

      ) : screen === "ADD" ? (
        <AddScreen
          newTitle={newTitle}
          setNewTitle={setNewTitle}
          newDesc={newDesc}
          setNewDesc={setNewDesc}
          newMissPolicy={newMissPolicy}
          setNewMissPolicy={setNewMissPolicy}
          onBack={() => goBack()}
          onCreate={async () => {
            try {
              await create();
              goToday();
            } catch (e: any) {}
          }}
        />

      ) : screen === "TEMPLATES" ? (
        <TemplatesScreen
          templates={templates}
          onAdd={async (templateId) => {
            try {
              await addTemplate(templateId);
              goAdd();
            } catch (e: any) {}
          }}
        />

      ) : screen === "DETAIL" ? (
        selectedId !== null ? (
          <DetailScreen challengeId={selectedId} onBack={() => goBack()} />
        ) : (
          <PlaceholderCard title="Челлендж" text="Не выбран" />
        )
      ) : (
        <TodayPage onGoChallenges={() => { setPlaceholder(null); go("CHALLENGES"); }} />
      )}
    </AppShell>
  )
}
