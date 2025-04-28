// Preload script for Electron
const { contextBridge, ipcRenderer } = require('electron');

// Expose ipcRenderer to the renderer process
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: (channel, data) => {
      return ipcRenderer.invoke(channel, data);
    },
  },
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
}); 