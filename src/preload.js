// Preload script for Electron
const { contextBridge, ipcRenderer } = require('electron');

// Clear localStorage sensitive data on first run
const clearLocalStorageSensitiveData = () => {
  if (process.env.NODE_ENV === 'production') {
    const isFirstRun = !localStorage.getItem('app-initialized');
    if (isFirstRun) {
      console.log('First production run detected. Clearing localStorage sensitive data...');
      localStorage.removeItem('promptChainSettings');
      // Mark as initialized
      localStorage.setItem('app-initialized', new Date().toISOString());
    }
  }
};

// Run the cleaning function
clearLocalStorageSensitiveData();

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