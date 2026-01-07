import mixpanel from "mixpanel-browser";

export function initMixpanel() {
  if ((window as any).__mixpanel_inited) return;
  (window as any).__mixpanel_inited = true;

  mixpanel.init(import.meta.env.VITE_MIXPANEL_TOKEN, {
    api_host: import.meta.env.VITE_MIXPANEL_URL,
    persistence: "localStorage",
    ignore_dnt: true,
    track_pageview: false,
    debug: import.meta.env.DEV,
  });
}
