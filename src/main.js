const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow;

const createWindow = () => {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Load the index.html of the app
  mainWindow.loadFile(path.join(__dirname, '../index.html'));

  // Open DevTools in development mode
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
};

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// API call handling
ipcMain.handle('call-api', async (event, { endpoint, model, prompt, params }) => {
  // In a real application, this would make an actual API call
  try {
    console.log(`Making API call to ${endpoint} with model ${model}`);
    console.log(`Prompt: ${prompt}`);
    console.log(`Params: ${JSON.stringify(params)}`);
    
    // Mock response for now
    return {
      success: true,
      result: `Generated text from ${model} based on prompt: ${prompt.substring(0, 50)}...`,
      model,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('API call failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}); 