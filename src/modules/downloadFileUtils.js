// modules/downloadFileUtils.js
const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const https = require('https');
const fileUtils = require('./fileUtils');

/**
 * Save a base64 encoded file.
 * @param {string} dataUrl - The base64 data URL.
 * @param {string} savePath - The directory where the file should be saved.
 * @returns {Promise<string>} - The full path to the saved file.
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
  fullPath = await fileUtils.getUniqueFilePath(fullPath);
  await fsp.writeFile(fullPath, Buffer.from(base64Data, 'base64'));
  return fullPath;
}

/**
 * Download a file from the internet using HTTPS.
 * @param {string} url - The URL of the file.
 * @param {string} savePath - The directory where the file should be saved.
 * @returns {Promise<string>} - The full path to the downloaded file.
 */
async function downloadFile(url, savePath) {
  if (url.startsWith('data:')) {
    return await saveBase64File(url, savePath);
  }
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    throw new Error('Unsupported URL protocol: ' + url);
  }
  const fileName = path.basename(new URL(url).pathname);
  let fullPath = path.join(savePath, fileName);
  fullPath = await fileUtils.getUniqueFilePath(fullPath);
  const ext = path.extname(fileName);
  if (!ext) {
    throw new Error('No file extension found in URL: ' + url);
  }
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        fs.unlink(fullPath, () => { }); // Try to delete the incomplete file
        return reject(new Error('HTTP Error: ' + response.statusCode));
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

module.exports = {
  downloadFile,
};
