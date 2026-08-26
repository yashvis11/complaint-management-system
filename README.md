# ComplaintDesk — Complaint Management System

A full-stack complaint management system with role-based access, a live dashboard with charts, file attachments, in-app notifications, CSV/PDF reporting, dark mode, and a fully Dockerized deployment.

Built with **Flask + SQLite + Bootstrap 5**.

![Status](https://img.shields.io/badge/status-working-brightgreen) ![Python](https://img.shields.io/badge/python-3.12-blue) ![License](https://img.shields.io/badge/license-MIT-lightgrey)

---

## ✨ Features

### Authentication & User Management
- Registration and login/logout with session-based auth
- Passwords hashed with Werkzeug (PBKDF2-SHA256) — never stored in plaintext
- Role-based access control (`user` / `admin`)
- Editable profile page with a personal stats summary

### Complaint Management
- Create, edit (only while `Pending`), delete, and view complaints
- Category + priority (Low/Medium/High) tagging
- **File/image attachments** (png, jpg, jpeg, gif, pdf, docx, txt — up to 8 MB), access-controlled per user
- Full status **history/audit trail** per complaint

### Admin Panel
- View all complaints system-wide
- Search by keyword, filter by status, category, and priority
- Change status (Pending → In Progress → Resolved/Rejected) with a remark on every change
- **Assign complaints** to a specific admin
- CSV and **PDF report export**

### Dashboard & Reports
- Live stat cards (total, pending, in progress, resolved, rejected)
- Interactive charts (status breakdown + complaints by category) via Chart.js
- Admin-only insight cards: open high-priority complaints, unassigned open complaints
- **Pagination** on the complaints list (8 per page)
- **Dark mode** toggle, persisted per-browser

### Notifications
- In-app notification bell with unread badge
- Users are notified when their complaint's status changes
- Admins are notified when a new complaint comes in

### Containerization
- `Dockerfile` (Gunicorn-based production server)
- `docker-compose.yml` with a persistent named volume for the SQLite DB + uploaded files, plus a healthcheck

---

## 🧱 Tech Stack

| Layer            | Technology                                    |
|-------------------|------------------------------------------------|
| Frontend          | HTML5, CSS3 (custom design system + dark mode), Bootstrap 5, Chart.js, vanilla JS |
| Backend            | Python 3 / Flask                               |
| Database           | SQLite                                         |
| Auth               | Flask sessions + Werkzeug password hashing     |
| Reports            | `csv` (built-in) + ReportLab (PDF)             |
| Containerization   | Docker, Docker Compose                         |
| WSGI server (prod) | Gunicorn                                       |

---

## 📁 Project Structure

```
complaint-management-system/
├── app.py                     # Flask app: routes, models, business logic
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── .gitignore
├── static/
│   └── css/style.css          # Design system (light + dark theme via CSS variables)
└── templates/
    ├── base.html              # Shared layout, navbar, notification bell, theme toggle
    ├── landing.html           # Marketing landing page (logged-out visitors)
    ├── login.html
    ├── register.html
    ├── profile.html
    ├── dashboard.html         # Stats + Chart.js graphs
    ├── complaints_list.html   # Search / filter / pagination
    ├── complaint_form.html    # Create / edit, with file upload
    ├── complaint_detail.html  # History, attachment, admin status/assignment form
    └── 404.html
```

---

## 🗄️ Database Schema

**users**
| column | type | notes |
|---|---|---|
| id | INTEGER PK | |
| name | TEXT | |
| email | TEXT | unique |
| password | TEXT | hashed |
| role | TEXT | `user` or `admin` |
| created_at | TEXT | ISO 8601 |

**complaints**
| column | type | notes |
|---|---|---|
| id | INTEGER PK | |
| user_id | INTEGER FK → users.id | |
| title | TEXT | |
| description | TEXT | |
| category | TEXT | |
| priority | TEXT | Low / Medium / High |
| status | TEXT | Pending / In Progress / Resolved / Rejected |
| attachment | TEXT | stored filename, nullable |
| assigned_to | INTEGER FK → users.id | nullable, admin only |
| created_at | TEXT | |
| updated_at | TEXT | |

**complaint_updates**
| column | type | notes |
|---|---|---|
| id | INTEGER PK | |
| complaint_id | INTEGER FK → complaints.id | |
| updated_by | INTEGER FK → users.id | |
| status | TEXT | status at time of update |
| remarks | TEXT | admin remark, nullable |
| updated_at | TEXT | |

**notifications**
| column | type | notes |
|---|---|---|
| id | INTEGER PK | |
| user_id | INTEGER FK → users.id | |
| message | TEXT | |
| link | TEXT | nullable |
| is_read | INTEGER | 0/1 |
| created_at | TEXT | |

All tables (and a lightweight column migration for `attachment`/`assigned_to`) are created automatically on first run — no manual migration step needed.

---

## 🚀 Getting Started

### Option 1 — Docker (recommended)

Requires Docker + Docker Compose.

```bash
git clone <your-repo-url>
cd complaint-management-system
docker compose up --build
```

App: **http://localhost:5000**

```bash
docker compose down          # stop
docker compose down -v       # stop and wipe the database/uploads volume
```

### Option 2 — Local Python

Requires Python 3.10+.

```bash
git clone <your-repo-url>
cd complaint-management-system

python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install -r requirements.txt
python app.py
```

App: **http://localhost:5000** (SQLite DB auto-created at `data/complaints.db`)

Production-style run (no debug/auto-reload):
```bash
gunicorn --bind 0.0.0.0:5000 --workers 3 app:app
```

### Default Admin Account

- **Email:** `admin@example.com`
- **Password:** `admin123`

Change this immediately after first login (via Profile) if deploying anywhere beyond local testing.

### Configuration

| Variable        | Default                          | Purpose                          |
|------------------|-----------------------------------|-----------------------------------|
| `SECRET_KEY`     | `dev-secret-key-change-in-production` | Flask session signing key   |
| `DATABASE_PATH`  | `data/complaints.db`             | Path to the SQLite database file |
| `UPLOAD_FOLDER`  | `data/uploads`                   | Path where attachments are stored |

---

## 🔧 GitHub Repository Setup

```bash
cd complaint-management-system
git init
git add .
git commit -m "Initial commit: Complaint Management System"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

`.gitignore` already excludes `__pycache__/`, the local `data/` directory (DB + uploads), virtual envs, and IDE files, so the repo stays clean.

Suggested repo hygiene:
- Add a branch per feature (`feature/dashboard-charts`, `feature/pdf-export`, etc.) if working with a team, then merge via pull request.
- Tag releases (`git tag v1.0.0`) once the app is stable.
- Add a `LICENSE` file (MIT suggested) if this will be public.

---

## 🧪 Testing

Manual functional test coverage performed during development (all passing):

| Area | Test | Result |
|---|---|---|
| Auth | Register with duplicate email / short password / mismatched passwords | Rejected with flash message ✅ |
| Auth | Login with wrong credentials | Rejected ✅ |
| Auth | Password stored hashed, never plaintext | Verified in DB ✅ |
| Complaints | Create complaint with and without a file attachment | Both succeed ✅ |
| Complaints | Edit blocked once status leaves `Pending` | Verified ✅ |
| Complaints | Delete removes complaint + its update history + attachment file | Verified ✅ |
| Access control | Non-admin blocked from `/admin/*` routes | 302 redirect + flash ✅ |
| Access control | User cannot view/edit another user's complaint | Verified ✅ |
| Access control | Attachment download restricted to owner + admin (403 for others) | Verified ✅ |
| Admin | Status transitions logged in `complaint_updates` with remarks | Verified ✅ |
| Admin | Complaint assignment to an admin, shown on list + detail | Verified ✅ |
| Notifications | Owner notified on status change; admins notified on new complaint | Verified ✅ |
| Reports | CSV export produces correct rows/columns | Verified ✅ |
| Reports | PDF export produces a valid, well-formed PDF | Verified ✅ |
| Dashboard | Search / filter by status, category, priority | Verified ✅ |
| Dashboard | Pagination across multiple pages | Verified ✅ |
| UI | Dark mode toggle persists across reloads (localStorage) | Verified ✅ |

To re-run the smoke tests locally, start the app and exercise the routes with `curl` (see `docs/manual-test-notes.md` if you add one), or write `pytest` + Flask test-client cases against `app.py`'s routes for CI.

---

## 🗺️ API / Route Overview

| Method | Route | Access | Purpose |
|---|---|---|---|
| GET | `/` | Public | Landing page (or redirect to dashboard if logged in) |
| GET/POST | `/register` | Public | Create account |
| GET/POST | `/login` | Public | Log in |
| GET | `/logout` | Auth | Log out |
| GET/POST | `/profile` | Auth | View/edit profile |
| GET | `/dashboard` | Auth | Stats + charts |
| GET | `/complaints` | Auth | List (search/filter/paginate) |
| GET/POST | `/complaints/new` | Auth | Create complaint |
| GET | `/complaints/<id>` | Auth (owner/admin) | View detail + history |
| GET/POST | `/complaints/<id>/edit` | Auth (owner, status=Pending) | Edit complaint |
| POST | `/complaints/<id>/delete` | Auth (owner/admin) | Delete complaint |
| GET | `/uploads/<filename>` | Auth (owner/admin) | Download attachment |
| POST | `/admin/complaints/<id>/update` | Admin | Change status/assignment/remark |
| GET | `/export/csv` | Admin | Download CSV report |
| GET | `/export/pdf` | Admin | Download PDF report |
| POST | `/notifications/mark-all-read` | Auth | Mark all notifications read |
| GET | `/notifications/<id>/open` | Auth | Open + mark one notification read |

---

## 📌 Extending This Project

Still-open ideas from the original spec:
- Real email delivery on status change (wire up `Flask-Mail` with SMTP env vars)
- Bulk actions in the admin panel (multi-select status change)
- Per-admin "My Assigned Complaints" view
- Rate limiting on login/register

## License

MIT — provided as-is for educational purposes.
