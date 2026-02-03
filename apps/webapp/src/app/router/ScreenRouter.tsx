import type { Screen, TemplateItem } from "../../shared/domain/types";
import { PlaceholderCard } from "../../shared/ui/PlaceholderCard";
import { TodayPage } from "../../pages/today";
import { HistoryPage } from "../../pages/HistoryPage";
import MyChallengesPage from "../../pages/MyChallengesPage";
import DetailScreen from "../../features/detail/DetailScreen";
import { TemplatesScreen } from "../../features/templates/TemplatesScreen";
import { AddScreen } from "../../features/add/AddScreen";

export type PlaceholderKind = "INSIGHTS" | "PROFILE";

type AddProps = {
  newTitle: string;
  setNewTitle: (v: string) => void;
  newDesc: string;
  setNewDesc: (v: string) => void;
  newMissPolicy: "FAIL" | "MIN";
  setNewMissPolicy: (v: "FAIL" | "MIN") => void;
  onCreate: () => void | Promise<void>;
};

export function ScreenRouter(props: {
  screen: Screen;
  placeholder: PlaceholderKind | null;

  onGoChallenges: () => void;

  templates: TemplateItem[] | null;
  onAddTemplate: (templateId: number) => void | Promise<void>;

  addProps: AddProps;

  selectedId: number | null;
  onOpenChallenge: (id: number) => void;
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
    onBackFromDetail,
  } = props;

  if (screen === "TODAY") {
    if (placeholder === "INSIGHTS") return <PlaceholderCard title="Инсайты" text="Скоро" />;
    if (placeholder === "PROFILE") return <PlaceholderCard title="Профиль" text="Скоро" />;
    return <TodayPage onGoChallenges={onGoChallenges} />;
  }

  if (screen === "HISTORY") return <HistoryPage />;

  if (screen === "CHALLENGES") return <MyChallengesPage onOpen={onOpenChallenge} />;

  if (screen === "ADD") return <AddScreen {...addProps} />;

  if (screen === "TEMPLATES") return <TemplatesScreen templates={templates} onAdd={onAddTemplate} />;

  if (screen === "DETAIL") {
    return selectedId !== null ? (
      <DetailScreen challengeId={selectedId} onBack={onBackFromDetail} />
    ) : (
      <PlaceholderCard title="Челлендж" text="Не выбран" />
    );
  }

  return <TodayPage onGoChallenges={onGoChallenges} />;
}
