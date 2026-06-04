import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { UserSettingsProvider } from "./context/UserSettingsContext";
import "./i18n";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <UserSettingsProvider>
        <App />
      </UserSettingsProvider>
    </AuthProvider>
  </StrictMode>,
);
