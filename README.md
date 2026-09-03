# Dungeon Revealer Desktop

Show your tabletop RPG maps to players on a projector or second screen. You control everything, they just watch.

Built on top of [dungeon-revealer](https://github.com/dungeon-revealer/dungeon-revealer).

> [!WARNING]
> Partially **vibe-coded**. Expect weird code, odd workarounds and other slop. It works, but squint at your own risk. Cleanup PRs welcome.

## How it works

- **DM window** — your control panel. Load a map, cover it with fog, reveal areas with a brush, add tokens and roll dice.
- **Player window** — fullscreen on the projector. Players see only what you reveal. No buttons, no controls.

Everything runs on your computer. No internet, no accounts, no hosting needed.

## Download

Get the latest release from the **Releases** page:

- **Linux** → `DungeonRevealer_Linux.AppImage` (just run it, no install needed)
- **Windows** → `DungeonRevealer_Windows.msi`

Or run from source (see below).

## Quick Start (from source)

Requirements: [Node.js](https://nodejs.org/) 16+

```bash
npm install
npm run start:desktop
```

That's it — the DM window opens automatically.

## How to use

1. Open the app and load a map from **Map Library** (or drag & drop an image).
2. Draw fog with the **Brush** tool. Use **Shroud All** / **Clear All** to cover or uncover the whole map.
3. Click **Screen** to pick which display the player window will use.
4. Click **Start Sharing** — the player window opens fullscreen on that display.
5. Use the **DM | Player** tabs at the top to preview what players see without turning around. Zooming in the preview also zooms the projector.

To stop: click **Stop Sharing**. Closing the DM window closes everything.

### Tools

| Tool      | What it does                                |
| --------- | ------------------------------------------- |
| **Move**  | Pan and zoom the map                        |
| **Brush** | Reveal or hide fog (hold `Shift` to switch) |
| **Area**  | Select a rectangular area                   |
| **Mark**  | Ping a spot for players                     |
| **Token** | Place and move tokens                       |

Other actions: **Map Library**, **Media Library**, **Notes** and **Grid settings** are in the bottom toolbar.

### Shortcuts

| Key                                  | Action                                                        |
| ------------------------------------ | ------------------------------------------------------------- |
| `1` – `5`                            | Switch tools (1=Move, 2=Brush, 3=Area, 4=Mark, 5=Token)       |
| `Shift`                              | Toggle reveal / hide while using the brush                    |
| `Alt` (hold) / `Middle click` (drag) | Temporarily switch to Move                                    |
| `Ctrl + S` / `Cmd + S`               | Send current fog to players                                   |
| `Ctrl + Tab`                         | Toggle between the GM view and the player preview (DM window) |
| `Ctrl + Shift + F`                   | Search notes                                                  |

## Where your data is saved

Maps, tokens and notes are stored locally:

- Linux: `~/.config/dungeon-revealer-desktop/data`
- macOS: `~/Library/Application Support/dungeon-revealer-desktop/data`
- Windows: `%APPDATA%\dungeon-revealer-desktop\data`

## For developers

```bash
npm run start:server:dev    # backend only
npm run start:frontend:dev  # frontend only (http://localhost:4000/dm)
npm run build               # production build
npm test                    # tests
```

If you change anything in `server/graphql/` or `server/maps.ts`, run:

```bash
npm run write-schema        # regenerate GraphQL types
./node_modules/.bin/relay-compiler
```

> Pinned versions: Electron 31, Vite 2.7, Relay 10. Don't upgrade without checking — they are tied together.

See `AGENTS.md` for architecture details.

## License

ISC — see [LICENSE](LICENSE).
