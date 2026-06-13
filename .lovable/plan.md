# Signal Guardian — Finalize, Real Data & Polish

## What you'll get
- Real cell-tower data near your GPS from the **OpenCellID** public database.
- A bigger, GPS-accurate Scan Control radar where dots reflect real tower bearing/distance.
- A "Silent SMS Protection" security option: detection toggle + alerts + a how-to-block guide.
- Layout/scale fixes for every phone size, refined notifications, and a faster, cleaner UI.
- Bug sweep across the codebase, then publish live.

## Important reality check (so the app is honest)
This is a web app in a browser. A browser **cannot** read the cellular radio, so it cannot truly capture IMSI, raw Cell-ID, or intercept/block silent (Type-0) SMS — those need an Android OS app or RTL-SDR hardware. So:
- "Real data" = your **real GPS** + **real towers from OpenCellID** around you (genuine public data).
- "Block silent SMS" = a **detection/awareness** toggle that flags suspected silent-SMS patterns, raises alerts, and a guide on how to actually block them on a real device. It will be clearly labelled as detection/guidance, not radio-level blocking.

## Backend (minimal, secure)
OpenCellID needs an API key, which must stay server-side. I'll enable **Lovable Cloud** and add one small **edge function** (`opencellid-towers`) that:
- Takes a bounding box (lat/lng + radius) from the map.
- Calls OpenCellID `cell/getInArea`, returns real towers as GeoJSON-friendly JSON.
- Caches results briefly and handles errors/rate limits gracefully.
- Keeps the API key in a secret (`OPENCELLID_API_KEY`) — never in the frontend.

This reintroduces a tiny cloud backend (the project memory said "decoupled from cloud"); it's required for a secure real-data key, so I'll update that memory note.

## Phase 1 — Real tower data
- New `useOpenCellId` hook + `src/lib/openCellId.ts` client that calls the edge function with the current map bounds (debounced on move/zoom).
- `MapPage`: replace `generateCellTowersAroundLocation` with real towers from OpenCellID; keep GPS-accurate simulated towers only as a labelled fallback when the key/data is unavailable. Show a "Live data / Simulated fallback" badge.
- Run the existing `anomalyEngine` over the real towers to compute suspicion (unknown MCC/MNC, missing/old, 2G presence, out-of-region) so suspicious markers are based on real attributes.
- Settings: wire the existing OpenCellID key field to save the secret + a clear note that the key powers live data.

## Phase 2 — Bigger, GPS-accurate Scan Control radar
- Enlarge the radar on the dashboard (remove `scale-75`, give it a responsive size up to ~256px).
- Replace random blips with **real geometry**: project each detected tower's lat/lng to bearing + distance from the user's GPS, place the dot at the correct angle and scaled radius (rings labelled with real meters based on max range). Suspicious towers pulse red.
- Tie the "Signals/threats" count to real detections; keep the sweep animation. Add an ARIA live label.

## Phase 3 — Silent SMS Protection (security option)
- Add to Settings a "Silent SMS Protection" card: enable detection toggle + alert-on-detect toggle.
- Detection feeds the alerts system: when a `SILENT_SMS` pattern appears in the feed, raise a warning alert (respecting the toggle).
- Add a "How to block silent SMS on your device" section to the Protection Guide (Android settings, SnoopSnitch/Android IMSI-Catcher Detector, network downgrade lock, airplane-mode tips), clearly marked as device-level actions.

## Phase 4 — Layout, design & notifications polish
- Audit responsive scaling across phones (320–430px): consistent padding, no overflow, fluid stat grid, taller map on small screens, safe-area aware bottom nav.
- Standardize hover/focus/active states and 44px touch targets (continue the earlier a11y pass on remaining pages: Settings, Tactical, Protection).
- Refine the notification/toast styling and the dashboard "Recent Alerts" for readability; ensure high-contrast, token-based colors only.

## Phase 5 — Bug sweep & speed
- Read through all pages/components/hooks; fix runtime errors, broken conditionals, stale deps, and any dynamic Tailwind class strings (per project rules).
- Code-split heavy routes (map/Leaflet) with dynamic import; verify build is clean (no TS/build errors).
- Check console + preview on mobile viewport after changes.

## Phase 6 — Publish
- Set proper title/meta/OG/favicon for "Signal Guardian".
- Run a security scan, resolve criticals, then publish to the live Lovable URL.

## Technical notes
- Stack stays React 18 + Vite + Tailwind + Leaflet (not Next.js/MapLibre — those from the pasted brief don't apply to this project).
- Edge function: `supabase/functions/opencellid-towers/index.ts`, CORS-enabled, Zod-validated bbox input, secret-based key.
- Files touched (approx): `MapPage.tsx`, `TowerMap.tsx`, `RadarDisplay.tsx`, `Index.tsx`, `SettingsPage.tsx`, `ProtectionGuidePage.tsx`, `anomalyEngine.ts`, new `src/lib/openCellId.ts`, new `src/hooks/useOpenCellId.ts`, plus the edge function and a secret.
