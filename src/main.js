const { app, BrowserWindow, Menu, dialog } = require('electron');
const windowManager = require('./modules/windowManager');
const fs = require("fs").promises;
const { autoUpdater } = require('electron-updater');
const { init_db } = require('../db/init');
const ipcHandlers = require("./ipcHandlers/index");

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    windowManager.createMainWindow();
  }
});

/**
 * Check whether the saved option's savePath is accessible.
 * @returns {Promise<boolean>}
 */
async function checkRootDirectoryPath() {
  const rootDirectory = ipcHandlers.optionHandler.getOption().rootDirectory;
  if (!rootDirectory) {
    return false;
  }
  try {
    await fs.access(rootDirectory);
    return true;
  } catch (err) {
    return false;
  }
}

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);

  init_db();
  windowManager.createMainWindow();
  ipcHandlers.optionHandler.initOption();
  const validRootDirectory = await checkRootDirectoryPath();
  if (!validRootDirectory) {
    let optionWindow = windowManager.getOptionWindow();

    if (optionWindow && !optionWindow.isDestroyed()) {
      optionWindow.focus();
      return;
    }
    optionWindow = windowManager.createOptionWindow();
  }
  autoUpdater.checkForUpdates();
});

autoUpdater.on('update-available', (info) => {
  const result = dialog.showMessageBoxSync({
    type: 'info',
    title: '업데이트 확인',
    message: '새로운 업데이트가 있습니다. 업데이트를 진행하시겠습니까?',
    buttons: ['확인', '취소']  // 0: 확인, 1: 취소
  });

  if (result === 0) { // If confirmed, start downloading the update
    autoUpdater.downloadUpdate();
  }
});

autoUpdater.on('update-downloaded', (info) => {
  // After the update is downloaded, ask the user to restart the app to apply updates
  const result = dialog.showMessageBoxSync({
    type: 'info',
    title: '업데이트 완료',
    message: '업데이트가 완료되었습니다. 앱을 재시작하여 업데이트를 적용하시겠습니까?',
    buttons: ['재시작', '나중에']  // 0: 재시작, 1: 나중에
  });

  if (result === 0) { // If restart is confirmed, quit and install the update
    autoUpdater.quitAndInstall();
  }
});
