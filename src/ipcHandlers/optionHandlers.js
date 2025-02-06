const { ipcMain, dialog, BrowserView, BrowserWindow } = require('electron');
const Option = require('../../db/option');
const windowManager = require('../modules/windowManager');

let option = null;

/**
 * Initialize the option object.
 */
function initOption() {
  if (!option) {
    option = new Option();
  }
}

/**
 * 
 * @returns {import('../type').GlobalOption}
 */
function getOption() {
  return option ? option.option : {};
}

ipcMain.on('open-option-window', async () => {
  const optionWindow = windowManager.getOptionWindow();
  if (optionWindow && !optionWindow.isDestroyed()) {
    optionWindow.show();
    optionWindow.focus();
    return;
  }
  windowManager.createOptionWindow();
});

// IPC handler for getting options
ipcMain.handle("get-option", async () => {
  return getOption();
});

// IPC handler for setting options
ipcMain.handle("set-option", async (event, newOption) => {
  if (option) {
    newOption = {...getOption(), ...newOption};
    option.setOption(newOption);
  } else {
    return {success: false, msg: "Option is not initialized"};
  }
  BrowserWindow.getAllWindows().forEach((win) => {
    win.webContents.send("option-changed", newOption);
  });
  return {success: true, data:newOption};
});

// IPC handler to open a folder dialog.
ipcMain.handle('open-folder-dialog', async (event) => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  if (result.canceled) {
    return null;
  } else {
    return result.filePaths[0];
  }
});


module.exports = {
  initOption,
  getOption
};