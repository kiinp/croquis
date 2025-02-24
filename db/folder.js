const { db } = require('./init');
const { getFolderWindow } = require('../src/modules/windowManager');

const createFolder = (folderName, historyIds, fileIds) => {
    const insertFolder = db.prepare('INSERT INTO folder (folderName) VALUES (?)');
    const info = insertFolder.run(folderName);
    const folderId = info.lastInsertRowid;

    if (historyIds && historyIds.length > 0) {
        const updateHistory = db.prepare(`
            UPDATE history 
            SET folderId = ? 
            WHERE id IN (${historyIds.map(() => '?').join(',')})
        `);
        updateHistory.run(folderId, ...historyIds);
    }

    if (fileIds && fileIds.length > 0) {
        const insertFolderFile = db.prepare(`
            INSERT INTO folder_file (folderId, fileId) 
            VALUES (?, ?)
        `);
        const insertMany = db.transaction((files) => {
            for (const fileId of files) {
                insertFolderFile.run(folderId, fileId);
            }
        });
        insertMany(fileIds);
    }

    return folderId;
};

const loadFolder = (folderId) => {
    const folder = db.prepare('SELECT * FROM folder WHERE id = ?').get(folderId);

    if (!folder) return null;

    const histories = db.prepare('SELECT * FROM history WHERE folderId = ?').all(folderId);

    const historiesWithImages = histories.map(history => {
        const image = db.prepare('SELECT * FROM image WHERE historyId = ?').get(history.id);
        return { ...history, image };
    });

    const files = db.prepare(`
        SELECT file.*
        FROM file
        JOIN folder_file ON file.id = folder_file.fileId
        WHERE folder_file.folderId = ?
    `).all(folderId);

    return { ...folder, histories: historiesWithImages, files };
};

const getFolderList = () => {
    return db.prepare('SELECT * FROM folder').all();
};

const deleteFolder = (folderId) => {
    const deleteFolderStmt = db.prepare('DELETE FROM folder WHERE id = ?');
    deleteFolderStmt.run(folderId);
};

const addFilesToFolder = (folderId, fileIds) => {
    if (fileIds && fileIds.length > 0) {
        const insertFolderFile = db.prepare(`
            INSERT OR IGNORE INTO folder_file (folderId, fileId) 
            VALUES (?, ?)
        `);
        const insertMany = db.transaction((files) => {
            for (const fileId of files) {
                insertFolderFile.run(folderId, fileId);
            }
        });
        insertMany(fileIds);
    }
};

const removeFilesFromFolder = (folderId, fileIds) => {
    if (fileIds && fileIds.length > 0) {
        const deleteFolderFile = db.prepare(`
            DELETE FROM folder_file 
            WHERE folderId = ? AND fileId IN (${fileIds.map(() => '?').join(',')})
        `);
        deleteFolderFile.run(folderId, ...fileIds);
    }
};

const moveFolder = (folderId, historyList) => {
    
    if (historyList && historyList.length > 0) {
        const placeholders = historyList.map(() => '?').join(',');
        const updateStmt = db.prepare(`
            UPDATE history
            SET folderId = ?
            WHERE id IN (
              SELECT historyId FROM image WHERE imagePath IN (${placeholders})
            )
          `);
        updateStmt.run(folderId, ...historyList);
        historyList = [];
    }
    const folderWindow = getFolderWindow();
    if (folderWindow) {
        folderWindow.close();
    }
}

module.exports = {
    createFolder,
    moveFolder,
    loadFolder,
    getFolderList,
    deleteFolder,
    addFilesToFolder,
    removeFilesFromFolder
};
