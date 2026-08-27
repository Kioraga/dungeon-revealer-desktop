const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopApi", {
  listDisplays: () => ipcRenderer.invoke("displays:list"),
  openPlayerWindow: (displayId) =>
    ipcRenderer.invoke("player-window:open", displayId),
  setPlayerDisplay: (displayId) =>
    ipcRenderer.invoke("player-window:set-display", displayId),
  closePlayerWindow: () => ipcRenderer.invoke("player-window:close"),
});