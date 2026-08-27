// Local desktop wrapper. Boots the existing dungeon-revealer server in-process
// and opens two windows: the DM window and the fullscreen player window.
// ponytail: no packaging/installer yet (no electron-builder); run via `npm run start:desktop`. Add electron-builder when a distributable is needed.
// ponytail: the server listens on an ephemeral 127.0.0.1 port per launch, so no fixed port is exposed and browsers can't reach it. The socket must stay: Electron's renderer talks to the in-process server over HTTP/WebSocket.
const { app, BrowserWindow, ipcMain, screen } = require("electron");
const path = require("path");

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
      webPreferences: {
        preload: path.join(__dirname, "preload.cjs"),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });
    mainWindow.loadURL(`${appUrl}/dm`);
    mainWindow.on("closed", () => {
      mainWindow = null;
    });
  };

  const openPlayerWindow = (displayId) => {
    if (playerWindow && !playerWindow.isDestroyed()) {
      playerWindow.focus();
      return;
    }
    const displays = screen.getAllDisplays();
    const display =
      displays.find((d) => String(d.id) === String(displayId)) ||
      screen.getPrimaryDisplay();
    playerWindow = new BrowserWindow({
      x: display.bounds.x,
      y: display.bounds.y,
      fullscreen: true,
      frame: false,
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

  app.whenReady().then(async () => {
    ipcMain.handle("displays:list", () =>
      screen.getAllDisplays().map(({ id, label, bounds, isPrimary }) => ({
        id,
        label,
        bounds,
        isPrimary,
      }))
    );
    ipcMain.handle("player-window:open", (_, displayId) =>
      openPlayerWindow(displayId)
    );
    ipcMain.handle("player-window:set-display", (_, displayId) => {
      if (playerWindow && !playerWindow.isDestroyed()) {
        const display =
          screen
            .getAllDisplays()
            .find((d) => String(d.id) === String(displayId)) ||
          screen.getPrimaryDisplay();
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
    await new Promise((resolve, reject) => {
      httpServer.once("error", reject);
      httpServer.listen(0, process.env.HOST, resolve);
    });

    // Ephemeral port: nothing fixed is exposed. The renderer needs the URL, so
    // resolve it from the OS-assigned port.
    appUrl = `http://127.0.0.1:${httpServer.address().port}`;

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