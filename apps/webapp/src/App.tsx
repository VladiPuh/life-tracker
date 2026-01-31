import { useEffect, useState } from "react";
import {
  initTelegram,
  logTelegramReady,
} from "./shared/tg/webapp";
import { useBack } from "./app/router/useBack";
import { ScreenRouter } from "./app/router/ScreenRouter";
import type { PlaceholderKind } from "./app/router/ScreenRouter";
import { useNav } from "./app/router/useNav";
import { AppShell } from "./app/shell/AppShell";
import { BottomNav } from "./app/shell/BottomNav";
import { useTemplatesState } from "./state/templates";
import { useTodayState } from "./state/today";
import { useAddState } from "./state/add";
import { useTelegramBootstrap } from "./shared/tg/useTelegramBootstrap";
import type { TabId } from "./app/shell/BottomNav";

declare const __BUILD_ID__: string;
const BUILD_LABEL = __BUILD_ID__;

export default function App() {
  const { tgPresent, tgOk } = useTelegramBootstrap();
  const [ selectedId, setSelectedId] = useState<number | null>(null);
  const [ placeholder, setPlaceholder] = useState<PlaceholderKind | null>(null);
  const { resetShowAll } = useTodayState();
  const { screen, go, goBack, goToday, goTemplates, goAdd } = useNav();
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

    useBack(tgOk);

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
    const showBackBar = screen !== "TODAY" || placeholder !== null;
    const onBackBar = () => {
      if (placeholder !== null) {
        setPlaceholder(null);
        return;
      }
      goBack();
    };

  return (
    <AppShell
      title={pageTitle}
      buildLabel={BUILD_LABEL}
      backBar={{ show: showBackBar, onBack: onBackBar }}
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
      <ScreenRouter
        screen={screen}
        placeholder={placeholder}
        onGoChallenges={() => {
          setPlaceholder(null);
          go("CHALLENGES");
        }}
        templates={templates}
        onAddTemplate={async (templateId) => {
          try {
            await addTemplate(templateId);
            goAdd();
          } catch (e: any) {}
        }}
        addProps={{
          newTitle,
          setNewTitle,
          newDesc,
          setNewDesc,
          newMissPolicy,
          setNewMissPolicy,
          onCreate: async () => {
            try {
              await create();
              goToday();
            } catch (e: any) {}
          },
        }}
        selectedId={selectedId}
        onOpenChallenge={(id) => {
          setSelectedId(id);
          go("DETAIL");
        }}
        onBackFromDetail={() => goBack()}
      />
    </AppShell>
  );
}
