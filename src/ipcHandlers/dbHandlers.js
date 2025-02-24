const { ipcMain } = require('electron');
const fileUtils = require('../modules/fileUtils');
const { saveHistory } = require('../../db/history');
const { saveImage } = require('../../db/image');
const { getFolderList, createFolder, moveFolder } = require('../../db/folder');

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

ipcMain.handle('get-folder-list', async (event) => {
  try {
    const folderList = await getFolderList();
    return {success: true, data: folderList};
  } catch (err) {
    console.error("Error load folder list", err);
    return {success: false, msg: "error"}
  }
});

ipcMain.handle('create-history-folder', async (event, folderName) => {
  if (!folderName || folderName.trim() === '') {
    return { success: false, msg: 'Please enter a folder name.', data: null };
  }
  if (!fileUtils.isValidFolderName(folderName)) {
    return { success: false, msg: 'Some characters are not allowed.', data: null };
  }
  try {
    const folderId = await createFolder(folderName);
    return {success: true, data: folderId};
  } catch (err) {
    console.error("Error create history folder", err);
    return {success: false, msg: "error"}
  }
})

ipcMain.handle('move-folder', async (event, data)=>{
  const {folderId, selectedList} = data;

  try {
    moveFolder(folderId, selectedList);
    return {success: true};
  } catch (err) {
    console.error("Error move history folder", err);
    return {success: false, msg: "error"};
  }
})