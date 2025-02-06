const { ipcMain } = require('electron');
const { saveHistory } = require('../../db/history');
const { saveImage } = require('../../db/image');

/**
 * IPC handler for saving history data.
 */
ipcMain.handle('save-history', async (event, fieldValues, filePath) => {
  try {
    if (!filePath) {
      throw new Error("FilePath is undefined.");
    }
    const historyId = saveHistory(fieldValues, filePath);
    return { success: true, data: historyId };
  } catch (err) {
    console.error("Error saving history:", err);
    return { success: false, msg: "Error saving history." };
  }
});

/**
 * IPC handler for saving an image associated with a history entry.
 */
ipcMain.handle('save-image', async (event, historyId, imagePath) => {
  try {
    return await saveImage(historyId, imagePath);
  } catch (err) {
    console.error("Error saving image:", err);
    return { success: false, msg: "Error saving image" };
  }
});
