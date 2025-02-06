const { ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const fileUtils = require('../modules/fileUtils');

const downloadFileUtils = require('../modules/downloadFileUtils');

/**
 * IPC handler for processing file drop events.
 * If type is 'url', it downloads the file using the download module.
 * If type is 'local', it copies the file to the target directory.
 */
ipcMain.on('handle-file-drop', async (event, fileData) => {
    const { type, data, targetPath } = fileData;
    try {
        if (type === 'url') {
            // Download the file using the download module
            await downloadFileUtils.downloadFile(data, targetPath);
            event.reply('file-drop-result', { success: true, msg: "Download successful" });
        } else if (type === 'local') {
            const stat = await fs.stat(data);
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

            //copy file
            const fullPath = await fileUtils.copyFileToTarget(data, targetPath);
            console.log('File copied to:', fullPath);
            event.reply('file-drop-result', { success: true, msg: 'Copy successful' });
        }
    } catch (error) {
        console.error('Error in file drop handler:', error);
        event.reply('file-drop-result', { success: false, msg: "Error handling file drop" });
    }
});
