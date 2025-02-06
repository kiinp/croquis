import { FileItem, HistoryItem } from "./src/type";

export { };

declare global {
    interface Window {
        api: {
            /**
             * Get history contents.
             * @param {number} folderId - The ID of the folder to fetch history for.
             * @returns {Promise<{ success: boolean, data: HistoryItem, msg: string }>} - The result object.
             */
            getHistoryContents: (folderId: number) => Promise<{ success: boolean, data: HistoryItem, msg: string }>;
            /**
             * Get file contents.
             * @param {string} dirPath - The path of the folder.
             * @returns {Promise<{ success: boolean, data: FileItem, msg: string }>} - The result object.
             */
            getDirectoryContents: (dirPath: string) => Promise<{ success: boolean, data: FileItem, msg: string }>;
            /**
             * Get file contents.
             * @param {string} dirPath - The path of the root path.
             * @returns {Promise<{ success: boolean, data: FileItem, msg: string }>} - The result object.
             */
            getAllDirectoryInfo: (dirPath: string) => Promise<{ success: boolean, data: FileItem, msg: string }>;
            /**
             * Save History
             * @param {date:string, maxTime:number, realTime:number, folderId:number} filedValues - history data to save
             * @param {string} filePath - origin file path
             * @returns {Promise<{ success: boolean, data: number, msg: string }>} - data: historyId.
             */
            saveHistory: (filedValues: {date:string, maxTime:number, realTime:number, folderId:number} , filePath: string) => Promise<{ success: boolean, data: number, msg: string }>;
        };
    }
}