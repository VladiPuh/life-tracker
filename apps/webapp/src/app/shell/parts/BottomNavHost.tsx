import type { ReactNode } from "react";

export function BottomNavHost(props: {
  showBottomUI: boolean;
  bottomOpacity: number;
  bottomPE: "auto" | "none";
  bottomTransform: string;
  disableBottomUIAnim: boolean;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        position: "relative",
        zIndex: 10,
        maxHeight: props.showBottomUI ? 140 : 0,
        overflow: "hidden",
        opacity: props.bottomOpacity,
        pointerEvents: props.bottomPE,
        transition: props.disableBottomUIAnim ? "none" : "transform 180ms ease, opacity 120ms ease",
        willChange: props.disableBottomUIAnim ? "auto" : "transform",
        transform: props.bottomTransform,
      }}
    >
      {props.children}
    </div>
  );
}
