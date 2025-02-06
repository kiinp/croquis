const { db } = require('./init');
const path = require("path");

const saveImage = (historyId, imagePath) => {
    const insertImage = db.prepare('INSERT INTO image (imagePath, imageName, historyId) VALUES (?, ?, ?)');
    const info = insertImage.run(imagePath, path.basename(imagePath), historyId);

    return info.lastInsertRowid;
};

module.exports = { saveImage };