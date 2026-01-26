import { useCallback, useState } from "react";
import type { TemplateItem } from "../shared/domain/types";
import { LifeTrackerApi } from "../shared/api/lifetracker";

export function useTemplatesState() {
  const [templates, setTemplates] = useState<TemplateItem[] | null>(null);

  const loadTemplates = useCallback(async () => {
    const data = await LifeTrackerApi.getTemplates();
    setTemplates(data);
  }, []);

  const addTemplate = useCallback(async (templateId: number) => {
    await LifeTrackerApi.addTemplate(templateId);
  }, []);

  return {
    templates,
    loadTemplates,
    addTemplate,
  };
}
