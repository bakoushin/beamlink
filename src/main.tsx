import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ThemeProvider } from "./components/theme-provider.tsx";
import { Analytics } from "@vercel/analytics/react";
import { Buffer } from "buffer";
import { initMixpanel } from "./mixpanel.ts";

// Make Buffer available globally
globalThis.Buffer = Buffer;

initMixpanel();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
      <Analytics />
    </ThemeProvider>
  </StrictMode>
);
