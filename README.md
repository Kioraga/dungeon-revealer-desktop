# Dungeon Revealer Desktop

A local desktop app (Electron) for tabletop RPGs that reveals game maps to your
players on a projector or external screen. The dungeon master controls
everything from a single window; the player view is a fullscreen mirror on a
second display.

Built on top of [dungeon-revealer](https://github.com/dungeon-revealer/dungeon-revealer).

## Features

- **DM window** — the main window. Load maps, draw/erase fog of war, add and
  move tokens, use the dice-roll chat and notes.
- **Player window** — fullscreen on the display of your choice (the projector),
  opened with **Start Sharing**. It is view-only: no chat, no user list, no
  toolbar.
- **DM | Player tabs** — a tab at the top of the DM window toggles between the
  DM view and a mirror of the player view, so you don't have to keep looking at
  the projector. The zoom / center-map controls in the mirror also move the
  player window.
- **Screen selection** — the **Screen** button in the DM toolbar picks which
  display the player window opens on.
- Everything runs locally on `127.0.0.1`. No server to host, no players to
  connect, no passwords.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (14+)

### Install & run

```bash
npm install
npm run start:desktop
```

The first run builds the app and opens the DM window.

## Using the app

### The DM window

The main window is the DM view:

- **Start Sharing** — uploads the current fog of war and opens the player
  window fullscreen on the selected screen.
- **Stop Sharing** — blanks the player window and closes it.
- **Screen** — choose which display the player window opens on.
- **DM | Player** (top center) — switch between the DM view and a mirror of the
  player view. The mirror shows the fog exactly as the players see it, with
  zoom / center-map controls that also drive the player window.
- Load a map via **Map Library**. Add tokens with the **Token** tool. Reveal
  map areas by drawing with the brush, or shroud them again.

### The player window

View-only. Shows the active map and fog of war live. No interaction: the DM
drives everything (tokens, zoom, center, notes).

### Shortcuts

| Key            | Functionality                                                                                 |
| -------------- | --------------------------------------------------------------------------------------------- |
| `1`            | select move tool.                                                                             |
| `2`            | select area tool.                                                                             |
| `3`            | select brush tool.                                                                            |
| `4`            | select mark tool.                                                                             |
| `5`            | select token tool.                                                                            |
| `Shift`        | toggle between hide/reveal.                                                                   |
| `CMD/Ctrl + S` | push map to players.                                                                          |
| Hold `Alt`     | use move tool while `Alt` key is pressed and return to previous mode after `Alt` is released. |

## Where your data lives

Maps, tokens, notes and settings are stored in the Electron user data
directory (e.g. `~/.config/dungeon-revealer-desktop/data` on Linux,
`~/Library/Application Support/dungeon-revealer-desktop/data` on macOS,
`%APPDATA%\dungeon-revealer-desktop\data` on Windows).

## Development

```bash
npm run start:server:dev   # backend (ts-node-dev)
npm run start:frontend:dev # frontend (vite, port 4000)
npm run build              # production build (build/ + server-build/)
```

For browser-based development without Electron, run the two dev scripts above
and open `http://localhost:4000/dm` (the Electron window features — player
window, screen selection — are only available when running via
`start:desktop`).

## License

ISC — see [LICENSE](LICENSE).
