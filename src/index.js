const { app, BrowserWindow, ipcMain, desktopCapturer, screen, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const fsp = require('fs').promises;
const https = require('https');

const { saveHistory, loadHistory, loadHistoryList, loadHistoryListFromFilePathList } = require('../db/history');
const { saveImage } = require('../db/image');
const { createFolder, loadFolder, listFolders } = require('../db/folder');
const Option = require("../db/option");
const { db, init_db } = require("../db/init.js");

//#region Option
let option;

ipcMain.handle("get-option", async () => {
  return option.option;
});

ipcMain.handle("set-option", async (event, newOption) => {
  option.setOption(newOption);
});
//#endregion

//#region Main Window

/**
 * Create the main application window.
 */
function createMainWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false, // Security recommendation
      contextIsolation: true,  // Security recommendation
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'MainWindow', 'index.html'));
}

// Quit app when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Re-create window when app icon is clicked (macOS)
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

// Initialize app when ready
app.whenReady().then(() => {
  init_db();
  createMainWindow();
  if (!option) {
    option = new Option();
  }
});

/**
 * Normalize a file path.
 * @param {string} originPath - The original file path.
 * @returns {string} The normalized and resolved path.
 */
function normalizePath(originPath) {
  return path.resolve(path.normalize(originPath));
}

/**
 * Check if the file has an image extension.
 * @param {string} fileName - Name of the file.
 * @returns {boolean} True if the file is an image.
 */
function checkIsImage(fileName) {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.bmp', '.webp'];
  const ext = path.extname(fileName).toLowerCase();
  return imageExtensions.includes(ext);
}

/**
 * Get the list of files and directories from a given directory.
 */
ipcMain.handle('get-directory-contents', async (event, dirPath) => {
  try {
    const absolutePath = normalizePath(dirPath);

    const dirents = await fsp.readdir(absolutePath, { withFileTypes: true });

    // Create a list of image file paths
    const filePathList = dirents
      .filter(dirent => checkIsImage(dirent.name))
      .map(dirent => path.join(absolutePath, dirent.name));

    let historiesMap = {};
    if (filePathList.length > 0) {
      const histories = loadHistoryListFromFilePathList(filePathList);

      historiesMap = histories.reduce((acc, history) => {
        if (!acc[history.filePath]) acc[history.filePath] = [];
        acc[history.filePath].push(history);
        return acc;
      }, {});
    }

    const items = dirents
      .filter(dirent => dirent.isDirectory() || checkIsImage(dirent.name))
      .map(dirent => {
        const filePath = path.join(absolutePath, dirent.name);
        return {
          fileName: dirent.name,
          filePath,
          isDirectory: dirent.isDirectory(),
          histories: dirent.isDirectory() ? [] : (historiesMap[filePath] || [])
        };
      });

    return { success: true, data: items };
  } catch (error) {
    console.error('Error in get-directory-contents:', error);
    return { success: false, msg: 'Check the main directory path.' };
  }
});

/**
 * Retrieve the history contents by folderId. If folderId is null, return all histories.
 */
ipcMain.handle('get-history-contents', async (event, folderId = null) => {
  try {
    let result = loadHistoryList(folderId);
    if (!result) {
      result = [];
    }
    return { success: true, data: result };
  } catch (error) {
    console.error('Error fetching history contents:', error);
    return { success: false, msg: "Error fetching history contents." };
  }
});

/**
 * Recursively get directory tree information starting from a root directory.
 */
ipcMain.handle('get-all-directory-info', async (event, dirPath) => {
  try {
    const getDirectoryInfo = (absolutePath) => {
      const items = fs.readdirSync(absolutePath, { withFileTypes: true });
      const directoryInfo = items.map((dirent) => {
        const itemPath = path.join(absolutePath, dirent.name);
        if (dirent.isDirectory()) {
          const subDirInfo = getDirectoryInfo(itemPath);
          return {
            dirname: dirent.name,
            dirpath: itemPath,
            fileCount: subDirInfo.totalFiles,
            subDirectories: subDirInfo.subDirectories,
          };
        }
        return null;
      }).filter(Boolean);

      // Count files in the current directory
      const fileCount = items.filter((dirent) => {
        const itemPath = path.join(absolutePath, dirent.name);
        return dirent.isFile() && fs.statSync(itemPath).isFile();
      }).length;

      // Total file count including subdirectories
      const totalFiles = fileCount + directoryInfo.reduce((acc, dir) => acc + dir.fileCount, 0);

      return {
        totalFiles,
        dirname: path.basename(absolutePath),
        dirpath: absolutePath,
        fileCount: totalFiles,
        subDirectories: directoryInfo,
      };
    };

    const absolutePath = normalizePath(dirPath);
    const result = getDirectoryInfo(absolutePath);
    return { success: true, directoryInfo: result };
  } catch (error) {
    console.error('Error in get-all-directory-info:', error);
    return { success: false, msg: error.message };
  }
});

//#endregion

//#region Croquis Window
let croquisWindow;

ipcMain.on('send-selected-photos', (event, data) => {
  // If a croquis window already exists, bring it to the front and send new data.
  if (croquisWindow && !croquisWindow.isDestroyed()) {
    croquisWindow.focus();
    croquisWindow.webContents.send('send-data-to-croquis', data);
    return;
  }

  // Create a new Croquis window.
  croquisWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    alwaysOnTop: true,
    frame: false,
    transparent: true
  });

  croquisWindow.loadFile(path.join(__dirname, 'CroquisWindow', 'index.html'));

  croquisWindow.webContents.once('did-finish-load', () => {
    croquisWindow.webContents.send('send-data-to-croquis', data);
  });
});

ipcMain.on('close-window', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.close();
});

ipcMain.on('minimize-window', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.minimize();
});

ipcMain.on('resize-window', (event, dimensions) => {
  const { width, height } = dimensions;
  if (croquisWindow && !croquisWindow.isDestroyed()) {
    croquisWindow.setSize(Math.floor(width), Math.floor(height));
  }
});
//#endregion

//#region Overlay Window
let overlayWindow;

/**
 * Create an overlay window for selection.
 */
function createOverlayWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  overlayWindow = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    fullscreenable: true,
  });
  overlayWindow.setIgnoreMouseEvents(false);
  overlayWindow.loadURL(path.join(__dirname, 'OverlayWindow', 'index.html'));

  overlayWindow.on('blur', () => {
    if (overlayWindow && overlayWindow.isVisible()) {
      overlayWindow.hide();
      if (croquisWindow && !croquisWindow.isDestroyed()) {
        croquisWindow.webContents.send('end-selection');
      }
    }
  });
}

ipcMain.on('start-selection', (event, windowId) => {
  if (!overlayWindow || overlayWindow.isDestroyed()) {
    createOverlayWindow();
  }
  overlayWindow.show();
  overlayWindow.focus();
  overlayWindow.webContents.send('start-selection', windowId);
});

ipcMain.on('selected-rect', async (event, { rect, saveId }) => {
  if (overlayWindow && overlayWindow.isVisible()) {
    overlayWindow.hide();
    if (croquisWindow && !croquisWindow.isDestroyed()) {
      croquisWindow.webContents.send('end-selection');
    }
  }
  try {
    const sources = await desktopCapturer.getSources({
      thumbnailSize: screen.getPrimaryDisplay().size,
      types: ['screen']
    });
    const entireScreen = sources[0].thumbnail;
    const image = nativeImage.createFromBuffer(entireScreen.toPNG());
    const cropped = image.crop({
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height
    });
    const buffer = cropped.toPNG();

    // Save the captured image using a filename based on windowId
    const saveDir = option.option.savePath;
    const savePath = path.join(saveDir, `capture_${saveId}.png`);

    fs.writeFile(savePath, buffer, (err) => {
      if (err) {
        console.error('Error saving captured image:', err);
        event.sender.send('capture-completed', { success: false, data:savePath });
      } else {
        console.log(`Image saved to ${savePath}`);
        if (croquisWindow && !croquisWindow.isDestroyed()) {
          croquisWindow.webContents.send('capture-completed', { success: true, data:savePath });
        }
      }
    });
  } catch (error) {
    console.error('Error during screen capture:', error);
    event.sender.send('capture-completed', { success: false, msg: error.message });
  }
});
//#endregion

//#region File Handling
/**
 * Check if the given file path is unique. If not, modify the file name to ensure uniqueness.
 * @param {string} targetPath - The desired file path.
 * @returns {Promise<string>} A unique file path.
 */
async function getUniqueFilePath(targetPath) {
  const ext = path.extname(targetPath);
  const basename = path.basename(targetPath, ext);
  const dirname = path.dirname(targetPath);
  let count = 1;
  let newPath = targetPath;
  while (true) {
    try {
      await fs.promises.access(newPath);
      // File exists, create a new file name with an appended number.
      const newName = `${basename}(${count})${ext}`;
      newPath = path.join(dirname, newName);
      count++;
    } catch (err) {
      // File does not exist, so newPath is unique.
      return newPath;
    }
  }
}

ipcMain.on('handle-file-drop', async (event, fileData) => {
  const { type, data, targetPath } = fileData;
  try {
    if (type === 'url') {
      // Handle downloading an image from the internet.
      await downloadFile(data, targetPath);
      event.reply('file-drop-result', { success: true, msg: "Download successful" });
    } else if (type === 'local') {
      // Handle copying a local file.
      const stat = await fsp.stat(data);

      if (stat.isDirectory()) {
        event.reply('file-drop-result', { success: false, msg: "Folders are not allowed" });
        return;
      }

      const sourceDir = path.normalize(path.dirname(data));
      const destDir = path.normalize(targetPath);

      if (sourceDir === destDir) {
        event.reply('file-drop-result', { success: false, msg: "File is already in the target folder" });
        return;
      }

      let fullPath = path.join(targetPath, path.basename(data));
      fullPath = await getUniqueFilePath(fullPath);

      fs.copyFile(data, fullPath, (err) => {
        if (err) {
          console.error('Error copying file:', err);
          event.reply('file-drop-result', { success: false, msg: 'Error copying file.' });
        } else {
          console.log('File copied to:', fullPath);
          event.reply('file-drop-result', { success: true, msg: 'Copy successful' });
        }
      });
    }
  } catch (error) {
    console.error('Error in file drop handler:', error);
    event.reply('file-drop-result', { success: false, msg: "Error handling file drop" });
  }

});

/**
 * Save a base64 encoded file.
 * @param {string} dataUrl - The data URL of the file.
 * @param {string} savePath - The directory where the file should be saved.
 * @returns {Promise<string>} The full path to the saved file.
 */
async function saveBase64File(dataUrl, savePath) {
  const matches = dataUrl.match(/^data:(.+);base64,(.*)$/);
  if (!matches) {
    throw new Error('Invalid data URL format');
  }

  const mimeType = matches[1];
  const base64Data = matches[2];
  const fileExtension = mimeType.split('/')[1] || 'bin';
  const fileName = `downloaded_file.${fileExtension}`;
  let fullPath = path.join(savePath, fileName);
  fullPath = await getUniqueFilePath(fullPath);

  return new Promise((resolve, reject) => {
    fs.writeFile(fullPath, Buffer.from(base64Data, 'base64'), (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(fullPath);
      }
    });
  });
}

/**
 * Download a file from the internet.
 * @param {string} url - The URL of the image.
 * @param {string} savePath - The directory where the file should be saved.
 * @returns {Promise<string>} The full path to the saved file.
 */
async function downloadFile(url, savePath) {
  if (url.startsWith('data:')) {
    return saveBase64File(url, savePath);
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    throw new Error('Unsupported URL protocol: ' + url);
  }

  const fileName = path.basename(new URL(url).pathname);
  let fullPath = path.join(savePath, fileName);
  fullPath = await getUniqueFilePath(fullPath);
  const ext = path.extname(fileName);
  if (!ext) {
    throw new Error('No file extension found in URL: ' + url);
  }

  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        fs.unlink(fullPath, () => { }); // Delete incomplete file
        reject(new Error('HTTP Error: ' + response.statusCode));
        return;
      }
      const fileStream = fs.createWriteStream(fullPath);
      response.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve(fullPath);
      });
      fileStream.on('error', (err) => {
        fs.unlink(fullPath, () => { }); // Delete file on error
        reject(err);
      });
    }).on('error', (err) => {
      console.error("Download error:", err);
      reject(err);
    });
  });
}

//#endregion

//#region Database Operations
ipcMain.handle('save-history', async (event, fieldValues, filePath) => {
  try {
    const historyId = saveHistory(fieldValues, filePath);
    return { success: true, data: historyId };
  } catch (err) {
    console.error("Error save history.", err);
    return { success: false, msg: "Error save history" };
  }
});

ipcMain.handle('save-image', async (event, historyId, imagePath) => {
  console.log(imagePath)
  return saveImage(historyId, imagePath);
});

ipcMain.handle('create-folder', async (event, folderName, historyIds, fileIds) => {
  return createFolder(folderName, historyIds, fileIds);
});

ipcMain.handle('load-history', async (event, historyId, includeRelated) => {
  return loadHistory(historyId, includeRelated);
});

ipcMain.handle('load-folder', async (event, folderId) => {
  return loadFolder(folderId);
});

ipcMain.handle('list-folders', async () => {
  return listFolders();
});
//#endregion
