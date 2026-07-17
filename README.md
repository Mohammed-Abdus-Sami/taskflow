# 📋 TaskFlow — Full-Stack Task Management Application

A modern, full-stack task management web application built with Node.js, Express, and SQLite. Features a Kanban board, list view, analytics dashboard, task comments, filtering, and search.

## 🎯 Project Overview

**TaskFlow** is designed to help individuals and teams manage their tasks efficiently. It provides a clean, intuitive interface with multiple views (Kanban board, list, and dashboard), priority management, categorization, due date tracking, and commenting — all powered by a RESTful API.

### Target Audience
- Students managing assignments and projects
- Professionals tracking daily tasks and deadlines
- Small teams collaborating on shared work items

---

## 🛠️ Tech Stack

| Layer | Technology | Why It Was Chosen |
|-------|-----------|-------------------|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript | Lightweight, no build step needed, fast load times |
| **Backend** | Node.js + Express.js | Minimal, flexible, excellent for REST APIs |
| **Database** | SQLite (via better-sqlite3) | Serverless, zero-config, perfect for demos and small apps |
| **Styling** | Custom CSS with CSS Variables | Dark theme, responsive design, no framework overhead |
| **Font** | Google Fonts (Inter) | Clean, modern, highly readable |

---

## ✨ Features

### Core Features
- ✅ **Kanban Board View** — Drag-free, organized columns for Pending, In Progress, and Completed tasks
- 📝 **List View** — Tabular view with sortable columns
- 📊 **Dashboard/Stats View** — Visual charts for tasks by priority and category, plus completion metrics
- 🔍 **Search & Filter** — Full-text search, filter by status, priority, category, and sort options
- 🏷️ **Priority Levels** — Low, Medium, High with visual badges
- 📂 **Categories** — Custom categorization for tasks (Design, Development, Testing, etc.)
- 📅 **Due Date Tracking** — Visual indicators for overdue tasks
- 💬 **Comments** — Add comments to individual tasks
- 📱 **Responsive Design** — Works seamlessly on desktop, tablet, and mobile

### API Features
- Full CRUD operations for tasks and comments
- RESTful endpoint design
- Input validation and error handling
- Statistics aggregation endpoint
- Query parameters for filtering and sorting
- Proper HTTP status codes

---

## 📁 Project Structure

```
taskflow/
├── package.json          # Node.js project config & dependencies
├── server.js             # Express server — API routes & middleware
├── database.js           # Database initialization & seed data script
├── db.js                 # Database connection singleton
├── .gitignore            # Git ignore rules
├── README.md             # This file
├── public/               # Frontend static files
│   ├── index.html        # Main HTML structure
│   ├── styles.css        # All application styles (dark theme)
│   └── app.js            # Frontend JavaScript logic & API calls
└── db/                   # SQLite database (auto-generated)
    └── tasks.db          # Database file (created on first run)
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18+ installed
- npm (comes with Node.js)

### Installation & Running

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/taskflow.git
cd taskflow

# 2. Install dependencies
npm install

# 3. Initialize the database (creates tables + seed data)
npm run init-db

# 4. Start the server
npm start
```

The app will be available at **http://localhost:3000**

### Development Mode (auto-reload)
```bash
npm run dev
```

---

## 📡 API Documentation

### Base URL: `http://localhost:3000/api`

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/tasks` | Get all tasks (supports filtering & sorting) |
| `GET` | `/tasks/:id` | Get a single task with its comments |
| `POST` | `/tasks` | Create a new task |
| `PUT` | `/tasks/:id` | Update an existing task |
| `DELETE` | `/tasks/:id` | Delete a task |

### Query Parameters for `GET /tasks`
| Parameter | Values | Description |
|-----------|--------|-------------|
| `status` | `pending`, `in-progress`, `completed` | Filter by status |
| `priority` | `low`, `medium`, `high` | Filter by priority |
| `category` | string | Filter by category |
| `sort` | `title`, `priority`, `due_date`, `created_at`, `status` | Sort field |
| `order` | `asc`, `desc` | Sort order |

### Comments

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/tasks/:id/comments` | Get comments for a task |
| `POST` | `/tasks/:id/comments` | Add a comment to a task |
| `DELETE` | `/comments/:id` | Delete a comment |

### Statistics

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/stats` | Get dashboard statistics (counts, completion rate, breakdowns) |

### Example: Create a Task
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Deploy application",
    "description": "Deploy to production server",
    "status": "pending",
    "priority": "high",
    "category": "DevOps",
    "due_date": "2026-07-30"
  }'
```

---

## 🗄️ Database Schema

### `tasks` Table
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| title | TEXT | NOT NULL |
| description | TEXT | |
| status | TEXT | DEFAULT 'pending' |
| priority | TEXT | DEFAULT 'medium' |
| category | TEXT | DEFAULT 'general' |
| due_date | TEXT | |
| created_at | TEXT | DEFAULT current timestamp |
| updated_at | TEXT | DEFAULT current timestamp |

### `comments` Table
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| task_id | INTEGER | FK → tasks(id) ON DELETE CASCADE |
| content | TEXT | NOT NULL |
| created_at | TEXT | DEFAULT current timestamp |

### Indexes
- `idx_tasks_status` — Fast filtering by status
- `idx_tasks_priority` — Fast filtering by priority
- `idx_tasks_due_date` — Fast due date queries

---

## 🎨 Design Decisions

### UI/UX
- **Dark Theme**: Chosen for reduced eye strain during extended use, modern aesthetic, and developer-friendly appeal
- **CSS Variables**: Used for consistent theming and easy customization
- **No CSS Framework**: Custom CSS keeps the bundle small and the design unique, avoiding the "Bootstrap look"
- **Responsive Grid**: Board view uses CSS Grid for clean 3-column layout on desktop and stacks on mobile

### Architecture
- **Monolithic Structure**: Frontend and backend served from the same Express server — simpler deployment, no CORS issues
- **Vanilla JavaScript**: No React/Vue — demonstrates fundamental DOM manipulation and fetch API skills
- **SQLite over PostgreSQL/MySQL**: Zero-config, file-based, perfect for demos and small-to-medium projects
- **better-sqlite3**: Synchronous API is simpler and faster than async alternatives for this use case

### API Design
- **RESTful conventions**: Standard HTTP methods and status codes
- **Query parameters**: Flexible filtering without complex URL structures
- **Input validation**: Server-side validation for status and priority values

---

## 🧩 Challenges & Solutions

### 1. Database Connection Management
**Challenge**: Managing database connections efficiently without connection pooling complexity.
**Solution**: Used a singleton pattern (`db.js`) that creates a single connection reused across the application.

### 2. Client-Side Search vs Server-Side Filtering
**Challenge**: Implementing text search without overcomplicating the API.
**Solution**: Status, priority, category, and sorting are handled server-side via query parameters. Full-text search is handled client-side for instant feedback, avoiding the need for SQLite FTS.

### 3. Category Filter Options
**Challenge**: Category dropdown should reflect existing categories dynamically.
**Solution**: After each data load, existing categories are extracted from the current task set and populated into the filter dropdown.

### 4. Responsive Board Layout
**Challenge**: 3-column Kanban board doesn't work on mobile.
**Solution**: CSS Grid with media queries — 3 columns on desktop, single column on screens below 900px.

---

## 📊 Demo Script

### Part 1: Introduction
1. Explain the project purpose and target audience
2. Walk through the tech stack and why each technology was chosen

### Part 2: Frontend Demo
1. Show the Kanban board view with sample tasks
2. Switch to List view and demonstrate sorting
3. Navigate to the Dashboard and show statistics charts
4. Create a new task using the modal form
5. Edit a task and change its status
6. Delete a task
7. Use search and filters
8. Open a task detail and add a comment

### Part 3: Backend Explanation
1. Walk through the Express server architecture
2. Explain the REST API endpoints
3. Show input validation
4. Demonstrate the API using curl or browser

### Part 4: Database
1. Explain the schema design (3 tables, indexes)
2. Show the initialization script
3. Discuss the seed data

### Part 5: Design & Challenges
1. Explain the dark theme choice
2. Discuss the monolithic architecture decision
3. Walk through the challenges and solutions

### Part 6: Q&A
- Be prepared to discuss scaling (migrating to PostgreSQL, adding auth)
- Explain why no framework was used (skill demonstration)
- Discuss potential improvements

---

## 🔮 Future Enhancements

- **User Authentication**: JWT-based login system with user-scoped tasks
- **Drag-and-Drop**: Reordering tasks within and across columns
- **Real-time Updates**: WebSocket integration for live collaboration
- **Recurring Tasks**: Support for daily/weekly/monthly recurring tasks
- **Email Notifications**: Reminders for approaching due dates
- **Export/Import**: CSV and JSON import/export functionality
- **Dark/Light Theme Toggle**: User preference persistence
- **Task Tags**: More granular labeling beyond categories

---

## 📄 License

MIT License — Free to use, modify, and distribute.

---

## 👨‍💻 Author

**Mohammed-Abdus-Sami**

Project created for a Full-Stack Web Development Course Demo Session.
