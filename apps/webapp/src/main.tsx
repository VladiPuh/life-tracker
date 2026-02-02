import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { hasTelegramWebApp, initTelegram } from "./shared/tg/webapp";

// ВАЖНО: готовим Telegram WebApp ДО первого рендера,
// чтобы initData был доступен до первых API-запросов.
if (hasTelegramWebApp()) {
  initTelegram();
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
