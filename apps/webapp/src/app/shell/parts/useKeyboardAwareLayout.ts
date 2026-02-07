import { useEffect, useMemo, useRef, useState } from "react";

const SHOW_AFTER_BLUR_MS = 220;

export function useKeyboardAwareLayout(args: {
  backBarShow: boolean;
  scrollMode?: "auto" | "locked";
}) {
  const { backBarShow, scrollMode } = args;

  const [isInputActive, setIsInputActive] = useState(false);
  const [isPostBlurHold, setIsPostBlurHold] = useState(false);

  const holdSeqRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const cancelHold = () => {
    holdSeqRef.current += 1;
    setIsPostBlurHold(false);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const startHold = () => {
    const seq = (holdSeqRef.current += 1);
    setIsPostBlurHold(true);

    const t0 = performance.now();

    const tick = () => {
      if (holdSeqRef.current != seq) return;
      const dt = performance.now() - t0;
      if (dt >= SHOW_AFTER_BLUR_MS) {
        setIsPostBlurHold(false);
        rafRef.current = null;
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    const isFormEl = (el: Element | null) => {
      const node = el as HTMLElement | null;
      if (!node) return false;
      const tag = node.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return true;
      if (node.isContentEditable) return true;
      return false;
    };

    const sync = () => {
      const active = isFormEl(document.activeElement);
      setIsInputActive(active);
      if (active) {
        cancelHold();
      }
    };

    const onFocusIn = () => {
      sync();
    };

    const onFocusOut = () => {
      requestAnimationFrame(() => {
        const active = isFormEl(document.activeElement);
        setIsInputActive(active);

        if (!active) startHold();
        else cancelHold();
      });
    };

    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);

    sync();
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      cancelHold();
    };
  }, []);

  const showBottomUI = useMemo(() => {
    return !isInputActive && !isPostBlurHold;
  }, [isInputActive, isPostBlurHold]);

  const disableBottomUIAnim = isInputActive;

  const scrollPadBottom = useMemo(() => {
    if (!showBottomUI) return "calc(var(--app-pad) + var(--safe-bottom))";

    return backBarShow
      ? "calc(var(--app-pad) + var(--nav-h) + var(--safe-bottom) + 52px)"
      : "calc(var(--app-pad) + var(--nav-h) + var(--safe-bottom))";
  }, [showBottomUI, backBarShow]);

  const bottomOpacity = showBottomUI ? 1 : 0;
  const bottomPE: "auto" | "none" = showBottomUI ? "auto" : "none";
  const bottomTransform = showBottomUI ? "translateY(0)" : "translateY(18px)";
  const isScrollLocked = scrollMode === "locked" && !isInputActive;

  return {
    showBottomUI,
    disableBottomUIAnim,
    scrollPadBottom,
    bottomOpacity,
    bottomPE,
    bottomTransform,
    isScrollLocked,
  };
}
