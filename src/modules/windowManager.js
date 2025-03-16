// modules/windowManager.js
const { BrowserWindow, screen } = require('electron');
const path = require('path');

let croquisWindow = null;
let overlayWindow = null;
let croquisOptionWindow = null;
let folderWindow = null;
let optionWindow = null;
let mainWindow = null;
let exportWindow = null;
/**
 * Create the main application window.
 * @returns {BrowserWindow}
 */
function createMainWindow() {
  const {scaleFactor} = screen.getPrimaryDisplay(); 
  mainWindow = new BrowserWindow({
    width: Math.round(600 * scaleFactor),
    height: Math.round(400 * scaleFactor),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "..", 'preload.js'),
    },
    icon: path.join(__dirname, "..", "..", 'assets/icons/C_icon.png')
  });
  mainWindow.loadFile(path.join(__dirname, "..", "window", 'MainWindow', 'index.html'));
  // mainWindow.webContents.openDevTools();
  return mainWindow;
}

/**
 * Create or focus the Croquis window.
 * @returns {BrowserWindow}
 */
function createCroquisWindow() {
  if (croquisWindow && !croquisWindow.isDestroyed()) {
    croquisWindow.focus();
    return croquisWindow;
  }

  const {scaleFactor} = screen.getPrimaryDisplay();
  croquisWindow = new BrowserWindow({
    width: Math.round(400 * scaleFactor),
    height: Math.round(300 * scaleFactor),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "..", 'preload.js'),
    },
    alwaysOnTop: true,
    frame: false,
    transparent: true,
    icon: path.join(__dirname, "..", "..", 'assets/icons/C_icon.png')
  });
  croquisWindow.loadFile(path.join(__dirname, "..", "window", 'CroquisWindow', 'index.html'));
  // croquisWindow.webContents.openDevTools();
  return croquisWindow;
}
/**
 * Create the overlay window for selection.
 * @returns {BrowserWindow}
 */
function createOverlayWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  overlayWindow = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "..", 'preload.js'),
    },
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    fullscreenable: true,
    icon: path.join(__dirname, "..", "..", 'assets/icons/C_icon.png')
  });
  overlayWindow.setIgnoreMouseEvents(false);
  overlayWindow.loadURL(path.join(__dirname, "..", "window", 'OverlayWindow', 'index.html'));

  overlayWindow.on('blur', () => {
    if (overlayWindow && overlayWindow.isVisible()) {
      overlayWindow.hide();
      const croquisWin = createCroquisWindow();
      if (croquisWin && !croquisWin.isDestroyed()) {
        croquisWin.webContents.send('end-selection');
      }
    }
  });
  return overlayWindow;
}
/**
 * 
 * @returns {BrowserWindow}
 */
function createCroquisOptionWindow() {
  const {scaleFactor} = screen.getPrimaryDisplay();

  console.log(scaleFactor)
  croquisOptionWindow = new BrowserWindow({
    width: Math.round(200 * scaleFactor),
    height: Math.round(250 * scaleFactor),
    center: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "..", 'preload.js'),
    },
    icon: path.join(__dirname, "..", "..", 'assets/icons/C_icon.png')
  });
  croquisOptionWindow.setIgnoreMouseEvents(false);
  // croquisOptionWindow.webContents.openDevTools();
  croquisOptionWindow.loadURL(path.join(__dirname, "..", "window", 'CroquisOptionWindow', 'index.html'));
  return croquisOptionWindow;
}

/**
 * 
 * @returns {BrowserWindow}
 */
function createFolderWindow() {
  const {scaleFactor} = screen.getPrimaryDisplay();

  folderWindow = new BrowserWindow({
    width: Math.round(200 * scaleFactor),
    height: Math.round(250 * scaleFactor),
    center: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "..", 'preload.js'),
    },
    icon: path.join(__dirname, "..", "..", 'assets/icons/C_icon.png')
  });
  folderWindow.loadURL(path.join(__dirname, "..", "window", 'FolderWindow', 'index.html'));
  // folderWindow.webContents.openDevTools();
  return folderWindow;
}
/**
 * 
 * @returns {BrowserWindow}
 */
function createOptionWindow() {
  optionWindow = new BrowserWindow({
    width: 600,
    height: 800,
    center: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "..", 'preload.js')
    },
    icon: path.join(__dirname, '..', '..', 'assets/icons/C_icon.png')
  });
  optionWindow.loadFile(path.join(__dirname, "..", "window", "OptionWindow", 'index.html'));
  // optionWindow.webContents.openDevTools();
  return optionWindow;
}


/**
 * 
 * @returns {BrowserWindow}
 */
function createExportWindow() {
  const {scaleFactor} = screen.getPrimaryDisplay();

  exportWindow = new BrowserWindow({
    width: Math.round(450 * scaleFactor),
    height: Math.round(400 * scaleFactor),
    center: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "..", 'preload.js')
    },
    icon: path.join(__dirname, '..', '..', 'assets/icons/C_icon.png')
  });
  exportWindow.loadFile(path.join(__dirname, "..", "window", "ExportWindow", 'index.html'));
  // optionWindow.webContents.openDevTools();
  return exportWindow;
}

/**
 * 
 * @returns {BrowserWindow}
 */
function getCroquisWindow() {
  return croquisWindow;
}

/**
 * 
 * @returns {BrowserWindow}
 */
function getOverlayWindow() {
  return overlayWindow;
}
/**
 * 
 * @returns {BrowserWindow}
 */
function getCroquisOptionWindow() {
  return croquisOptionWindow;
}
/**
 * 
 * @returns {BrowserWindow}
 */
function getOptionWindow() {
  return optionWindow;
}
/**
 * 
 * @returns {BrowserWindow}
 */
function getMainWindow() {
  return mainWindow;
}

/**
 * 
 * @returns {BrowserWindow}
 */
function getFolderWindow() {
  return folderWindow;
}

/**
 * 
 * @returns {BrowserWindow}
 */
function getExportWindow() {
  return exportWindow;
}

module.exports = {
  createMainWindow,
  createCroquisWindow,
  createOverlayWindow,
  createCroquisOptionWindow,
  createOptionWindow,
  createFolderWindow,
  createExportWindow,
  getCroquisWindow,
  getOverlayWindow,
  getCroquisOptionWindow,
  getOptionWindow,
  getMainWindow,
  getFolderWindow,
  getExportWindow
};
