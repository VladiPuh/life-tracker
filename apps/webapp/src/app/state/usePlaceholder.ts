// LT-SOURCE: AUTO 2026-02-01 03:35
import { useCallback, useState } from "react";
import type { PlaceholderKind } from "../router/ScreenRouter";

export function usePlaceholder() {
  const [placeholder, setPlaceholder] = useState<PlaceholderKind | null>(null);

  const closePlaceholder = useCallback(() => {
    setPlaceholder(null);
  }, []);

  const openPlaceholder = useCallback((kind: PlaceholderKind) => {
    setPlaceholder(kind);
  }, []);

  return { placeholder, openPlaceholder, closePlaceholder };
}
