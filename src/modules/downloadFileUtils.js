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

function tryDownloadFile(downloadUrl, filePath) {
  return new Promise((resolve, reject) => {
    https
      .get(downloadUrl, (response) => {
        if (response.statusCode !== 200) {
          fs.unlink(filePath, () => {});
          return reject(new Error("HTTP Error: " + response.statusCode));
        }

        const fileStream = fs.createWriteStream(filePath);
        response.pipe(fileStream);

        fileStream.on("finish", () => {
          fileStream.close();
          resolve(filePath);
        });

        fileStream.on("error", (err) => {
          fs.unlink(filePath, () => {});
          reject(err);
        });
      })
      .on("error", (err) => {
        fs.unlink(filePath, () => {});
        reject(err);
      });
  });
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
  const originalUrl = url;
  if(url.startsWith('https://i.pinimg.com/')){
    url = url.replace(/\/\d+x\//, '/originals/');
  }
  console.log(url)
  const fileName = path.basename(new URL(url).pathname);
  let fullPath = path.join(savePath, fileName);
  fullPath = await fileUtils.getUniqueFilePath(fullPath);
  const ext = path.extname(fileName);
  if (!ext) {
    throw new Error('No file extension found in URL: ' + url);
  }
  return new Promise((resolve, reject) => {
    tryDownloadFile(url, fullPath)
      .then((filePath) => {
        resolve(filePath);
      })
      .catch((err) => {
        if (url !== originalUrl) {
          tryDownloadFile(originalUrl, fullPath)
            .then((filePath) => resolve(filePath))
            .catch((error) => reject(error));
        } else {
          reject(err);
        }
      });
  });
}

module.exports = {
  downloadFile,
};
