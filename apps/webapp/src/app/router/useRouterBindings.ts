// LT-SOURCE: AUTO 2026-02-01 03:55
import { useCallback, useState } from "react";
import { ScreenRouter } from "./ScreenRouter";
import type { PlaceholderKind } from "./ScreenRouter";
import type { Screen } from "../../shared/domain/types";

import { useTemplatesState } from "../../state/templates";
import { useAddState } from "../../state/add";

type ScreenRouterProps = Parameters<typeof ScreenRouter>[0];

export function useRouterBindings(params: {
  screen: Screen;
  placeholder: PlaceholderKind | null;
  go: (screen: Screen) => void;
  goBack: () => void;
  goAdd: () => void;
  goToday: () => void;

  selectedId: number | null;
  setSelectedId: (id: number | null) => void;

  closePlaceholder: () => void;
}) {
  const { templates, addTemplate } = useTemplatesState();
  const {
    newTitle,
    setNewTitle,
    newDesc,
    setNewDesc,
    newType,
    setNewType,
    save,
    editingId,
    startEdit,
  } = useAddState();
  const [addError, setAddError] = useState<string | null>(null);

  const onGoChallenges = useCallback(() => {
    params.closePlaceholder();
    params.go("CHALLENGES");
  }, [params]);

  const onAddTemplate = useCallback(
    async (templateId: number) => {
      try {
        await addTemplate(templateId);
        params.goAdd();
      } catch (e: any) {}
    },
    [addTemplate, params]
  );

  const onCreate = useCallback(async () => {
    try {
      setAddError(null);
      await save();
      params.goToday();
    } catch (e: any) {
      setAddError(e?.message ? String(e.message) : "Ошибка сохранения");
    }
  }, [save, params]);

  const onOpenChallenge = useCallback(
    (id: number) => {
      params.setSelectedId(id);
      params.go("DETAIL");
    },
    [params]
  );

  const onEditChallenge = useCallback(
    (ch: { id: number; title: string; description?: string | null; type: "DO" | "NO_DO" }) => {
      startEdit(ch);
      params.goAdd();
    },
    [startEdit, params]
  );

  const onBackFromDetail = useCallback(() => {
    params.goBack();
  }, [params]);

  const bindings: ScreenRouterProps = {
    screen: params.screen,
    placeholder: params.placeholder,

    go: params.go,
    onGoChallenges,

    templates,
    onAddTemplate,

    addProps: {
      newTitle,
      setNewTitle,
      newDesc,
      setNewDesc,
      newType,
      setNewType,
      onCreate,
      error: addError,
      editing: editingId !== null,
    },

    selectedId: params.selectedId,
    onOpenChallenge,
    onBackFromDetail,
    onEditChallenge,
  };

  return { bindings };
}
