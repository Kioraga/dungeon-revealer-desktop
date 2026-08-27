Dungeon Revealer Desktop is a local Electron app. No server to host, no docker image, no passwords.

## Prerequisites

- [Node.js](https://nodejs.org/) (14+)
- npm

## Install & run

```bash
npm install
npm run start:desktop
```

`npm run start:desktop` builds the app (frontend + backend) and launches the DM window. The player window is opened from within the app with **Start Sharing**; it opens fullscreen on the screen chosen via the **Screen** button in the DM toolbar.

## Where your data lives

Maps, tokens, notes and settings are stored in the Electron user data directory:

- Linux: `~/.config/dungeon-revealer-desktop/data`
- macOS: `~/Library/Application Support/dungeon-revealer-desktop/data`
- Windows: `%APPDATA%\dungeon-revealer-desktop\data`

## Development

```bash
npm run start:server:dev   # backend (ts-node-dev)
npm run start:frontend:dev # frontend (vite, port 4000)
```

For browser-based development without Electron, run both dev scripts and open `http://localhost:4000/dm`. The desktop-only features (player window, screen selection) are available only via `npm run start:desktop`.
