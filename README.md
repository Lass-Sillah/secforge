# SECFORGE — SY0-701 PBQ Trainer

A Progressive Web App for CompTIA Security+ SY0-701 performance-based question (PBQ) training. Styled as a roguelike terminal/hacker game.

## What's Inside

Seven game modules, all accessible from the hub:

| Game | PBQ Type | Domains |
|------|----------|---------|
| PORT MASTER | Protocol ↔ port mapping, secure replacements | 3 & 4 |
| FIREWALL FORGE | Drag-to-order ruleset builder (top-down first-match-wins) | 3 & 4 |
| LOG HUNTER | Click the suspicious IoC in real log output | 2 & 4 |
| ATTACK MATCH | Drag-match attacks to descriptions | 2 |
| INCIDENT ORDER | Order IR lifecycle + forensic Order of Volatility | 4 & 5 |
| ACCESS CONTROL | MAC / DAC / RBAC / ABAC scenario classification | 1 & 4 |
| CRYPTO SELECT | Match use cases to algorithms, flag deprecated ones | 3 |

## Roguelike Engine

Every game runs on the same engine:

- **E → D → C → B → A → S** rank ladder
- Stack = fixed set of questions; must clear **FLAWLESSLY** (zero misses) to rank up
- One wrong answer resets the stack to the top with reshuffled options
- Per-card countdown timer (tighter at higher ranks)
- Combo multiplier feeds score
- **Review Mode**: step through answered cards (read-only) while the live card's timer pauses; RESUME returns to the game

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:5173 (or the port Vite selects).

## Production Build

```bash
npm run build
```

Output in `dist/`. The app is offline-capable via a Workbox service worker.

## Deploy to GitHub Pages

1. Install the deploy helper (one-time):
   ```bash
   npm install --save-dev gh-pages
   ```

2. Add your repo URL to `package.json` → `"homepage"`:
   ```json
   "homepage": "https://<your-github-username>.github.io/secforge"
   ```

3. Deploy:
   ```bash
   npm run deploy
   ```

The `vite.config.ts` already sets `base: '/secforge/'` for correct asset paths.

## Tech Stack

- **React 18** + **Vite** + **TypeScript**
- **Tailwind CSS v4** (via `@tailwindcss/vite`)
- **Zustand** for state management (persisted to `localStorage`)
- **React Router v6** (HashRouter for GitHub Pages compat)
- **vite-plugin-pwa** + Workbox service worker
- **JetBrains Mono** font via `@fontsource`
- Zero backend — everything runs client-side

## Adding Questions

Each game reads from a typed data file in `src/data/`:

- `src/data/ports.ts` — PORT MASTER question pool
- `src/data/firewall.ts` — FIREWALL FORGE scenarios
- `src/data/logs.ts` — LOG HUNTER log scenarios
- `src/data/attacks.ts` — ATTACK MATCH attack entries
- `src/data/incidents.ts` — INCIDENT ORDER step lists
- `src/data/accessControl.ts` — ACCESS CONTROL scenarios
- `src/data/crypto.ts` — CRYPTO SELECT use cases + algorithm list

All types are defined in `src/types/index.ts`.
