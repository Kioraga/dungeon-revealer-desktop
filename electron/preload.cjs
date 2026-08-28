const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopApi", {
  listDisplays: () => ipcRenderer.invoke("displays:list"),
  openPlayerWindow: (displayId) =>
    ipcRenderer.invoke("player-window:open", displayId),
  setPlayerDisplay: (displayId) =>
    ipcRenderer.invoke("player-window:set-display", displayId),
  closePlayerWindow: () => ipcRenderer.invoke("player-window:close"),
  getLocale: () => ipcRenderer.invoke("locale:get"),
  setLocale: (locale) => ipcRenderer.invoke("locale:set", locale),
  onLocaleChanged: (callback) => {
    const listener = (_ev, locale) => callback(locale);
    ipcRenderer.on("locale-changed", listener);
    return () => ipcRenderer.removeListener("locale-changed", listener);
  },
});