const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const DB_PATH = path.join(__dirname, "db", "tasks.db");

// Singleton database connection
let dbInstance = null;

function getDb() {
  if (!dbInstance) {
    // Ensure db directory exists (important for cloud deployments like Render)
    const dbDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    dbInstance = new Database(DB_PATH);
    dbInstance.pragma("journal_mode = WAL");
    dbInstance.pragma("foreign_keys = ON");
  }
  return dbInstance;
}

/**
 * Initialize the database — creates tables and seeds sample data.
 * Called automatically on server startup.
 */
function initDatabase() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      priority TEXT NOT NULL DEFAULT 'medium',
      category TEXT NOT NULL DEFAULT 'general',
      due_date TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
    CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
  `);

  // Seed sample data if tasks table is empty
  const count = db.prepare("SELECT COUNT(*) as count FROM tasks").get();
  if (count.count === 0) {
    const insertTask = db.prepare(`
      INSERT INTO tasks (title, description, status, priority, category, due_date)
      VALUES (@title, @description, @status, @priority, @category, @due_date)
    `);

    const sampleTasks = [
      { title: "Design homepage UI", description: "Create wireframes for the landing page", status: "completed", priority: "high", category: "Design", due_date: "2026-07-20" },
      { title: "Set up database schema", description: "Define tables for users, tasks, and comments", status: "completed", priority: "high", category: "Development", due_date: "2026-07-18" },
      { title: "Implement REST API endpoints", description: "Build CRUD endpoints for task management", status: "in-progress", priority: "high", category: "Development", due_date: "2026-07-22" },
      { title: "Write unit tests", description: "Add test coverage for API endpoints", status: "pending", priority: "medium", category: "Testing", due_date: "2026-07-25" },
      { title: "User authentication", description: "Implement JWT-based login system", status: "pending", priority: "high", category: "Development", due_date: "2026-07-23" },
      { title: "Prepare demo presentation", description: "Create slides for the project demo session", status: "in-progress", priority: "medium", category: "Planning", due_date: "2026-07-26" },
    ];

    sampleTasks.forEach((task) => insertTask.run(task));

    // Add sample comments
    const insertComment = db.prepare(`
      INSERT INTO comments (task_id, content) VALUES (@task_id, @content)
    `);
    insertComment.run({ task_id: 1, content: "Wireframes approved by the team!" });
    insertComment.run({ task_id: 3, content: "GET and POST endpoints are working, working on PUT and DELETE next." });

    console.log("✅ Sample data inserted successfully.");
  }

  console.log("✅ Database initialized at:", DB_PATH);
}

module.exports = { getDb, initDatabase };
