import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

// Telegram WebApp инициализируется внутри App (bootstrap)


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
