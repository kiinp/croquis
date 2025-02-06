const { app } = require('electron');
const path = require('path')
const Database = require('better-sqlite3')

const dbPath = path.join(app.getPath("userData"), 'database.db')
const db = new Database(dbPath)

const init_db = () => {
  db.pragma('journal_mode = WAL')
  db.exec(`
    CREATE TABLE IF NOT EXISTS folder (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      folderName TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS file (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fileName TEXT NOT NULL,
      filePath TEXT NOT NULL,
      dirname TEXT
    );

    CREATE TABLE IF NOT EXISTS folder_file (
      folderId INTEGER NOT NULL,
      fileId INTEGER NOT NULL,
      PRIMARY KEY (folderId, fileId),
      FOREIGN KEY(folderId) REFERENCES folder(id) ON DELETE CASCADE,
      FOREIGN KEY(fileId) REFERENCES file(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fileId INTEGER NOT NULL,
      date TEXT NOT NULL,
      maxTime INTEGER,
      realTime INTEGER,
      folderId INTEGER,
      FOREIGN KEY(fileId) REFERENCES file(id),
      FOREIGN KEY(folderId) REFERENCES folder(id)
    );

    CREATE TABLE IF NOT EXISTS image (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      imagePath TEXT NOT NULL,
      imageName TEXT NOT NULL,
      historyId INTEGER UNIQUE,
      FOREIGN KEY(historyId) REFERENCES history(id)
    );
  `);
  addFolderIfEmpty('root');
}

const addFolderIfEmpty = (folderName) => {
  const row = db.prepare('SELECT COUNT(*) AS cnt FROM folder').get()
  if (row.cnt === 0) {
    db.prepare('INSERT INTO folder (folderName) VALUES (?)').run(folderName)
  }
}



module.exports = { db, init_db }
