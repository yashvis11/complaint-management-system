# Complaint Management System — Member 3: Admin Panel & Status Tracking

This is a **standalone, runnable** implementation of Member 3's scope from the team plan:
- View all complaints
- Search & filter complaints (by status, category, priority, keyword)
- Change complaint status (Pending / In Progress / Resolved / Rejected)
- Add admin remarks on each status change (stored as history)
- Assign complaints to an admin (optional feature — included)
- Basic dashboard with counts by status

## Why it includes a login page
Member 1 owns real authentication. To let you *run and demo* the admin
panel before the team merges pieces, this repo ships a minimal
`auth_stub.py` — plain session login, no registration UI, one seeded
admin and one seeded user. **Delete `auth_stub.py` and swap in Member 1's
real auth module when you integrate** — `admin.py` only depends on two
things from it: the `admin_required` decorator and `current_user()`.
Keep those two names (or update the one import line in `admin.py`) and
integration is a five-minute job.

## How to run it

```bash
cd complaint-mgmt-member3
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Open http://127.0.0.1:5000 — it redirects to login.

**Demo admin login:** `admin@example.com` / `admin123`
**Demo user (not admin):** `riya@example.com` / `user123`

A SQLite file `complaints.db` is created automatically on first run,
seeded with 3 sample complaints so the panel isn't empty.

## Project structure

```
complaint-mgmt-member3/
├── app.py               # App factory, DB init, seed data
├── models.py            # User, Complaint, ComplaintUpdate (SQLAlchemy)
├── admin.py              <- YOUR CORE DELIVERABLE (admin routes)
├── auth_stub.py          <- TEMPORARY, replace with Member 1's auth
├── requirements.txt
├── templates/
│   ├── base.html
│   ├── auth/login.html
│   └── admin/
│       ├── dashboard.html
│       ├── complaints.html
│       └── complaint_detail.html
└── static/css/style.css
```

## Routes (admin.py)

| Method | Route                                    | Purpose                          |
|--------|-------------------------------------------|-----------------------------------|
| GET    | /admin/dashboard                          | Status counts + recent complaints |
| GET    | /admin/complaints                         | List all, with `?status=&category=&priority=&q=&page=` |
| GET    | /admin/complaints/<id>                    | Full detail + status history      |
| POST   | /admin/complaints/<id>/status             | Change status + optional remarks  |
| POST   | /admin/complaints/<id>/assign             | Assign to an admin (optional)     |

## Integrating with the rest of the team

- **Member 1 (Auth):** replace `auth_stub.py` with the real registration/
  login/role system. Keep the `Users` table schema compatible (it already
  matches the shared schema: `id, name, email, password, role, created_at`).
- **Member 2 (Complaints):** their create/edit/delete routes write to the
  same `Complaint` model here — no schema changes needed. Users should only
  be able to edit a complaint while it's `Pending` (enforce that on their
  side; the admin panel doesn't restrict status changes since admins can
  move a complaint through any state).
- **Member 4 (Dashboard/Reports/Docker):** the `/admin/dashboard` route
  here is intentionally minimal (just counts) — Member 4's dashboard can
  extend or replace it with charts/CSV export. The Dockerfile should just
  `pip install -r requirements.txt` and run `python app.py` (switch to
  `flask run --host=0.0.0.0` or gunicorn for the container).

## Notes / things you may be asked in a viva or demo
- Status changes are tracked in `ComplaintUpdate` — a full audit history,
  not just an overwritten `status` field, so "who changed what and when"
  is always answerable.
- Search uses SQL `LIKE` (via SQLAlchemy `ilike`) across title + description.
- Pagination is server-side (10 per page) via `Flask-SQLAlchemy`'s
  `.paginate()`.
- Passwords are hashed with Werkzeug's `generate_password_hash` (never
  stored in plain text) — same approach Member 1 should use.
