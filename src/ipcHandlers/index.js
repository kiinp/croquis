const { dialog, ipcMain, app, clipboard, nativeImage } = require('electron');
const { autoUpdater } = require('electron-updater');
const fs = require("fs");
const dns = require('dns');
const sharp = require('sharp');

const optionHandler = require('./optionHandlers');
const directoryHandler = require('./directoryHandlers');
const fileHandler = require('./fileDropHandlers');
const dbHandler = require('./dbHandlers');
const captureHandler = require('./captureHandlers');
const windowHandler = require('./windowHandlers');
const croquisHandler = require('./croquisHandlers');
const windowManager = require('../modules/windowManager');
const fileUtils = require('../modules/fileUtils');



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


ipcMain.on('export-images', (event, selectedList)=>{
  let exportWin = windowManager.getExportWindow();
  if(!selectedList || selectedList.length == 0) {
    return;
  }
  if (exportWin && !exportWin.isDestroyed()) {
    exportWin.close();
  } 
  exportWin = windowManager.createExportWindow();
  exportWin.show();
  exportWin.focus();

  exportWin.webContents.on('did-finish-load', () => {
    exportWin.webContents.send("export-images", selectedList);
  });
})


/**
 * Merges images based on layoutData and saves the result to outFilePath.
 * @async
 * @function
 * @name merge-images
 * @param {Electron.IpcMainInvokeEvent} event - The IPC event object.
 * @param {Object} layoutData - The layout data for merging images.
 * @param {number} layoutData.outerWidth - The total width of the final merged image.
 * @param {number} layoutData.outerHeight - The total height of the final merged image.
 * @param {Array} layoutData.boxList - The array of image boxes to be merged.
 * @param {string} layoutData.boxList[].name - The absolute path of the source image.
 * @param {number} layoutData.boxList[].width - The resize width of the source image.
 * @param {number} layoutData.boxList[].height - The resize height of the source image.
 * @param {Object} layoutData.boxList[].startPos - The top-left coordinates for placing the image.
 * @param {number} layoutData.boxList[].startPos.x - The x-coordinate.
 * @param {number} layoutData.boxList[].startPos.y - The y-coordinate.
 * @param {string} outFilePath - The file path where the merged image will be saved.
 * @returns {Promise<{ success: boolean, file: string }>} An object with success status and file path.
 */
ipcMain.handle('merge-images', async (event, layoutData, outFilePath) => {
  // Parse layout data from JSON
  layoutData = JSON.parse(layoutData);

  try {
    // Prepare an array to hold each image (after resize) and its placement
    const compositeArray = [];

    // Loop through the boxList to resize and prepare each image
    for (const box of layoutData.boxList) {
      // Read and resize the image, then convert it to buffer\
      const resizedBuffer = await sharp(box.name)
        .resize({
          width: box.width,
          height: box.height,
          fit: 'inside', 
        })
        .toBuffer();

      // Add the processed image and its placement info to compositeArray
      compositeArray.push({
        input: resizedBuffer,
        top: box.startPos.y,
        left: box.startPos.x
      });
    }
    console.log(outFilePath)
    // Create a new blank image with the specified width, height, and background
    let name = outFilePath+"\\merged_"+Date.now()+".png";
    console.log(name)
    name = await fileUtils.getUniqueFilePath(name);
    console.log(name)
    await sharp({
      create: {
        width: layoutData.outerWidth,
        height: layoutData.outerHeight,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 } // white background
      }
    })
      // Composite (merge) all images onto the blank image
      .composite(compositeArray)
      // Save the result to the specified path
      .toFile(name);

    // Return success with output path
    return { success: true, data: outFilePath };
  } catch (err) {
    console.error('Error merging images:', err);
    throw err; // You can also return an error object if preferred
  }
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
