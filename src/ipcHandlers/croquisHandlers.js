const { ipcMain } = require('electron');
const windowManager = require('../modules/windowManager');

/**
 * IPC handler for sending selected photos to the Croquis Option window.
 * If the Croquis Option window already exists, it brings it to the front and sends new data.
 * Otherwise, it creates a new Croquis Option window.
 */
ipcMain.on('send-selected-photos', (event, imageList) => {
    // Retrieve the current Croquis Option window reference.
    let croquisOptionWindow = windowManager.getCroquisOptionWindow();

    if (croquisOptionWindow && !croquisOptionWindow.isDestroyed()) {
        // If it exists, focus it and send new data.
        croquisOptionWindow.close();
    }

    // Otherwise, create a new Croquis Option window.
    croquisOptionWindow = windowManager.createCroquisOptionWindow();
    croquisOptionWindow.webContents.once('did-finish-load', () => {
        croquisOptionWindow.webContents.send('send-data-to-croquis-option', imageList);
    });
});

ipcMain.on('send-croquis-data-to-main', (event, data) => {
    let croquisOptionWindow = windowManager.getCroquisOptionWindow();
    croquisOptionWindow.close();
    // Retrieve the current Croquis window reference.
    let croquisWindow = windowManager.getCroquisWindow();

    if (croquisWindow && !croquisWindow.isDestroyed()) {
        // If it exists, focus it and send new data.
        croquisWindow.focus();
        croquisWindow.webContents.send('send-data-to-croquis', data);
        return;
    }

    // Otherwise, create a new Croquis window.
    croquisWindow = windowManager.createCroquisWindow();
    croquisWindow.webContents.once('did-finish-load', () => {
        croquisWindow.webContents.send('send-data-to-croquis', data);
    });
});
