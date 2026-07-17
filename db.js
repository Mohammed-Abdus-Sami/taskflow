const Database = require("better-sqlite3");
const path = require("path");

const DB_PATH = path.join(__dirname, "db", "tasks.db");

// Singleton database connection
let dbInstance = null;

function getDb() {
  if (!dbInstance) {
    dbInstance = new Database(DB_PATH);
    dbInstance.pragma("journal_mode = WAL");
    dbInstance.pragma("foreign_keys = ON");
  }
  return dbInstance;
}

module.exports = getDb;
