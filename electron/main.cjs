// Local desktop wrapper. Boots the existing dungeon-revealer server in-process
// and opens two windows: the DM window and the fullscreen player window.
// ponytail: Linux ships as AppImage via electron-builder (see electron-builder.yml, .github/workflows/release-build.yml); win/mac still use electron-packager folders.
// ponytail: the server listens on an ephemeral 127.0.0.1 port per launch, so no fixed port is exposed and browsers can't reach it. The socket must stay: Electron's renderer talks to the in-process server over HTTP/WebSocket.
const { app, BrowserWindow, ipcMain, screen } = require("electron");
const path = require("path");
const fs = require("fs");

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  process.env.HOST = process.env.HOST || "127.0.0.1";
  process.env.DATA_DIRECTORY =
    process.env.DATA_DIRECTORY || path.join(app.getPath("userData"), "data");

  let appUrl = null;
  let mainWindow = null;
  let playerWindow = null;

  const createMainWindow = () => {
    mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      icon: path.join(__dirname, "..", "build", "images", "icons", "android-chrome-512x512.png"),
      autoHideMenuBar: true,
      webPreferences: {
        preload: path.join(__dirname, "preload.cjs"),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });
    mainWindow.loadURL(`${appUrl}/dm`);
    mainWindow.on("closed", () => {
      mainWindow = null;
      // Closing the DM window is the app's exit signal, even while the player
      // window is still open (app.quit() closes every window first).
      app.quit();
    });
  };

  const openPlayerWindow = async (displayKey) => {
    if (playerWindow && !playerWindow.isDestroyed()) {
      playerWindow.focus();
      return;
    }
    const display = await resolveDisplay(displayKey);
    playerWindow = new BrowserWindow({
      x: display.bounds.x,
      y: display.bounds.y,
      fullscreen: true,
      frame: false,
      icon: path.join(__dirname, "..", "build", "images", "icons", "android-chrome-512x512.png"),
      webPreferences: {
        preload: path.join(__dirname, "preload.cjs"),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });
    playerWindow.loadURL(`${appUrl}/?map_only=true`);
    playerWindow.on("closed", () => {
      playerWindow = null;
    });
  };

  const closePlayerWindow = () => {
    if (playerWindow && !playerWindow.isDestroyed()) {
      playerWindow.close();
    }
    playerWindow = null;
  };

  // Real monitor names on Wayland: Electron's display.label is empty on Linux.
  // Query wayland-info (xdg_output name + description) and pair by position.
  // ponytail: Wayland + wayland-info only; X11 and missing binaries fall back
  // to Display N. Add an xrandr/EDID path if needed elsewhere.
  const getWaylandOutputs = async () => {
    if (!process.env.WAYLAND_DISPLAY) return null;
    try {
      const { execFile } = require("child_process");
      const { promisify } = require("util");
      const { stdout } = await promisify(execFile)("wayland-info", {
        timeout: 3000,
      });
      const outputs = [];
      for (const block of stdout.split("\txdg_output_v1").slice(1)) {
        const name = /name: '([^']+)'/.exec(block)?.[1];
        const desc = /description: '([^']+)'/.exec(block)?.[1];
        const pos = /logical_x: (-?\d+), logical_y: (-?\d+)/.exec(block);
        if (!name || !pos) continue;
        outputs.push({ name, desc: desc || null, x: +pos[1], y: +pos[2] });
      }
      return outputs;
    } catch {
      return null;
    }
  };

  // Stable display key across sessions: Electron's display.id is NOT stable on
  // Linux across restarts (Wayland assigns per-session ids), but the XRandR
  // label / Wayland output name is. The DM window persists this key so the
  // selected screen restores on the next launch.
  const getDisplayName = (display, outputs) => {
    if (display.label) return display.label;
    if (!outputs) return null;
    const match =
      outputs.find((o) => o.x === display.bounds.x && o.y === display.bounds.y) ||
      outputs.find(
        (o) =>
          Math.abs(o.x - display.bounds.x) <= 2 &&
          Math.abs(o.y - display.bounds.y) <= 2
      );
    return match ? (match.desc || match.name) : null;
  };

  // Resolve a persisted display key (stable name, legacy id, or null) to a
  // live display, falling back to the primary one.
  const resolveDisplay = async (key) => {
    const displays = screen.getAllDisplays();
    if (!key) return screen.getPrimaryDisplay();
    const byId = displays.find((d) => String(d.id) === String(key));
    if (byId) return byId;
    const outputs = await getWaylandOutputs();
    const byName = displays.find((d) => getDisplayName(d, outputs) === key);
    if (byName) return byName;
    return screen.getPrimaryDisplay();
  };

  app.whenReady().then(async () => {
    ipcMain.handle("displays:list", async () => {
      const displays = screen.getAllDisplays().map(
        ({ id, label, bounds, isPrimary }) => ({
          id,
          label,
          bounds,
          isPrimary,
        })
      );
      const outputs = await getWaylandOutputs();
      return displays.map((d) => ({ ...d, name: getDisplayName(d, outputs) }));
    });
    ipcMain.handle("player-window:open", (_, displayKey) =>
      openPlayerWindow(displayKey)
    );
    ipcMain.handle("player-window:set-display", async (_, displayKey) => {
      if (playerWindow && !playerWindow.isDestroyed()) {
        const display = await resolveDisplay(displayKey);
        playerWindow.setBounds(display.bounds);
        playerWindow.setFullScreen(true);
      }
    });
    ipcMain.handle("player-window:close", () => closePlayerWindow());

    const { bootstrapServer } = require(path.join(
      __dirname,
      "..",
      "server-build",
      "server.js"
    ));
    const { getEnv } = require(path.join(
      __dirname,
      "..",
      "server-build",
      "env.js"
    ));

    const { httpServer } = await bootstrapServer(getEnv(process.env));

    // localStorage is scoped to the origin (http://127.0.0.1:PORT), so an
    // ephemeral port per launch = empty storage every restart (lost
    // loadedMapId, dmPassword, player display...). Rebind the previous
    // session's port so the origin stays stable; fall back to ephemeral when
    // another process grabbed it.
    const portFile = path.join(app.getPath("userData"), "server-port");
    let lastPort = 0;
    try {
      lastPort = parseInt(fs.readFileSync(portFile, "utf8"), 10) || 0;
    } catch {
      // first launch: no port persisted yet, use an ephemeral one
    }
    const listenOn = (port) =>
      new Promise((resolve, reject) => {
        httpServer.once("error", reject);
        httpServer.listen(port || 0, process.env.HOST, resolve);
      });
    try {
      await listenOn(lastPort);
    } catch (err) {
      if (err.code !== "EADDRINUSE") throw err;
      await listenOn(0);
    }
    const port = httpServer.address().port;
    if (port !== lastPort) {
      fs.writeFileSync(portFile, String(port));
    }

    // The renderer needs the URL, so resolve it from the OS-assigned port.
    appUrl = `http://127.0.0.1:${port}`;

    createMainWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      }
    });
  });

  app.on("window-all-closed", () => {
    app.quit();
  });
}