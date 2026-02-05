import { useLayoutEffect } from "react";

type Opts = {
  maxHeight?: number; // px
  minHeight?: number; // px
};

export function useAutosizeTextarea(
  ref: React.RefObject<HTMLTextAreaElement | null>,
  value: string,
  opts: Opts = {}
) {
  const { maxHeight = 220, minHeight = 44 } = opts;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Reset height so shrink works correctly
    el.style.height = "0px";

    const next = Math.min(el.scrollHeight, maxHeight);
    el.style.height = `${Math.max(next, minHeight)}px`;

    // If content exceeds maxHeight, enable internal scroll
    el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [ref, value, maxHeight, minHeight]);
}
