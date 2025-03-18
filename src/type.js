/**
 * @typedef {object} HistoryItem
 * @property {string} date The date of the history entry.
 * @property {Number} fileId The ID of the original file.
 * @property {string} fileName The name of the original file.
 * @property {string} filePath The absolute path of the original file.
 * @property {Number} folderId The ID of the related folder.
 * @property {Number} imageId The ID of the saved image.
 * @property {string} imageName The name of the saved image.
 * @property {string} imagePath The path of the saved image.
 * @property {Number} id The ID of the history entry.
 * @property {Number} maxTime The preset croquis time (in seconds).
 * @property {Number} realTime The actual croquis time (in seconds).
 */

/**
 * @typedef {object} FileItem
 * @property {Number} fileId The ID of the file.
 * @property {string} fileName The name of the file.
 * @property {string} filePath The absolute path of the file.
 * @property {Boolean} isDirectory Whether it is directory
 * @property {HistoryItem[]} histories
 */

/**
 * @typedef {object} DirectoryItem
 * @property {string} dirname The name of the file.
 * @property {string} dirpath The absolute path of the file.
 * @property {DirectoryItem[]} subDirectories
 * @property {number} fileCount 
 */


//#region content
/**
 * @typedef {Object} BaseContentItem
 * @property {string} type
 * @property {Function} clickFunc
 * @property {string} imageName
 * @property  {string} imagePath
 */

/**
 * @typedef {BaseContentItem & {
*     type: 'history',
*     history: History
*     date: string
* }} HistoryContentItem
*/

/**
* @typedef {BaseContentItem & {
*     type: 'file',
*     fileName: string,
*     filePath: string, 
*     histories: HistoryItem[]
* }} FileContentItem
*/

/**
* @typedef {BaseContentItem & {
*     type: 'directory',
*     dirpath: string,
*     dirname: string,
* }} DirectoryContentItem
*/

/**
 * @typedef {HistoryContentItem | FileContentItem | DirectoryContentItem} ContentItem
 */
//#endregion

//#region option
/**
 * @typedef {object} BaseOption
 * @property {string} key name of option
 * @property {any} value value of option
 * @property {string} type
*/

/**
 * @typedef {BaseOption & {
*     type: 'filter',
*     filter: Function
* }} FilterOption
*/

/**
 * @typedef {BaseOption & {
*     type: 'sort',
*     sort: Function
* }} SortOption
*/


/**
 * @typedef {FilterOption | SortOption} Option
 */

/**
 * Represents the application option settings.
 *
 * @typedef {Object} GlobalOption
 * @property {string} rootDirectory - The root directory path selected by the user.
 * @property {string} savePath - The directory path where files will be saved.
 * @property {string} language - The language preference, e.g., 'ko' for Korean or 'en' for English.
 * @property {string} theme - The theme preference, e.g., 'dark' for Dark mode or 'white' for White mode.
 * @property {number} screenScale - The screen scale factor (value between 20 and 500).
 * @property {CroquisOption} croquis - The croquis settings.
 */


/**
 * @typedef {object} CroquisOption
 * @property {object} window
 * @property {number} window.width
 * @property {number} window.height
 * @property {object} auto
 * @property {boolean} auto.skip auto skip when timer end
 * @property {boolean} auto.save auto save when auto skip
 * @property {boolean} auto.capture capture when auto save
 * @property {object} timer
 * @property {number} timer.maxTime
 * @property {boolean} capture capture when save
 * @property {string} savePath
 * @property {string} saveFolder
 * @property {boolean} grayOption
 * @property {boolean} shuffleOption
 */

//#endregion




module.exports = {};