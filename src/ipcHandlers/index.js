const { dialog, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const dns = require('dns');

const optionHandler = require('./optionHandlers');
const directoryHandler = require('./directoryHandlers');
const fileHandler = require('./fileDropHandlers');
const dbHandler = require('./dbHandlers');
const captureHandler = require('./captureHandlers');
const windowHandler = require('./windowHandlers');
const croquisHandler = require('./croquisHandlers');


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

module.exports = {
    optionHandler,
    directoryHandler,
    fileHandler,
    dbHandler,
    captureHandler,
    windowHandler,
    croquisHandler
}