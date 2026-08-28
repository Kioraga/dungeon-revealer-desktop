# AGENTS.md

Local Electron desktop app (`dungeon-revealer-desktop`) that reveals game maps
to players on a projector. The DM window (`/dm`) controls everything; the
player window (`/?map_only=true`) is a fullscreen mirror on another display.
Conversation language is Spanish; commits/README are English.

## Commands

```sh
npm run build              # prebuild + relay-compiler + vite + tsc server → server-build/
npm run write-schema       # REGENERATE type-definitions.graphql from gqtx server code
./node_modules/.bin/relay-compiler
./node_modules/.bin/tsc --noEmit
npm test                   # jest (server/*.spec.ts)
npm run start:desktop      # build + electron .
npm run start:frontend:dev # vite dev (web, no Electron)
npm run start:server:dev   # ts-node-dev server/index.ts
```

Order matters: after ANY change to `server/graphql/**` or `server/maps.ts`
types, run `npm run write-schema` BEFORE `relay-compiler` — relay reads the
generated `type-definitions.graphql` (never hand-edit it).

`npm run eslint` lints ONLY `**/*.js` (server side) — TS/TSX is checked via
`tsc --noEmit` (see Gotchas for known errors). Husky + lint-staged run
eslint+prettier on staged files at commit (`prettier --write` covers
js/json/md/html/ts/tsx/graphql).

## Architecture

- **Versions are pinned for compatibility — do not bump**: Electron 16 (matches
  `@types/node@14`, TS 4.4.4; Electron 31 breaks tsc), Vite 2.7.3, Relay 10.
  `sqlite3` uses NAPI v6 and loads in Electron WITHOUT `@electron/rebuild`.
- **Server runs in-process**: Electron boots `server-build/server.js`
  (`bootstrapServer`) and binds `127.0.0.1`, REBINDING the previous session's
  port from `userData/server-port` (falls back to an ephemeral `listen 0` on
  `EADDRINUSE`) so the localStorage origin stays stable across restarts;
  `appUrl` is resolved after listen in `electron/main.cjs`. Renderers talk
  HTTP/WebSocket to that in-process server. Artifacts: vite `outDir` is
  `build/` (gitignored, carries the icons/monaco electron-builder needs) and
  tsc emits `server-build/`; electron-builder packages `build/` +
  `server-build/` + `electron/` into `release/`. `dist` is vestigial.
- **Two windows, one app**: DM window loads `/dm`, player window loads
  `/?map_only=true`. Renderer ↔ main IPC via `window.desktopApi`
  (`electron/preload.cjs`, typed in `src/desktop-api.d.ts`):
  `listDisplays`, `openPlayerWindow`, `setPlayerDisplay`, `closePlayerWindow`.
- **Camera sync**: the DM-window mirror publishes `{cx, cy, scale, rotation}`
  (image center + zoom + rotation relative to fit) on socket `viewState`; the
  server relays it to all sockets (`socket.broadcast.emit`); the projector
  window applies it. The mirror's camera is intentionally INDEPENDENT of the
  DM view's camera (zoom in the Player tab zooms the projector). New: the
  player window also emits `playerViewport {capW, capH}` (viewport size in
  image px, resynced on resize) so the DM's viewport rectangle
  (`player-viewport-rect.tsx`) keeps the projector window's shape.
- **Both DM view and mirror stay mounted** (crossfade via opacity/visibility in
  `dm-area.tsx` `ViewFade`) so each keeps its camera/tool/brush state. No
  unmount/remount on view switch. Hidden canvas still renders (`ponytail:` on
  the component names the frameloop upgrade path).
- **Token visibility is filtered TWICE**: server-side by socket role
  (`server/graphql/modules/map.ts` `tokens` resolver — admin sees all, user
  sees `isVisibleForPlayers` only) AND client-side in `map-view.tsx`
  `TokenListRenderer` via `IsDungeonMasterContext` (false in both player
  views). Keep both filters when touching token rendering.
- **Fog**: brush draw end calls BOTH `saveFogProgress` (DM progress image) and
  `sendLiveMap` (live player fog) so the player view updates without
  re-sharing. `/map/:id/send` bumps the fog-live revision and invalidates
  `Query.activeMap`.
- **Live queries**: `@live` queries re-run on `invalidateResourcesRT([...])`
  (GraphQL mutations in `map.ts`) or `emitter.emit("invalidate", ...)` (REST
  routes in `server/routes/map.js`). Both channels are used — check which one
  a mutation belongs to.
- **Logs panel** is dice-only (DiceRoller; `authorName` hardcoded
  "Dungeon Master" server-side) and always starts hidden (plain state, not
  persisted).
- `patches/` has patch-package fixes for relay-compiler, react-spring,
  use-sound — run `npm install` if patches are missing.
- **i18n**: UI strings are English source, looked up by `useI18n().t()` against
  the ES dictionary in `src/i18n/translations.ts` (missing key → English).
  The Electron menu switches language (main persists it in `userData/locale`,
  system locale is the default); `desktopApi.{getLocale,setLocale,onLocaleChanged}`
  sync it to the renderer. Keys ARE the English strings — renaming one in the
  UI silently drops its translation.

## Gotchas

- **Pre-existing tsc errors — do NOT "fix" them**: `OffscreenCanvas` +
  implicit-any blob in `src/dm-area/dm-map.tsx` (695/701) and
  `use-async-clipboard-api.ts`. `tsc --noEmit` should show ONLY those; any
  new error is yours.
- **Adding a token field** (e.g. `labelColor`) requires the full chain:
  `server/maps.ts` entity + `server/routes/map.js` PATCH + GraphQL type in
  `server/graphql/modules/map.ts` → `npm run write-schema` → `relay-compiler`
  → client fragment + `src/map-typings.tsx` + any fragment that spreads tokens
  (e.g. `map-context-menu-renderer.tsx`).
- **Headless verification via CDP**: `nohup node_modules/electron/dist/electron --no-sandbox --remote-debugging-port=9333 . > /tmp/opencode/el.log 2>&1 & echo $! > /tmp/opencode/epid.txt`, then `curl :9333/json` for the page
  WebSocket URL and drive it with a small node WebSocket script. The app uses
  `requestSingleInstanceLock` — kill leftover electron processes before
  relaunching (a second instance quits immediately).
- **localStorage state survives across launches** — localStorage is scoped to
  the origin `http://127.0.0.1:PORT`, and the `userData/server-port` rebind is
  what makes it survive (a fresh ephemeral port would reset it). State:
  `loadedMapId`, `dmPassword`, `settings.playerDisplayId`. Clearing
  `loadedMapId` in a CDP test makes later launches open the Map Library modal
  with no DM toolbar (and no Close button while no map is loaded — by design).
- Screen-display names on Wayland come from `wayland-info` parsing in
  `electron/main.cjs` (`display.label` is empty on Linux).
- The bash tool wrapper mangles complex one-liners with `pkill`/`(... &)`
  backgrounding — use `nohup ... &` + a PID file instead.
- Commits are English, conventional (fix:/feat:/refactor:); never mix
  unrelated changes in one commit.
