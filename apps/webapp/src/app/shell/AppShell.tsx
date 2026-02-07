import type { ReactNode } from "react";
import { BackBar } from "./parts/BackBar";
import { BottomNavHost } from "./parts/BottomNavHost";
import { OverlayHost } from "./parts/OverlayHost";
import { TopBar } from "./parts/TopBar";
import { useKeyboardAwareLayout } from "./parts/useKeyboardAwareLayout";

type Props = {
  title: string;
  children: ReactNode;
  bottomNav: ReactNode;
  buildLabel?: string | null;
  backBar?: {
    show: boolean;
    onBack: () => void;
    label?: string;
  };
  overlay?: ReactNode;
  scrollMode?: "auto" | "locked";
};

export function AppShell({ title, children, bottomNav, buildLabel, backBar, overlay, scrollMode }: Props) {
  const layout = useKeyboardAwareLayout({
    backBarShow: Boolean(backBar?.show),
    scrollMode,
  });

  return (
    <div
      style={{
        maxWidth: 520,
        width: "100%",
        margin: "0 auto",
        height: "var(--tg-vh, 100dvh)",
        display: "flex",
        flexDirection: "column",
        fontFamily: "system-ui, Arial",
      }}
    >
      <TopBar title={title} />

      <div
        style={{
          flex: 1,
          overflowY: layout.isScrollLocked ? "hidden" : "auto",
          overflowX: "hidden",
          overscrollBehaviorY: layout.isScrollLocked ? "none" : "contain",
          paddingLeft: "var(--app-pad)",
          paddingRight: "var(--app-pad)",
          paddingTop: "calc(var(--app-pad) + var(--topbar-gap))",
          paddingBottom: layout.scrollPadBottom,
          WebkitOverflowScrolling: "touch",
        }}
      >
        {children}
      </div>

      <BackBar
        show={Boolean(backBar?.show)}
        showBottomUI={layout.showBottomUI}
        onBack={backBar?.onBack ?? (() => {})}
        label={backBar?.label}
        buildLabel={buildLabel}
        bottomOpacity={layout.bottomOpacity}
        bottomPE={layout.bottomPE}
        bottomTransform={layout.bottomTransform}
        disableBottomUIAnim={layout.disableBottomUIAnim}
      />

      <BottomNavHost
        showBottomUI={layout.showBottomUI}
        bottomOpacity={layout.bottomOpacity}
        bottomPE={layout.bottomPE}
        bottomTransform={layout.bottomTransform}
        disableBottomUIAnim={layout.disableBottomUIAnim}
      >
        {bottomNav}
      </BottomNavHost>

      <OverlayHost overlay={overlay} />
    </div>
  );
}
