// Local desktop wrapper. Boots the existing dungeon-revealer server in-process
// and opens two windows: the DM window and the fullscreen player window.
// ponytail: Linux ships as AppImage via electron-builder (see electron-builder.yml, .github/workflows/release-build.yml); win/mac still use electron-packager folders.
// ponytail: the server listens on an ephemeral 127.0.0.1 port per launch, so no fixed port is exposed and browsers can't reach it. The socket must stay: Electron's renderer talks to the in-process server over HTTP/WebSocket.
const { app, BrowserWindow, ipcMain, screen, Menu, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const pkg = require("../package.json");

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  process.env.HOST = process.env.HOST || "127.0.0.1";
  process.env.DATA_DIRECTORY =
    process.env.DATA_DIRECTORY || path.join(app.getPath("userData"), "data");

  let appUrl = null;
  let mainWindow = null;
  let playerWindow = null;

  // --- i18n: menu labels + About are localized per current locale. -----------
  // ponytail: only menu/About live in main (renderer has its own dictionary in
  // src/i18n). Known locales are the ones with a translation; everything else
  // falls back to English per spec. Add a locale here AND in src/i18n.
  const PRODUCT_NAME = "Dungeon Revealer";
  // Menu bar shows the short name; the About dialog names the actual product.
  const PRODUCT_DISPLAY_NAME = "Dungeon Revealer Desktop";
  const authors = [pkg.author, ...(pkg.contributors || [])].join(", ");
  const KNOWN_LOCALES = ["en", "es"];
  const LANGUAGE_NAMES = { en: "English", es: "Español" };
  const MENU_TEXT = {
    en: {
      about: "About", language: "Language", quit: "Quit", edit: "Edit", view: "View", help: "Help",
      showMenuBar: "Show Menu Bar",
      undo: "Undo", redo: "Redo", cut: "Cut", copy: "Copy", paste: "Paste", selectAll: "Select All",
      reload: "Reload", toggleDevTools: "Toggle Developer Tools", resetZoom: "Reset Zoom",
      zoomIn: "Zoom In", zoomOut: "Zoom Out", toggleFullScreen: "Toggle Full Screen",
    },
    es: {
      about: "Acerca de", language: "Idioma", quit: "Salir", edit: "Editar", view: "Ver", help: "Ayuda",
      showMenuBar: "Mostrar barra de menú",
      undo: "Deshacer", redo: "Rehacer", cut: "Cortar", copy: "Copiar", paste: "Pegar", selectAll: "Seleccionar todo",
      reload: "Recargar", toggleDevTools: "Alternar herramientas de desarrollador", resetZoom: "Restablecer zoom",
      zoomIn: "Acercar", zoomOut: "Alejar", toggleFullScreen: "Alternar pantalla completa",
    },
  };
  const ABOUT_TEXT = {
    en: {
      title: "About Dungeon Revealer",
      description:
        "Show your tabletop RPG maps to players on a projector or second screen.",
      author: "Author",
      license: "License",
      versions: "Versions",
      ok: "OK",
    },
    es: {
      title: "Acerca de Dungeon Revealer",
      description:
        "Muestra los mapas de tu juego de rol a los jugadores en un proyector o segunda pantalla.",
      author: "Autor",
      license: "Licencia",
      versions: "Versiones",
      ok: "Aceptar",
    },
  };

  const normalizeLocale = (raw) =>
    KNOWN_LOCALES.includes(raw) ? raw : "en";

  const localeFile = () => path.join(app.getPath("userData"), "locale");

  const resolveLocale = () => {
    try {
      const saved = fs.readFileSync(localeFile(), "utf8").trim();
      if (KNOWN_LOCALES.includes(saved)) return saved;
    } catch {
      // first launch: no saved choice, use the system locale
    }
    return normalizeLocale((app.getLocale() || "en").split("-")[0]);
  };

  const showAbout = (locale) => {
    const text = ABOUT_TEXT[locale] || ABOUT_TEXT.en;
    dialog.showMessageBox(mainWindow, {
      type: "info",
      title: text.title,
      message: `${PRODUCT_DISPLAY_NAME} v${app.getVersion()}`,
      detail: `${text.description}\n\n${text.author}: ${authors}\n${text.license}: ${pkg.license}\n${text.versions}: Electron ${process.versions.electron} / Node.js ${process.versions.node} / Chromium ${process.versions.chrome}`,
      buttons: [text.ok],
    });
  };

  const setLocale = (locale) => {
    const normalized = normalizeLocale(locale);
    fs.writeFileSync(localeFile(), normalized);
    buildMenu(normalized);
    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.send("locale-changed", normalized);
    }
  };

  // Menu bar visibility toggle (persisted, like the locale).
  const menuBarVisibleFile = () =>
    path.join(app.getPath("userData"), "menu-bar-visible");
  let menuBarVisible = false;
  const readMenuBarVisible = () => {
    try {
      return fs.readFileSync(menuBarVisibleFile(), "utf8").trim() === "1";
    } catch {
      return false;
    }
  };
  const setMenuBarVisible = (visible) => {
    menuBarVisible = visible;
    fs.writeFileSync(menuBarVisibleFile(), visible ? "1" : "0");
    for (const win of BrowserWindow.getAllWindows()) {
      win.setAutoHideMenuBar(!visible);
      win.setMenuBarVisibility(visible);
    }
    buildMenu(resolveLocale());
  };

  const buildMenu = (locale) => {
    const text = MENU_TEXT[locale] || MENU_TEXT.en;
    const template = [
      {
        // Replaces the default File menu: language switch, menu bar toggle + quit.
        label: PRODUCT_NAME,
        submenu: [
          {
            label: text.language,
            submenu: KNOWN_LOCALES.map((code) => ({
              label: LANGUAGE_NAMES[code],
              type: "radio",
              checked: locale === code,
              click: () => setLocale(code),
            })),
          },
          { type: "separator" },
          {
            label: text.showMenuBar,
            type: "checkbox",
            checked: menuBarVisible,
            click: (item) => setMenuBarVisible(item.checked),
          },
          { type: "separator" },
          { label: text.quit, role: "quit" },
        ],
      },
      {
        label: text.edit,
        submenu: [
          { label: text.undo, role: "undo", accelerator: "CmdOrCtrl+Z" },
          { label: text.redo, role: "redo", accelerator: "CmdOrCtrl+Shift+Z" },
          { type: "separator" },
          { label: text.cut, role: "cut", accelerator: "CmdOrCtrl+X" },
          { label: text.copy, role: "copy", accelerator: "CmdOrCtrl+C" },
          { label: text.paste, role: "paste", accelerator: "CmdOrCtrl+V" },
          { label: text.selectAll, role: "selectAll", accelerator: "CmdOrCtrl+A" },
        ],
      },
      {
        label: text.view,
        submenu: [
          { label: text.reload, role: "reload", accelerator: "CmdOrCtrl+R" },
          { label: text.toggleDevTools, role: "toggleDevTools", accelerator: "F12" },
          { type: "separator" },
          { label: text.resetZoom, role: "resetZoom", accelerator: "CmdOrCtrl+0" },
          { label: text.zoomIn, role: "zoomIn", accelerator: "CmdOrCtrl+=" },
          { label: text.zoomOut, role: "zoomOut", accelerator: "CmdOrCtrl+-" },
          { type: "separator" },
          { label: text.toggleFullScreen, role: "togglefullscreen", accelerator: "F11" },
        ],
      },
      {
        label: text.help,
        role: "help",
        submenu: [{ label: text.about, click: () => showAbout(locale) }],
      },
    ];
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
  };

  const createMainWindow = () => {
    mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      icon: path.join(__dirname, "..", "build", "images", "icons", "android-chrome-512x512.png"),
      autoHideMenuBar: !menuBarVisible,
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
    // Wayland ignores x/y (the compositor places windows), so reposition via
    // KWin scripting after the window is registered.
    await movePlayerWindowToDisplay(display);
  };

  const closePlayerWindow = () => {
    if (playerWindow && !playerWindow.isDestroyed()) {
      playerWindow.close();
    }
    playerWindow = null;
  };

  // Wayland's compositor decides window placement — x/y in BrowserWindow are
  // ignored, so the player window can't target a chosen monitor directly.
  // KDE exposes workspace.sendClientToScreen via KWin scripting (DBus), the
  // only reliable way to move a window to an output under Wayland.
  // ponytail: KDE-only; other compositors fall back to the active screen.
  const movePlayerWindowToDisplay = async (display) => {
    if (!playerWindow || playerWindow.isDestroyed()) return;
    if (process.platform !== "linux" || !process.env.WAYLAND_DISPLAY) return;
    try {
      const outputs = await getWaylandOutputs();
      if (!outputs) return;
      const match =
        outputs.find(
          (o) => o.x === display.bounds.x && o.y === display.bounds.y
        ) ||
        outputs.find(
          (o) =>
            Math.abs(o.x - display.bounds.x) <= 2 &&
            Math.abs(o.y - display.bounds.y) <= 2
        );
      if (!match) return;
      const script = [
        "var outs = workspace.screens;",
        "var out = null;",
        "for (var i = 0; i < outs.length; i++) {",
        "  if (outs[i].name == '" + match.name + "') { out = outs[i]; break; }",
        "}",
        "if (out) {",
        "  var wins = workspace.windowList();",
        "  for (var i = 0; i < wins.length; i++) {",
        "    if (wins[i].pid == " + process.pid + " && wins[i].fullScreen) {",
        "      workspace.sendClientToScreen(wins[i], out);",
        "      break;",
        "    }",
        "  }",
        "}",
      ].join("\n");
      const { execFile } = require("child_process");
      const { promisify } = require("util");
      const run = promisify(execFile);
      const scriptPath = path.join(app.getPath("userData"), "kwin-move-player.js");
      fs.writeFileSync(scriptPath, script);
      const { stdout } = await run("qdbus6", [
        "org.kde.KWin",
        "/Scripting",
        "org.kde.kwin.Scripting.loadScript",
        scriptPath,
      ]);
      const id = stdout.trim();
      await run("qdbus6", [
        "org.kde.KWin",
        "/Scripting",
        "org.kde.kwin.Scripting.start",
      ]);
      await run("qdbus6", [
        "org.kde.KWin",
        "/Scripting",
        "org.kde.kwin.Scripting.unloadScript",
        id,
      ]);
    } catch {
      // no KWin / no qdbus: fall back to the compositor's default placement
    }
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
    ipcMain.handle("locale:get", () => resolveLocale());
    ipcMain.handle("locale:set", (_, locale) => setLocale(locale));

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
        await movePlayerWindowToDisplay(display);
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

    const locale = resolveLocale();
    menuBarVisible = readMenuBarVisible();
    buildMenu(locale);

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