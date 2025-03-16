const { dialog, ipcMain, app, clipboard, nativeImage } = require('electron');
const { autoUpdater } = require('electron-updater');
const fs = require("fs");
const dns = require('dns');

const optionHandler = require('./optionHandlers');
const directoryHandler = require('./directoryHandlers');
const fileHandler = require('./fileDropHandlers');
const dbHandler = require('./dbHandlers');
const captureHandler = require('./captureHandlers');
const windowHandler = require('./windowHandlers');
const croquisHandler = require('./croquisHandlers');
const windowManager = require('../modules/windowManager');




ipcMain.handle("copy-image-to-clipboard", async (event, filePath, option) => {
  try {
    const data = await fs.promises.readFile(filePath);
    let image = nativeImage.createFromBuffer(data);

    if (image.isEmpty()) {
      console.error("nativeImage is empty. The image might not be loaded correctly.");
      return;
    }
    if(option.grayOption){
      clipboard.writeImage(image);
    }
    
    
    const bitmap = image.toBitmap();
    const width = image.getSize().width;
    const height = image.getSize().height;

    for (let i = 0; i < bitmap.length; i += 4) {
      const r = bitmap[i];
      const g = bitmap[i + 1];
      const b = bitmap[i + 2];

      const gray = 0.2126*r+0.7152*g+0.0722*b;
      bitmap[i] = gray; // R
      bitmap[i + 1] = gray; // G
      bitmap[i + 2] = gray; // B
    }
    const grayImage = nativeImage.createFromBitmap(bitmap, { width, height });

    clipboard.writeImage(grayImage);

  } catch (err) {
    console.error("error:", err);
  }
});


function checkInternet(callback) {
  dns.lookup('google.com', (err) => {
    callback(!err); // true if connected, false otherwise
  });
}


ipcMain.on('check-for-updates', (event, arg) => {
  checkInternet((isConnected) => {
    if (isConnected) {
      autoUpdater.checkForUpdates();
    } else {
      dialog.showMessageBox({
        type: 'error',
        title: '네트워크 오류',
        message: '네트워크에 연결되어 있지 않아 업데이트를 확인할 수 없습니다.'
      });
    }
  });
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.on('move-folder', (event, selectedList)=>{
  let folderWin = windowManager.getFolderWindow();
  if(!selectedList || selectedList.length == 0) {
    return;
  }
  if (folderWin && !folderWin.isDestroyed()) {
    folderWin.close();
  } 
  folderWin = windowManager.createFolderWindow();
  folderWin.show();
  folderWin.focus();

  folderWin.webContents.send("move-folder", selectedList);
})


module.exports = {
  optionHandler,
  directoryHandler,
  fileHandler,
  dbHandler,
  captureHandler,
  windowHandler,
  croquisHandler
}
