<div align="center">

# ☀ G-Fi Monitor

**A fast, modern dashboard for UTL G-Fi solar / hybrid-inverter systems.**

Live power-flow, gauges, battery state, and daily/lifetime energy — built on the
same Firebase backend the official UTL G-Fi app uses, so it shows *your* real data
in real time.

</div>

---

## Why

The official UTL G-Fi app works, but its charts are hard to read and it's hard to
tell at a glance what's actually happening — is the house on solar, on battery, or
on the grid right now? This is a clean, self-hosted alternative that answers that
question instantly and looks good doing it.

> **Not affiliated with UTL, Fujiyama Power, or UTL Solar.** This is a personal
> project that reads your own account's data through the vendor's public Firebase
> backend. "UTL" and "G-Fi" are trademarks of their respective owners.

## Features

- **Live power-flow diagram** — animated Solar / Grid / Battery / Load, so you see
  at a glance where your power is coming from and going.
- **System Mode verdict** — plain-English status ("Running on grid — solar and
  battery idle", "Running on battery", "Exporting surplus to grid", …).
- **Gauges** — solar power, load, grid voltage/frequency, and a liquid-fill battery
  with an estimated state-of-charge.
- **Today** — solar generated, load consumed, battery drawn and grid exported since
  midnight (computed from the lifetime counters).
- **Lifetime totals** and a **recent-power trend chart**.
- **Auto device detection**, multi-device support, and tunable gauge/battery ranges
  (saved locally in your browser).

## Tech stack

React 19 · TypeScript · Vite · [Firebase](https://firebase.google.com/)
(Auth + Realtime Database) · [Apache ECharts](https://echarts.apache.org/)
(+ liquidfill) · Tailwind CSS v4.

---

## Architecture

```
┌──────────────┐   signInWithEmailAndPassword   ┌─────────────────────┐
│  G-Fi Monitor │ ─────────────────────────────▶ │  Firebase Auth       │
│  (this app)   │ ◀───────── ID token ─────────  │  (Google Identity)   │
└──────┬───────┘                                 └─────────────────────┘
       │  onValue( /alpha/deviceData/<serial> )   ┌─────────────────────┐
       └────────── live websocket stream ───────▶ │ Firebase Realtime DB │
                                                   │  project utl-g-fi-… │
                                                   └─────────────────────┘
```

- **Auth** is Firebase Email/Password — you sign in with your existing UTL G-Fi
  account. Credentials go only to Google's Identity Platform; nothing is stored by
  this app.
- **Data** is read from the vendor's **Firebase Realtime Database**. The app
  subscribes to your device's node and receives live updates over a websocket.

### Realtime Database layout

| Path | Contents |
|------|----------|
| `/alpha/deviceData/<serial>` | time-keyed telemetry records (`YYYYMMDDHHMMSS`) |
| `/alpha/deviceSwitch/<serial>/inverter` | inverter on/off control state |
| `/alpha/Log/<serial>` | event / history log |
| `/utl/userInfo/<uid>` | your account profile (used to auto-detect your serial) |

### Telemetry record shape (`/alpha/deviceData/<serial>/<timestamp>`)

All values arrive as **strings**; `.R` fields are the R phase (single-phase units),
stored nested as `{ "R": "…" }`. Parsed in [`src/telemetry.ts`](src/telemetry.ts).

```
Battery   { Curr, Volt, PKWH (charged kWh), NKWH (drawn kWh) }
Solar     { Power (W), Curr, Volt, Energy (kWh), sysstatus }
InputAC   { Volt.R, Curr.R, Frequency.R, ApparPower.R (VA), ActEnergy.R, sysstatus }   # grid in
OutputAC  { Volt.R, Curr.R, Frequency.R, ApparPower.R (VA), ActEnergy.R, sysstatus }   # load out
GridExport{ Power.R (W), Energy.R (kWh) }
Temp      { Inv, Chg, Rect, Ambient (°C) }
TS, Tstamp
```

**Two things worth knowing** (both confirmed against live data):
- The `Energy` / `ActEnergy` / `PKWH` / `NKWH` / export fields are **lifetime
  cumulative counters**, not daily. "Today" is computed as *latest − first-reading-
  of-the-day*.
- **Grid** (`InputAC`) and **Load** (`OutputAC`) are measured by **separate meters**
  and reported as **apparent power (VA)**, so they rarely match exactly — a small
  gap between them is normal metering noise, not a power deficit.

### Project structure

```
src/
├─ firebase.ts        Firebase init (public web config)
├─ telemetry.ts       parse RTDB records → typed `Reading`
├─ useTelemetry.ts    live subscription (last N samples)
├─ useDailyEnergy.ts  "today" = latest − first-of-day baseline
├─ useDevices.ts      auto-detect serial from your profile
├─ settings.ts        serial + gauge ranges (localStorage)
└─ components/
   ├─ Login.tsx        EnergyFlow.tsx    SystemStatus.tsx
   ├─ Gauge.tsx        BatteryOrb.tsx    TodayEnergy.tsx
   ├─ StatTiles.tsx    TrendChart.tsx    SettingsPanel.tsx
   └─ Dashboard.tsx
```

---

## How this was built (reverse-engineering notes)

For anyone curious how you get from "closed vendor app" to "my own dashboard",
here's the path — all of it using *my own account and my own device's data*:

1. **Fingerprint the app.** A quick look at the APK showed it's a **Flutter** app,
   not a native Android one — so decompiling Java would be a dead end; the logic
   lives in the Dart/Flutter build.
2. **Find the easy surface.** The *same* Flutter codebase is also shipped as a
   **web app** at `utlsmartsystems.com`. A web build is far easier to inspect than
   an APK — no emulator, no device cert tricks.
3. **Recover the backend config.** The web build's compiled Dart (`main.dart.js`)
   contained the **Firebase configuration** — API key, auth domain, and the
   Realtime Database URL (project `utl-g-fi-ce9e3`). These are *not secrets*: every
   Firebase web/mobile client ships them publicly. What actually protects the data
   is Firebase Auth + the project's security rules.
4. **Watch the live traffic.** Logging into the official web dashboard with my own
   account and watching the network showed the **Firebase Auth** token exchange
   followed by a **Realtime Database websocket** streaming my device's telemetry.
5. **Map the data.** From that stream I noted the database paths
   (`/alpha/deviceData/<serial>`, …) and decoded the record schema above.
6. **Rebuild it, better.** This app uses the official **Firebase JS SDK** to do
   exactly what the vendor app does — sign in, then subscribe to my device node —
   and renders it the way I actually want to see it.

Nothing here bypasses authentication or accesses anyone else's data: it signs in as
you and reads only what your account is already allowed to read.

---

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
```

Sign in with your UTL G-Fi account. The app tries to auto-detect your device
serial; if it can't, open **⚙ Settings** and enter it.

```bash
npm run build      # production build → dist/
npm run preview    # serve the production build locally
```

## Deploy

It's a static single-page app (`dist/`), so any static host works.

- **Vercel** (recommended) — import the repo at [vercel.com](https://vercel.com);
  it auto-detects Vite (build `npm run build`, output `dist`) and gives you a URL.
- **Netlify / Cloudflare Pages** — connect the repo; build `npm run build`, output
  `dist`. Add an SPA fallback if needed (Netlify: `/* /index.html 200`).
- **Firebase Hosting** — `firebase init hosting` (public dir `dist`, single-page
  app = yes), then `npm run build && firebase deploy`.

> **Note on auth:** the Firebase backend belongs to the vendor, so you can't change
> its settings — and you don't need to. Email/password sign-in via the SDK works
> from any origin (it already works from `localhost`), so the hosted URL just works.
> ("Authorized domains" only restricts OAuth popup logins, which this app doesn't
> use.)

> **Sharing with family:** the deployed page is just a login screen until someone
> signs in, so share the URL freely and give trusted family members the account
> login to view the data.

## Configuration

Everything is adjustable in **⚙ Settings** (persisted to your browser):

- **Device serial** (auto-detected when possible).
- **Solar / Load rated power** — sets the gauge scales; match your inverter's rating.
- **Battery empty/full voltage** — the battery feed has no SOC field, so SOC is
  *estimated* from voltage between these two points. Set them to your battery's real
  empty/full voltages for an accurate percentage.

---

## Privacy & security

- **No secrets in this repo.** The Firebase web config in `src/firebase.ts` is
  public-by-design (it ships in every client). Your data is protected by your login
  and the backend's security rules, not by hiding that config.
- **No personal data committed.** No account email, device serial, or tokens live in
  the source — the serial is entered at runtime and kept only in your browser's
  `localStorage`. Please keep it that way: don't hardcode your serial or commit
  screenshots that show it.
- Credentials are sent only to Google's Identity Platform during sign-in.
