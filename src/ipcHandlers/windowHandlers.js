const { BrowserWindow, ipcMain } = require('electron');
const windowManager = require("../modules/windowManager");

ipcMain.on('close-window', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.close();
});

ipcMain.on('minimize-window', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.minimize();
});

ipcMain.on('resize-window', (event, dimensions) => {
  const { width, height } = dimensions;
  const croquisWindow = windowManager.getCroquisWindow();
  if (croquisWindow && !croquisWindow.isDestroyed()) {
    croquisWindow.setSize(Math.floor(width), Math.floor(height));
  }
});