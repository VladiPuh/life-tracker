import { useCallback, useEffect, useState } from "react";
import type { Screen } from "../../shared/domain/types";

// Экраны, где нужен BackButton (не табы)
const NESTED: Screen[] = ["DETAIL", "ADD", "TEMPLATES"];

export function useNav() {
  const [screen, setScreen] = useState<Screen>("TODAY");

  const canGoBack = NESTED.includes(screen);

  const go = useCallback((next: Screen) => {
    if (NESTED.includes(next)) {
      window.history.pushState({ screen: next }, "");
    } else {
      window.history.replaceState({ screen: next }, "");
    }
    setScreen(next);
  }, []);

  const goToday = useCallback(() => {
    setScreen("TODAY");
  }, []);

  const goTemplates = useCallback(() => go("TEMPLATES"), [go]);
  const goAdd = useCallback(() => go("ADD"), [go]);

  // Back внутри приложения: если есть history entry — откатываемся,
  // иначе просто возвращаемся на TODAY.
  const goBack = useCallback(() => {
    if (window.history.state?.screen) {
      window.history.back();
      return;
    }
    setScreen("TODAY");
  }, []);

  // Системный Back (history pop)
  useEffect(() => {
    window.history.replaceState({ screen: "TODAY" }, "");
    
    const onPop = (e: PopStateEvent) => {
      const s = (e.state?.screen as Screen | undefined) ?? "TODAY";
      setScreen(s);
    };

    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  return { screen, canGoBack, go, goBack, goToday, goTemplates, goAdd };
}
