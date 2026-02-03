// LT-SOURCE: AUTO 2026-02-01 03:21
import { useEffect, useRef, useState } from "react";
import {
  initTelegram,
  logTelegramReady,
} from "./shared/tg/webapp";
import { useBack } from "./app/router/useBack";
import { ScreenRouter } from "./app/router/ScreenRouter";
import { useNav } from "./app/router/useNav";
import { AppShell } from "./app/shell/AppShell";
import { BottomNav } from "./app/shell/BottomNav";
import { useTodayState } from "./state/today";
import { useTelegramBootstrap } from "./shared/tg/useTelegramBootstrap";
import type { TabId } from "./app/shell/BottomNav";
import { getActiveTab, getPageTitle, shouldShowBackBar } from "./app/appViewModel";
import { usePlaceholder } from "./app/state/usePlaceholder";
import { useRouterBindings } from "./app/router/useRouterBindings";


declare const __BUILD_ID__: string;
const BUILD_LABEL = __BUILD_ID__;

export default function App() {
  const { tgPresent, tgOk } = useTelegramBootstrap();
  const didTgInit = useRef(false);
  const [ selectedId, setSelectedId] = useState<number | null>(null);
  const { resetShowAll } = useTodayState();
  const { screen, go, goBack, goToday, goTemplates, goAdd } = useNav();
  const { placeholder, openPlaceholder, closePlaceholder } = usePlaceholder();
  const { bindings: routerBindings } = useRouterBindings({
    screen,
    placeholder,
    go,
    goBack,
    goAdd,
    goToday,
    selectedId,
    setSelectedId,
    closePlaceholder,
  });

    useEffect(() => {
      if (screen === "TODAY") {
        resetShowAll();
      }
    }, [screen, resetShowAll]);

    useEffect(() => {
      if (!tgPresent) return;
      if (didTgInit.current) return;
      didTgInit.current = true;

      initTelegram();
      logTelegramReady();
    }, [tgPresent]);

    useBack(tgOk);

    // active tab
    const activeTab = getActiveTab({ screen, placeholder });
    const pageTitle = getPageTitle({ screen, placeholder });
    const showBackBar = shouldShowBackBar({ screen, placeholder });
    const onBackBar = () => {
      // Screen-level override (e.g., History edit cancel)
      const ov = (window as any).__LT_BACK_OVERRIDE__ as undefined | (() => boolean | void);
      if (typeof ov === "function") {
        const handled = ov();
        if (handled === true) return;
      }

      if (placeholder !== null) {
        closePlaceholder();
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
            if (tab !== "insights" && tab !== "profile") closePlaceholder();
            if (tab === "today") return goToday();
            if (tab === "history") return go("HISTORY");
            if (tab === "new") return goAdd();
            if (tab === "templates") return goTemplates();
            if (tab === "insights") {
              goToday();
              openPlaceholder("INSIGHTS");
              return;
            }
            if (tab === "profile") {
              goToday();
              openPlaceholder("PROFILE");
              return;
            }
          }}
        />
      }
      >
      <ScreenRouter {...routerBindings} />
    </AppShell>
  );
}
