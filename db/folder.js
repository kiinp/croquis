const { db } = require('./init');

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

    // 각 history에 연결된 image 가져오기
    const historiesWithImages = histories.map(history => {
        const image = db.prepare('SELECT * FROM image WHERE historyId = ?').get(history.id);
        return { ...history, image };
    });

    // folder_file 테이블을 통해 해당 폴더와 연결된 파일 조회
    const files = db.prepare(`
        SELECT file.*
        FROM file
        JOIN folder_file ON file.id = folder_file.fileId
        WHERE folder_file.folderId = ?
    `).all(folderId);

    return { ...folder, histories: historiesWithImages, files };
};

const listFolders = () => {
    return db.prepare('SELECT * FROM folder').all();
};

// 폴더 삭제 함수 (추가)
const deleteFolder = (folderId) => {
    const deleteFolderStmt = db.prepare('DELETE FROM folder WHERE id = ?');
    deleteFolderStmt.run(folderId);
};

// 폴더에 파일 추가 함수 (추가)
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

// 폴더에서 파일 제거 함수 (추가)
const removeFilesFromFolder = (folderId, fileIds) => {
    if (fileIds && fileIds.length > 0) {
        const deleteFolderFile = db.prepare(`
            DELETE FROM folder_file 
            WHERE folderId = ? AND fileId IN (${fileIds.map(() => '?').join(',')})
        `);
        deleteFolderFile.run(folderId, ...fileIds);
    }
};

module.exports = { 
    createFolder, 
    loadFolder, 
    listFolders, 
    deleteFolder, 
    addFilesToFolder, 
    removeFilesFromFolder 
};
