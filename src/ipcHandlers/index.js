const { dialog, ipcMain, app, clipboard, nativeImage} = require('electron');
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

ipcMain.handle("copy-image-to-clipboard", (event, filePath) => {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      console.error("Error reading the image file:", err);
      return;
    }
    const image = nativeImage.createFromBuffer(data); 
    if (image.isEmpty()) {
      console.error(
        "nativeImage is empty. The image might not be loaded correctly."
      );
      return;
    }
    clipboard.writeImage(image); 
  });
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

module.exports = {
    optionHandler,
    directoryHandler,
    fileHandler,
    dbHandler,
    captureHandler,
    windowHandler,
    croquisHandler
}
