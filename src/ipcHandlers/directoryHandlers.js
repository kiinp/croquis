const { ipcMain } = require('electron');
const fileUtils = require('../modules/fileUtils');
const { loadHistoryList } = require("../../db/history");
const { getFolderList } = require("../../db/folder");
const path = require('path');
const fs = require('fs');

/**
 * IPC handler for retrieving directory contents.
 * Uses fileUtils.getDirectoryContents with history data.
 */
ipcMain.handle('get-directory-contents', async (event, dirPath) => {
  return await fileUtils.getDirectoryContents(dirPath);
});

/**
 * IPC handler for retrieving complete directory information asynchronously.
 */
ipcMain.handle('get-all-directory-info', async (event, dirPath) => {
  try {
    const result = await fileUtils.getAllDirectoryInfo(dirPath);
    return { success: true, directoryInfo: result };
  } catch (error) {
    console.error('Error in get-all-directory-info:', error);
    return { success: false, msg: error.message };
  }
});

/**
 * Retrieve the history contents by folderId. If folderId is null, return all histories.
 */
ipcMain.handle('get-history-contents', async (event, folderId = null) => {
  try {
    let result = loadHistoryList(folderId);
    let folderList = getFolderList().map(item => {return {...item, isDirectory: true}});
    if (!result) {
      result = [];
    }
    return { success: true, data: [...result, ...folderList] };
  } catch (error) {
    console.log('Error fetching history contents:', error);
    return { success: false, msg: "Error fetching history contents." };
  }
});

ipcMain.handle('add-folder', async (event, args) => {
  const { folderName, basePath } = args;

  if (!folderName || folderName.trim() === '') {
    return { success: false, msg: 'Please enter a folder name.', data: null };
    return;
  }
  if (!fileUtils.isValidFolderName(folderName)) {
    return { success: false, msg: 'Some characters are not allowed.', data: null };
  }
  const targetBasePath = basePath || __dirname;
  const newFolderPath = path.join(targetBasePath, folderName);
  
  if (fs.existsSync(newFolderPath)) {
    return { success: false, msg: 'Same folder name exists.', data: null };
  }

  try {
    fs.mkdirSync(newFolderPath, { recursive: true });
    return { success: true, data: newFolderPath };
  } catch (error) {
    return { success: false, msg: `Error add folder: ${error.message}`, data: null };
  }
});