import type { Screen, TemplateItem } from "../../shared/domain/types";
import { PlaceholderCard } from "../../shared/ui/PlaceholderCard";
import { TodayPage } from "../../pages/today";
import { HistoryPage } from "../../pages/HistoryPage";
import MyChallengesPage from "../../pages/MyChallengesPage";
import { MyChallengesListPage } from "../../pages/MyChallengesListPage";
import DetailScreen from "../../features/detail/DetailScreen";
import { TemplatesScreen } from "../../features/templates/TemplatesScreen";
import { AddScreen } from "../../features/add/AddScreen";
import { useState } from "react";

export type PlaceholderKind = "INSIGHTS" | "PROFILE";

type AddProps = {
  newTitle: string;
  setNewTitle: (v: string) => void;

  newDesc: string;
  setNewDesc: (v: string) => void;

  newType: "DO" | "NO_DO";
  setNewType: (v: "DO" | "NO_DO") => void;

  onCreate: () => void | Promise<void>;

  error?: string | null;
  editing?: boolean;
};

export function ScreenRouter(props: {
  screen: Screen;
  placeholder: PlaceholderKind | null;

  go: (screen: Screen) => void;
  onGoChallenges: () => void;

  templates: TemplateItem[] | null;
  onAddTemplate: (templateId: number) => void | Promise<void>;

  addProps: AddProps;
  

  selectedId: number | null;
  onOpenChallenge: (id: number) => void;
  onEditChallenge: (ch: { id: number; title: string; description?: string | null; type: "DO" | "NO_DO" }) => void;
  onBackFromDetail: () => void;
}) {

  const {
    screen,
    placeholder,
    onGoChallenges,
    templates,
    onAddTemplate,
    addProps,
    selectedId,
    onOpenChallenge,
    onEditChallenge,
    onBackFromDetail,
    go,
  } = props;

  // локально держим выбранный тип для списка
  const [chType, setChType] = useState<"DO" | "NO_DO">("DO");

  if (screen === "TODAY") {
    if (placeholder === "INSIGHTS") return <PlaceholderCard title="Инсайты" text="Скоро" />;
    if (placeholder === "PROFILE") return <PlaceholderCard title="Профиль" text="Скоро" />;
    return <TodayPage onGoChallenges={onGoChallenges} />;
  }

  if (screen === "HISTORY") return <HistoryPage />;

  // Root: только выбор типа (без списков)
  if (screen === "CHALLENGES") {
    return (
      <MyChallengesPage
        onOpenType={(t) => {
          setChType(t);
          go("CHALLENGES_LIST");
        }}
      />
    );
  }

  // Список выбранного типа
  if (screen === "CHALLENGES_LIST") {
    return (
      <MyChallengesListPage
        type={chType}
        onBack={() => go("CHALLENGES")}
        onOpenChallenge={onOpenChallenge}
      />
    );
  }

  if (screen === "ADD") return <AddScreen {...addProps} />;

  if (screen === "TEMPLATES") return <TemplatesScreen templates={templates} onAdd={onAddTemplate} />;

  if (screen === "DETAIL") {
    return selectedId !== null ? (
      <DetailScreen
        challengeId={selectedId}
        onBack={onBackFromDetail}
        onEdit={onEditChallenge}
      />
    ) : (
      <PlaceholderCard title="Челлендж" text="Не выбран" />
    );
  }
  return <TodayPage onGoChallenges={onGoChallenges} />;
}
