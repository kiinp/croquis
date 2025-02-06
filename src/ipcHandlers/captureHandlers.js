const { ipcMain, desktopCapturer, screen, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const fsp = require('fs').promises;
const windowManager = require('../modules/windowManager');
const option = require('./optionHandlers');


/**
 * IPC handler to start a selection process.
 * Ensures the overlay window exists, shows it, and sends the start-selection command.
 */
ipcMain.on('start-selection', (event, {windowId, savePath}) => {
    console.log(windowId, savePath)
    let overlayWin = windowManager.getOverlayWindow();
    if(!savePath) {
        savePath = option.getOption().croquis.savePath;
    }

    // If overlay window does not exist or has been destroyed, create a new one.
    if (!overlayWin || overlayWin.isDestroyed()) {
        overlayWin = windowManager.createOverlayWindow();
    }

    overlayWin.show();
    overlayWin.focus();
    overlayWin.webContents.send('start-selection', {windowId, savePath});
});

/**
 * IPC handler for processing the selected rectangle after screen capture.
 * Hides the overlay window (if visible), captures and crops the screen image,
 * saves the captured image, and notifies the Croquis window of completion.
 */
ipcMain.on('selected-rect', async (event, { rect, saveId, savePath}) => {
    console.log(rect);
    // Hide the overlay window if it is visible and signal end of selection.
    const overlayWin = windowManager.getOverlayWindow();
    if (overlayWin && overlayWin.isVisible()) {
        overlayWin.hide();
        const croquisWindow = windowManager.getCroquisWindow();
        if (croquisWindow && !croquisWindow.isDestroyed()) {
            croquisWindow.webContents.send('end-selection');
        }
    }

    try {
        // Capture the entire screen.
        const sources = await desktopCapturer.getSources({
            thumbnailSize: screen.getPrimaryDisplay().size,
            types: ['screen']
        });
        const entireScreen = sources[0].thumbnail;

        // Create an image object and crop it based on the provided rectangle.
        const image = nativeImage.createFromBuffer(entireScreen.toPNG());
        const cropped = image.crop({
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height
        });
        const buffer = cropped.toPNG();

        // Save the captured image to the configured save directory.
        const saveDir = savePath || option.getOption().croquis.savePath; // Option object should be initialized beforehand.
        const fullPath = path.join(saveDir, `capture_${saveId}.png`);
        await fsp.writeFile(fullPath, buffer);
        console.log(`Image saved to ${fullPath}`);

        // Notify the Croquis window that capture is complete.
        const croquisWindow = windowManager.getCroquisWindow();
        if (croquisWindow && !croquisWindow.isDestroyed()) {
            croquisWindow.webContents.send('capture-completed', { success: true, data: fullPath });
        }
    } catch (error) {
        console.error('Error during screen capture:', error);
        event.sender.send('capture-completed', { success: false, msg: error.message });
    }
});