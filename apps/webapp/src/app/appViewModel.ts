// LT-SOURCE: AUTO 2026-02-01 03:26
// App-level derived view state helpers.
// IMPORTANT: pure functions only. No React hooks here.

import type { PlaceholderKind } from "./router/ScreenRouter";
import type { TabId } from "./shell/BottomNav";

export function getActiveTab(params: {
  screen: string;
  placeholder: PlaceholderKind | null;
}): TabId {
  const { screen, placeholder } = params;

  if (placeholder === "INSIGHTS") return "insights";
  if (placeholder === "PROFILE") return "profile";

  if (screen === "ADD") return "new";
  if (screen === "TEMPLATES") return "templates";
  if (screen === "HISTORY" || screen.startsWith("HISTORY_")) return "history";

  // включая TODAY и все прочие fallback-экраны
  return "today";
}

export function getPageTitle(params: {
  screen: string;
  placeholder: PlaceholderKind | null;
}): string {
  const { screen, placeholder } = params;

  if (placeholder === "INSIGHTS") return "Инсайты";
  if (placeholder === "PROFILE") return "Профиль";

  if (screen === "HISTORY") return "История";
  if (screen === "HISTORY_DAY") return "День";
  if (screen === "TEMPLATES") return "Шаблоны";
  if (screen === "ADD") return "Новый";
  if (screen === "CHALLENGES") return "Челленджи";
  if (screen === "DETAIL") return "Челлендж";

  return "Сегодня";
}

export function shouldShowBackBar(params: {
  screen: string;
  placeholder: PlaceholderKind | null;
}): boolean {
  const { screen, placeholder } = params;

  // Канон: скрываем только на чистом Today, но на Today+overlay BackBar нужен.
  return screen !== "TODAY" || placeholder !== null;
}
