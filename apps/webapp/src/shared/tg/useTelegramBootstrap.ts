import { useMemo } from "react";
import { getInitData } from "./initData";
import { hasTelegramWebApp } from "./webapp";

export function useTelegramBootstrap() {
  return useMemo(() => {
    const tgPresent = hasTelegramWebApp();
    const initData = getInitData();
    const tgOk = tgPresent && initData.length > 0;
    return { tgPresent, tgOk, initData };
  }, []);
}
