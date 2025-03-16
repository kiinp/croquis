const { db } = require('./init');
const path = require("path");


const historyQuery = `
            SELECT 
                h.id, 
                h.fileId, 
                h.date, 
                h.maxTime, 
                h.realTime, 
                h.folderId,
                f.filePath,
                f.fileName,
                i.id AS imageId,
                i.imageName, 
                i.imagePath
            FROM history h
            JOIN file f ON f.id = h.fileId
            LEFT JOIN image i ON i.historyId = h.id
        `

/**
 * 
 * @param {object} rows
 * @returns {import('../src/type').HistoryItem[]}; 
 */
const convertRows = (rows) => {
    return rows.map((row) => {
        /** @type {import('../src/type').HistoryItem} */
        return {
            date: row.date,
            fileId: row.fileId,
            fileName: row.fileName,
            filePath: row.filePath,
            folderId: row.folderId,
            imageId: row.imageId,
            imageName: row.imageName || "empty",
            imagePath: row.imagePath || "",
            id: row.id,
            maxTime: row.maxTime,
            realTime: row.realTime,
        };
    });
}

/**
 * 
 * @param {Object} fieldValues 
 * @param {string} filePath
 * @returns 
 */
const saveHistory = (fieldValues, filePath) => {
    console.log(fieldValues, filePath, "history create");
    let file = db.prepare('SELECT * FROM file WHERE filePath = ?').get(filePath);

    if (!file) {
        // 파일이 없으면 새로 생성
        const insertFile = db.prepare('INSERT INTO file (fileName, filePath, dirname) VALUES (?, ?, ?)');
        const info = insertFile.run(path.basename(filePath), filePath, path.dirname(filePath));
        file = { id: info.lastInsertRowid };
    }

    let folder = db.prepare('SELECT * FROM folder WHERE id = ?').get(fieldValues.folderId);

    if (!folder) {
        const firstFolder = db.prepare('SELECT * FROM folder ORDER BY id ASC LIMIT 1').get();
        if (firstFolder) {
            fieldValues.folderId = firstFolder.id;
        }
    }
    if (fieldValues.folderId) {
        db.prepare('INSERT OR IGNORE INTO folder_file (folderId, fileId) VALUES (?, ?)').run(fieldValues.folderId, file.id);
    }
    const insertHistory = db.prepare('INSERT INTO history (fileId, date, maxTime, realTime, folderId) VALUES (?, ?, ?, ?, ?)');
    const info = insertHistory.run(file.id, fieldValues.date, fieldValues.maxTime, fieldValues.realTime, fieldValues.folderId);

    return info.lastInsertRowid;
};

const loadHistory = (historyId, includeRelated = false) => {
    const history = db.prepare('SELECT * FROM history WHERE id = ?').get(historyId);

    if (!history) return null;

    if (includeRelated) {
        const file = db.prepare('SELECT * FROM file WHERE id = ?').get(history.fileId);
        const image = db.prepare('SELECT * FROM image WHERE historyId = ?').get(historyId);

        return { ...history, file, image };
    }

    return history;
};

/**
 * 
 * @param {number} folderId folderId; if null, then return all histories
 * @return {import('../src/type').HistoryItem[]}
 */
const loadHistoryList = (folderId = null) => {
    let query = historyQuery;
    const params = [];

    // only one history
    if (folderId !== "" && folderId !== null) {
        query += " WHERE h.folderId = ?";
        params.push(folderId);
    }
    const stmt = db.prepare(query);
    const rows = stmt.all(...params);

    return convertRows(rows);
}


/**
 * 
 * @param {string[]} filePathList filePath list
 * @returns {import('../src/type').HistoryItem[]}
 */
const loadHistoryListFromFilePathList = (filePathList) => {
    let query = historyQuery;
    if (filePathList && filePathList.length > 0) {
        query += `WHERE f.filePath IN (${filePathList.map(() => '?').join(',')})`;
    }
    const stmt = db.prepare(query);
    const rows = stmt.all(...filePathList);
    return convertRows(rows);
}
module.exports = { saveHistory, loadHistory, loadHistoryList, loadHistoryListFromFilePathList };