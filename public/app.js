/* ===== TaskFlow Frontend Application ===== */

const API = "/api";

// State
let tasks = [];
let currentView = "board";
let editingTaskId = null;
let currentDetailTaskId = null;

// DOM Elements
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ===== API Calls =====
async function fetchTasks(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API}/tasks${query ? `?${query}` : ""}`);
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
}

async function fetchTaskById(id) {
  const res = await fetch(`${API}/tasks/${id}`);
  if (!res.ok) throw new Error("Failed to fetch task");
  return res.json();
}

async function createTask(data) {
  const res = await fetch(`${API}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to create task");
  }
  return res.json();
}

async function updateTask(id, data) {
  const res = await fetch(`${API}/tasks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to update task");
  }
  return res.json();
}

async function deleteTask(id) {
  const res = await fetch(`${API}/tasks/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete task");
  return res.json();
}

async function fetchStats() {
  const res = await fetch(`${API}/stats`);
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

async function addComment(taskId, content) {
  const res = await fetch(`${API}/tasks/${taskId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error("Failed to add comment");
  return res.json();
}

// ===== Rendering =====
function getPriorityBadge(priority) {
  const cls = { high: "badge-high", medium: "badge-medium", low: "badge-low" }[priority] || "badge-medium";
  return `<span class="badge ${cls}">${priority}</span>`;
}

function getStatusPill(status) {
  const cls = `status-${status}`;
  const label = status.replace("-", " ");
  return `<span class="status-pill ${cls}">${label}</span>`;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isOverdue(dateStr, status) {
  if (!dateStr || status === "completed") return false;
  return new Date(dateStr) < new Date(new Date().toDateString());
}

function renderTaskCard(task) {
  return `
    <div class="task-card" data-id="${task.id}">
      <div class="task-card-actions">
        <button class="icon-btn" onclick="event.stopPropagation();openEditModal(${task.id})" title="Edit">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
        <button class="icon-btn danger" onclick="event.stopPropagation();handleDelete(${task.id})" title="Delete">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>
      <div class="task-card-title">${escapeHtml(task.title)}</div>
      ${task.description ? `<div class="task-card-desc">${escapeHtml(task.description)}</div>` : ""}
      <div class="task-card-meta">
        ${getPriorityBadge(task.priority)}
        <span class="badge badge-category">${escapeHtml(task.category)}</span>
        <span class="badge badge-due">${isOverdue(task.due_date, task.status) ? "⚠ " : ""}${formatDate(task.due_date)}</span>
      </div>
    </div>
  `;
}

function renderBoard() {
  const statuses = ["pending", "in-progress", "completed"];
  statuses.forEach((status) => {
    const filtered = tasks.filter((t) => t.status === status);
    const container = document.getElementById(`col-${status}`);
    container.innerHTML = filtered.length > 0
      ? filtered.map(renderTaskCard).join("")
      : `<div class="empty-state"><h3>No tasks</h3></div>`;
    document.getElementById(`count-${status}`).textContent = filtered.length;
  });

  // Attach click handlers
  $$(".task-card").forEach((card) => {
    card.addEventListener("click", () => openDetailModal(card.dataset.id));
  });
}

function renderList() {
  const tbody = $("#task-list-body");
  if (tasks.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:40px;">No tasks found</td></tr>`;
    return;
  }
  tbody.innerHTML = tasks
    .map(
      (task) => `
    <tr>
      <td style="font-weight:600;">${escapeHtml(task.title)}</td>
      <td>${getStatusPill(task.status)}</td>
      <td>${getPriorityBadge(task.priority)}</td>
      <td><span class="badge badge-category">${escapeHtml(task.category)}</span></td>
      <td>${formatDate(task.due_date)}</td>
      <td>
        <div class="action-icons">
          <button class="icon-btn" onclick="openDetailModal(${task.id})" title="View">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <button class="icon-btn" onclick="openEditModal(${task.id})" title="Edit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="icon-btn danger" onclick="handleDelete(${task.id})" title="Delete">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `
    )
    .join("");
}

async function renderStats() {
  try {
    const stats = await fetchStats();
    $("#stats-grid").innerHTML = `
      <div class="stat-card">
        <div class="stat-label">Total Tasks</div>
        <div class="stat-value">${stats.total}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">In Progress</div>
        <div class="stat-value" style="color:var(--blue)">${stats.inProgress}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Completed</div>
        <div class="stat-value" style="color:var(--green)">${stats.completed}</div>
      </div>
      <div class="stat-card highlight">
        <div class="stat-label">Completion Rate</div>
        <div class="stat-value">${stats.completionRate}%</div>
      </div>
    `;

    // Priority chart
    const priorityColors = { high: "fill-red", medium: "fill-yellow", low: "fill-green" };
    const maxPriority = Math.max(...stats.byPriority.map((p) => p.count), 1);
    $("#priority-chart").innerHTML = stats.byPriority
      .map(
        (p) => `
      <div class="bar-row">
        <div class="bar-label">${p.priority}</div>
        <div class="bar-track">
          <div class="bar-fill ${priorityColors[p.priority] || "fill-primary"}" style="width:${(p.count / maxPriority) * 100}%">${p.count}</div>
        </div>
      </div>
    `
      )
      .join("");

    // Category chart
    const maxCategory = Math.max(...stats.byCategory.map((c) => c.count), 1);
    $("#category-chart").innerHTML = stats.byCategory
      .map(
        (c) => `
      <div class="bar-row">
        <div class="bar-label">${escapeHtml(c.category)}</div>
        <div class="bar-track">
          <div class="bar-fill fill-primary" style="width:${(c.count / maxCategory) * 100}%">${c.count}</div>
        </div>
      </div>
    `
      )
      .join("");
  } catch (err) {
    showToast(err.message, "error");
  }
}

function render() {
  if (currentView === "board") renderBoard();
  else if (currentView === "list") renderList();
  else if (currentView === "stats") renderStats();
}

// ===== Load Tasks =====
async function loadTasks() {
  try {
    const params = {};

    const status = $("#filter-status").value;
    const priority = $("#filter-priority").value;
    const category = $("#filter-category").value;
    const sortVal = $("#sort-by").value;

    if (status) params.status = status;
    if (priority) params.priority = priority;
    if (category) params.category = category;

    if (sortVal) {
      const [sort, order] = sortVal.split("-");
      params.sort = sort;
      params.order = order;
    }

    tasks = await fetchTasks(params);

    // Client-side search filter
    const searchTerm = $("#search-input").value.toLowerCase();
    if (searchTerm) {
      tasks = tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(searchTerm) ||
          (t.description && t.description.toLowerCase().includes(searchTerm))
      );
    }

    // Update category filter options
    updateCategoryOptions();

    render();
  } catch (err) {
    showToast(err.message, "error");
  }
}

function updateCategoryOptions() {
  const select = $("#filter-category");
  const currentValue = select.value;
  const categories = [...new Set(tasks.map((t) => t.category))].sort();
  select.innerHTML =
    '<option value="">All Categories</option>' +
    categories.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
  select.value = currentValue;
}

// ===== Modal Handlers =====
function openCreateModal() {
  editingTaskId = null;
  $("#modal-title").textContent = "New Task";
  $("#task-form").reset();
  $("#task-id").value = "";
  $("#priority").value = "medium";
  $("#status").value = "pending";
  $("#category").value = "general";
  $("#task-modal").classList.add("active");
  $("#title").focus();
}

async function openEditModal(id) {
  try {
    const task = await fetchTaskById(id);
    editingTaskId = id;
    $("#modal-title").textContent = "Edit Task";
    $("#task-id").value = id;
    $("#title").value = task.title;
    $("#description").value = task.description || "";
    $("#status").value = task.status;
    $("#priority").value = task.priority;
    $("#category").value = task.category;
    $("#due_date").value = task.due_date || "";
    $("#task-modal").classList.add("active");
  } catch (err) {
    showToast(err.message, "error");
  }
}

function closeModal() {
  $("#task-modal").classList.remove("active");
  editingTaskId = null;
}

async function openDetailModal(id) {
  try {
    const task = await fetchTaskById(id);
    currentDetailTaskId = id;

    $("#detail-content").innerHTML = `
      <div class="detail-title">${escapeHtml(task.title)}</div>
      ${task.description ? `<div class="detail-desc">${escapeHtml(task.description)}</div>` : ""}
      <div class="detail-meta">
        ${getStatusPill(task.status)}
        ${getPriorityBadge(task.priority)}
        <span class="badge badge-category">${escapeHtml(task.category)}</span>
        <span class="badge badge-due">Due: ${formatDate(task.due_date)}</span>
      </div>
      <div class="detail-info">
        Created: ${task.created_at} · Updated: ${task.updated_at}
      </div>
    `;

    const commentsList = $("#comments-list");
    if (task.comments && task.comments.length > 0) {
      commentsList.innerHTML = task.comments
        .map(
          (c) => `
        <div class="comment-item">
          <div class="comment-content">${escapeHtml(c.content)}</div>
          <div class="comment-date">${c.created_at}</div>
        </div>
      `
        )
        .join("");
    } else {
      commentsList.innerHTML = `<p style="color:var(--text-muted);font-size:14px;">No comments yet.</p>`;
    }

    $("#detail-modal").classList.add("active");
  } catch (err) {
    showToast(err.message, "error");
  }
}

function closeDetailModal() {
  $("#detail-modal").classList.remove("active");
  currentDetailTaskId = null;
}

// ===== Task Form Submit =====
$("#task-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = {
    title: $("#title").value,
    description: $("#description").value,
    status: $("#status").value,
    priority: $("#priority").value,
    category: $("#category").value || "general",
    due_date: $("#due_date").value || null,
  };

  try {
    if (editingTaskId) {
      await updateTask(editingTaskId, data);
      showToast("Task updated successfully", "success");
    } else {
      await createTask(data);
      showToast("Task created successfully", "success");
    }
    closeModal();
    await loadTasks();
  } catch (err) {
    showToast(err.message, "error");
  }
});

// ===== Delete Task =====
async function handleDelete(id) {
  if (!confirm("Are you sure you want to delete this task?")) return;
  try {
    await deleteTask(id);
    showToast("Task deleted successfully", "success");
    await loadTasks();
  } catch (err) {
    showToast(err.message, "error");
  }
}

// ===== Comment Submit =====
$("#add-comment-btn").addEventListener("click", async () => {
  const content = $("#comment-input").value.trim();
  if (!content) return;
  try {
    await addComment(currentDetailTaskId, content);
    $("#comment-input").value = "";
    showToast("Comment added", "success");
    openDetailModal(currentDetailTaskId);
  } catch (err) {
    showToast(err.message, "error");
  }
});

// ===== View Switching =====
$$(".nav-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    $$(".nav-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentView = btn.dataset.view;
    $$(".view").forEach((v) => v.classList.remove("active"));
    $(`#${currentView}-view`).classList.add("active");
    render();
  });
});

// ===== Filter Listeners =====
["#filter-status", "#filter-priority", "#filter-category", "#sort-by"].forEach((sel) => {
  $(sel).addEventListener("change", loadTasks);
});

$("#search-input").addEventListener("input", () => {
  // Re-filter without API call (client-side search)
  loadTasks();
});

// ===== Modal Close Handlers =====
$("#new-task-btn").addEventListener("click", openCreateModal);
$("#modal-close").addEventListener("click", closeModal);
$("#modal-cancel").addEventListener("click", closeModal);
$("#detail-close").addEventListener("click", closeDetailModal);

// Close on overlay click
$("#task-modal").addEventListener("click", (e) => {
  if (e.target === e.currentTarget) closeModal();
});
$("#detail-modal").addEventListener("click", (e) => {
  if (e.target === e.currentTarget) closeDetailModal();
});

// Close on Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeModal();
    closeDetailModal();
  }
});

// ===== Toast =====
function showToast(message, type = "success") {
  const toast = $("#toast");
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => toast.classList.remove("show"), 3000);
}

// ===== Utils =====
function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ===== Init =====
loadTasks();
