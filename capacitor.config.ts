import type { CapacitorConfig } from '@capacitor/cli';

// This app is Server-Component/Server-Action-heavy (see AGENTS.md context) —
// a fully bundled/offline Capacitor build would require a static export,
// which this architecture can't produce. server.url instead points the
// native WebView straight at the live production site; `www/` is only a
// placeholder so Capacitor's own tooling has a non-empty webDir to sync.
//
// Do NOT enable plugins.CapacitorHttp — it swaps window.fetch/XHR for a
// native bridge with its own cookie jar, separate from the WebView's, which
// silently breaks the cookie-based Supabase session this app relies on.
const config: CapacitorConfig = {
  appId: 'com.friendlyhealthy.app',
  appName: 'FriendlyHealthy',
  webDir: 'www',
  server: {
    url: 'https://allhealth.vercel.app',
    androidScheme: 'https',
  },
};

export default config;
