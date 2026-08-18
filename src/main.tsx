import * as Sentry from "@sentry/react";
import { createRoot } from "react-dom/client";
import { onCLS, onFCP, onLCP, onTTFB } from "web-vitals";
import App from "./App.tsx";
import { initOfflineQueue } from "./lib/offlineQueue";
import "./index.css";

// ---------------------------------------------------------------------------
// Sentry error tracking
// ---------------------------------------------------------------------------
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  enabled: !!import.meta.env.VITE_SENTRY_DSN && import.meta.env.PROD,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 0.2,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

// ---------------------------------------------------------------------------
// Web Vitals — sends metrics to Sentry performance
// ---------------------------------------------------------------------------
function sendToSentry(metric: { name: string; value: number; id: string; delta: number }) {
  Sentry.setMeasurement(metric.name, metric.value, "millisecond");
}

onCLS(sendToSentry);
onFCP(sendToSentry);
onLCP(sendToSentry);
onTTFB(sendToSentry);

// ---------------------------------------------------------------------------
// Offline queue — retry failed Supabase writes on reconnect
// ---------------------------------------------------------------------------
initOfflineQueue();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------
createRoot(document.getElementById("root")!).render(<App />);
