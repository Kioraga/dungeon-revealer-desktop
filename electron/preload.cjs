const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopApi", {
  listDisplays: () => ipcRenderer.invoke("displays:list"),
  openPlayerWindow: (displayId) =>
    ipcRenderer.invoke("player-window:open", displayId),
  closePlayerWindow: () => ipcRenderer.invoke("player-window:close"),
});