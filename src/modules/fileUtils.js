const fs = require('fs').promises;
const path = require('path');
const { loadHistoryListFromFilePathList } = require('../../db/history');

/**
 * Normalize the given path and resolve it to an absolute path.
 * @param {string} originPath
 * @returns {Promise<string>}
 */
async function normalizePath(originPath) {
  return path.resolve(path.normalize(originPath));
}

/**
 * Check if the file name has an image extension.
 * @param {string} fileName
 * @returns {boolean}
 */
function checkIsImage(fileName) {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.bmp', '.webp'];
  const ext = path.extname(fileName).toLowerCase();
  return imageExtensions.includes(ext);
}


/**
 * Recursively retrieve directory information asynchronously.
 * @param {string} absolutePath
 * @returns {Promise<Object>}
 */
async function getDirectoryInfo(absolutePath) {
  try {
    const items = await fs.readdir(absolutePath, { withFileTypes: true });
    // Read sub-directory info asynchronously
    const subDirectoriesPromises = items.map(async (dirent) => {
      const itemPath = path.join(absolutePath, dirent.name);
      if (dirent.isDirectory()) {
        const subDirInfo = await getDirectoryInfo(itemPath);
        return {
          dirname: dirent.name,
          dirpath: itemPath,
          fileCount: subDirInfo.totalFiles,
          subDirectories: subDirInfo.subDirectories,
        };
      }
      return null;
    });
    const subDirectories = (await Promise.all(subDirectoriesPromises))
      .filter(Boolean);

    // Count files in the current directory
    const fileCount = items.filter(dirent => dirent.isFile()).length;
    const totalFiles = fileCount + subDirectories.reduce((acc, dir) => acc + dir.fileCount, 0);

    return {
      totalFiles,
      dirname: path.basename(absolutePath),
      dirpath: absolutePath,
      fileCount: totalFiles,
      subDirectories,
    };
  } catch (error) {
    throw new Error(`Error reading directory: ${error.message}`);
  }
}

/**
 * Retrieve complete directory info from the root directory.
 * @param {string} dirPath
 * @returns {Promise<Object>}
 */
async function getAllDirectoryInfo(dirPath) {
  const absolutePath = await normalizePath(dirPath);
  return getDirectoryInfo(absolutePath);
}

/**
 * Generate a unique file path by appending a number if needed.
 * @param {string} targetPath
 * @returns {Promise<string>}
 */
async function getUniqueFilePath(targetPath) {
  const ext = path.extname(targetPath);
  const basename = path.basename(targetPath, ext);
  const dirname = path.dirname(targetPath);
  let count = 1;
  let newPath = targetPath;
  while (true) {
    try {
      await fs.access(newPath);
      // File exists; append a number to create a unique name.
      newPath = path.join(dirname, `${basename}(${count})${ext}`);
      count++;
    } catch (err) {
      // If access fails, the path is unique.
      return newPath;
    }
  }
}
function isValidFolderName(name) {
  const forbiddenRegex = /[\\\/:\*\?"<>\|]/;
  return !forbiddenRegex.test(name);
}

/**
 * Get the directory contents including files and subdirectories.
 * Filters image files and attaches history data if provided.
 * @param {string} dirPath
 * @param {Function} [getHistories] Optional function to retrieve histories by a list of file paths.
 * @returns {Promise<Object>} Returns an object with success and data properties.
 */
async function getDirectoryContents(dirPath, getHistories) {
  try {
    const absolutePath = await normalizePath(dirPath);
    const dirents = await fs.readdir(absolutePath, { withFileTypes: true });

    // List of file paths for image files only.
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
          histories: dirent.isDirectory() ? [] : (historiesMap[filePath] || []),
        };
      });

    return { success: true, data: items };
  } catch (error) {
    console.error('Error in get-directory-contents:', error);
    return { success: false, msg: 'Check the main directory path.' };
  }
}

/**
 * Copy a file to the target directory ensuring a unique file name.
 * @param {string} sourcePath - The original file path.
 * @param {string} targetDir - The destination directory.
 * @returns {Promise<string>} - The full path of the copied file.
 */
async function copyFileToTarget(sourcePath, targetDir) {
  const targetFilePath = path.join(targetDir, path.basename(sourcePath));
  const uniquePath = await getUniqueFilePath(targetFilePath);
  await fs.copyFile(sourcePath, uniquePath);
  return uniquePath;
}

module.exports = {
  normalizePath,
  checkIsImage,
  getAllDirectoryInfo,
  getUniqueFilePath,
  getDirectoryContents,
  copyFileToTarget,
  isValidFolderName
};