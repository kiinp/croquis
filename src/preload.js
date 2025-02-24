const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('api', {
    createHistoryFolder: async (folderName) => {
        return await ipcRenderer.invoke('create-history-folder', folderName);
    },
    getFolderList: async () => {
        return await ipcRenderer.invoke('get-folder-list');
    },
    moveFolder: async (data) => {
        return await ipcRenderer.invoke('move-folder', data);
    },
    copyImageFromFilePath: async (filePath) => {
        return await ipcRenderer.invoke('copy-image-to-clipboard', filePath);
    },
    getWindowSize: async () => {
        return await ipcRenderer.invoke('get-window-size');
    },
    getDirectoryContents: async (dirPath) => {
        return await ipcRenderer.invoke('get-directory-contents', dirPath);
    },
    getHistoryContents: async (folderId) => {
        return await ipcRenderer.invoke('get-history-contents', folderId);
    },
    getAllDirectoryInfo: async (dirPath) => {
        return await ipcRenderer.invoke('get-all-directory-info', dirPath);
    },
    showFilePath(file) {
        const filePath = webUtils.getPathForFile(file);
        return filePath;
    },
    once: (eventName, callback) => ipcRenderer.once(eventName, (event, ...args) => callback(...args)),
    send: (channel, data) => ipcRenderer.send(channel, data),
    receive: (channel, callback) => ipcRenderer.on(channel, (event, ...args) => callback(...args)),
    createFolder: (folderName, historyIds, fileIds) => ipcRenderer.invoke('create-folder', folderName, historyIds, fileIds),
    loadHistory: (historyId, includeRelated) => ipcRenderer.invoke('load-history', historyId, includeRelated),
    loadFolder: (folderId) => ipcRenderer.invoke('load-folder', folderId),
    listFolders: () => ipcRenderer.invoke('list-folders'),
    saveHistory: (fieldValues, filePath) => ipcRenderer.invoke('save-history', fieldValues, filePath),
    saveImage: (historyId, imagePath) => ipcRenderer.invoke('save-image', historyId, imagePath),
    getOption: (option) => ipcRenderer.invoke('get-option', option),
    onCaptureCompleted: (callback) => ipcRenderer.on('capture-completed', (event, filePath) => callback(filePath)),
    openFolder: async () => await ipcRenderer.invoke('open-folder-dialog'),
    addFolder: async (args) => await ipcRenderer.invoke('add-folder', args),
    setOption: async (options) => await ipcRenderer.invoke('set-option', options),
    getAppVersion: async () => await ipcRenderer.invoke('get-app-version'),
});
