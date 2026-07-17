const express = require("express");
const cors = require("cors");
const path = require("path");
const { getDb, initDatabase } = require("./db");

// Initialize database on startup (auto-creates tables & seeds data)
initDatabase();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// ============ TASK API ENDPOINTS ============

// GET all tasks (with optional filtering & sorting)
app.get("/api/tasks", (req, res) => {
  const db = getDb();
  const { status, priority, category, sort, order } = req.query;

  let query = "SELECT * FROM tasks WHERE 1=1";
  const params = {};

  if (status) {
    query += " AND status = @status";
    params.status = status;
  }
  if (priority) {
    query += " AND priority = @priority";
    params.priority = priority;
  }
  if (category) {
    query += " AND category = @category";
    params.category = category;
  }

  if (sort) {
    const validSorts = ["title", "priority", "due_date", "created_at", "status"];
    if (validSorts.includes(sort)) {
      query += ` ORDER BY ${sort} ${order === "desc" ? "DESC" : "ASC"}`;
    } else {
      query += " ORDER BY created_at DESC";
    }
  } else {
    query += " ORDER BY created_at DESC";
  }

  try {
    const tasks = db.prepare(query).all(params);
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tasks", detail: err.message });
  }
});

// GET a single task by ID (with comments)
app.get("/api/tasks/:id", (req, res) => {
  const db = getDb();
  const { id } = req.params;

  try {
    const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    const comments = db.prepare("SELECT * FROM comments WHERE task_id = ? ORDER BY created_at ASC").all(id);
    res.json({ ...task, comments });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch task", detail: err.message });
  }
});

// CREATE a new task
app.post("/api/tasks", (req, res) => {
  const db = getDb();
  const { title, description, status, priority, category, due_date } = req.body;

  if (!title || title.trim() === "") {
    return res.status(400).json({ error: "Title is required" });
  }

  const validStatuses = ["pending", "in-progress", "completed"];
  const validPriorities = ["low", "medium", "high"];

  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status value" });
  }
  if (priority && !validPriorities.includes(priority)) {
    return res.status(400).json({ error: "Invalid priority value" });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO tasks (title, description, status, priority, category, due_date)
      VALUES (@title, @description, @status, @priority, @category, @due_date)
    `);

    const result = stmt.run({
      title: title.trim(),
      description: (description || "").trim(),
      status: status || "pending",
      priority: priority || "medium",
      category: category || "general",
      due_date: due_date || null,
    });

    const newTask = db.prepare("SELECT * FROM tasks WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json(newTask);
  } catch (err) {
    res.status(500).json({ error: "Failed to create task", detail: err.message });
  }
});

// UPDATE a task
app.put("/api/tasks/:id", (req, res) => {
  const db = getDb();
  const { id } = req.params;
  const { title, description, status, priority, category, due_date } = req.body;

  try {
    const existing = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
    if (!existing) {
      return res.status(404).json({ error: "Task not found" });
    }

    const stmt = db.prepare(`
      UPDATE tasks SET
        title = @title,
        description = @description,
        status = @status,
        priority = @priority,
        category = @category,
        due_date = @due_date,
        updated_at = datetime('now')
      WHERE id = @id
    `);

    stmt.run({
      id: parseInt(id),
      title: title !== undefined ? title.trim() : existing.title,
      description: description !== undefined ? description.trim() : existing.description,
      status: status || existing.status,
      priority: priority || existing.priority,
      category: category || existing.category,
      due_date: due_date !== undefined ? due_date : existing.due_date,
    });

    const updated = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update task", detail: err.message });
  }
});

// DELETE a task
app.delete("/api/tasks/:id", (req, res) => {
  const db = getDb();
  const { id } = req.params;

  try {
    const result = db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.json({ message: "Task deleted successfully", id: parseInt(id) });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete task", detail: err.message });
  }
});

// ============ COMMENTS API ============

// GET comments for a task
app.get("/api/tasks/:id/comments", (req, res) => {
  const db = getDb();
  const { id } = req.params;

  try {
    const comments = db
      .prepare("SELECT * FROM comments WHERE task_id = ? ORDER BY created_at ASC")
      .all(id);
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch comments", detail: err.message });
  }
});

// ADD a comment to a task
app.post("/api/tasks/:id/comments", (req, res) => {
  const db = getDb();
  const { id } = req.params;
  const { content } = req.body;

  if (!content || content.trim() === "") {
    return res.status(400).json({ error: "Comment content is required" });
  }

  try {
    const task = db.prepare("SELECT id FROM tasks WHERE id = ?").get(id);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const stmt = db.prepare(`
      INSERT INTO comments (task_id, content) VALUES (@task_id, @content)
    `);
    const result = stmt.run({ task_id: parseInt(id), content: content.trim() });

    const newComment = db.prepare("SELECT * FROM comments WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json(newComment);
  } catch (err) {
    res.status(500).json({ error: "Failed to add comment", detail: err.message });
  }
});

// DELETE a comment
app.delete("/api/comments/:id", (req, res) => {
  const db = getDb();
  const { id } = req.params;

  try {
    const result = db.prepare("DELETE FROM comments WHERE id = ?").run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: "Comment not found" });
    }
    res.json({ message: "Comment deleted successfully", id: parseInt(id) });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete comment", detail: err.message });
  }
});

// ============ STATISTICS / DASHBOARD ============

app.get("/api/stats", (req, res) => {
  const db = getDb();

  try {
    const total = db.prepare("SELECT COUNT(*) as count FROM tasks").get().count;
    const pending = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'pending'").get().count;
    const inProgress = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'in-progress'").get().count;
    const completed = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'completed'").get().count;

    const byPriority = db.prepare(`
      SELECT priority, COUNT(*) as count FROM tasks GROUP BY priority
    `).all();

    const byCategory = db.prepare(`
      SELECT category, COUNT(*) as count FROM tasks GROUP BY category
    `).all();

    res.json({
      total,
      pending,
      inProgress,
      completed,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      byPriority,
      byCategory,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stats", detail: err.message });
  }
});

// Health check (useful for Render)
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Serve frontend
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n  TaskFlow server running on http://localhost:${PORT}\n`);
});
