import type { ReactNode } from "react";

export function OverlayHost(props: { overlay?: ReactNode }) {
  return <>{props.overlay ?? null}</>;
}
