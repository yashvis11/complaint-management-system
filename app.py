import os
import csv
import io
import sqlite3
from datetime import datetime, timezone
from functools import wraps

from flask import (
    Flask, render_template, request, redirect, url_for,
    session, flash, g, Response, send_from_directory, abort
)
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')

BASE_DIR = os.path.dirname(__file__)
DATABASE = os.environ.get('DATABASE_PATH', os.path.join(BASE_DIR, 'data', 'complaints.db'))
UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', os.path.join(BASE_DIR, 'data', 'uploads'))
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf', 'docx', 'txt'}

app.config['MAX_CONTENT_LENGTH'] = 8 * 1024 * 1024  # 8 MB upload cap

CATEGORIES = ['Billing', 'Technical', 'Service', 'Product Quality', 'Delivery', 'Other']
PRIORITIES = ['Low', 'Medium', 'High']
STATUSES = ['Pending', 'In Progress', 'Resolved', 'Rejected']
PER_PAGE = 8


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------
def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        os.makedirs(os.path.dirname(DATABASE), exist_ok=True)
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
        db.execute('PRAGMA foreign_keys = ON')
    return db


@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()


def init_db():
    os.makedirs(os.path.dirname(DATABASE), exist_ok=True)
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    db = sqlite3.connect(DATABASE)
    db.executescript('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS complaints (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            category TEXT NOT NULL,
            priority TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Pending',
            attachment TEXT,
            assigned_to INTEGER,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (assigned_to) REFERENCES users (id)
        );

        CREATE TABLE IF NOT EXISTS complaint_updates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            complaint_id INTEGER NOT NULL,
            updated_by INTEGER NOT NULL,
            status TEXT NOT NULL,
            remarks TEXT,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (complaint_id) REFERENCES complaints (id) ON DELETE CASCADE,
            FOREIGN KEY (updated_by) REFERENCES users (id)
        );

        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            message TEXT NOT NULL,
            link TEXT,
            is_read INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        );
    ''')

    # Lightweight migration for databases created by an earlier version of the app
    existing_cols = {row[1] for row in db.execute('PRAGMA table_info(complaints)').fetchall()}
    if 'attachment' not in existing_cols:
        db.execute('ALTER TABLE complaints ADD COLUMN attachment TEXT')
    if 'assigned_to' not in existing_cols:
        db.execute('ALTER TABLE complaints ADD COLUMN assigned_to INTEGER')

    # Seed a default admin account if none exists yet
    existing_admin = db.execute('SELECT id FROM users WHERE role = ?', ('admin',)).fetchone()
    if not existing_admin:
        db.execute(
            'INSERT INTO users (name, email, password, role, created_at) VALUES (?,?,?,?,?)',
            ('Admin', 'admin@example.com', generate_password_hash('admin123'), 'admin', now_iso())
        )
    db.commit()
    db.close()


def add_notification(db, user_id, message, link=None):
    db.execute(
        'INSERT INTO notifications (user_id, message, link, is_read, created_at) VALUES (?,?,?,0,?)',
        (user_id, message, link, now_iso())
    )


def notify_all_admins(db, message, link=None, exclude_user_id=None):
    admins = db.execute('SELECT id FROM users WHERE role = ?', ('admin',)).fetchall()
    for a in admins:
        if a['id'] != exclude_user_id:
            add_notification(db, a['id'], message, link)


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------
def login_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please log in to continue.', 'warning')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return wrapper


def admin_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if session.get('role') != 'admin':
            flash('Admin access required.', 'danger')
            return redirect(url_for('dashboard'))
        return f(*args, **kwargs)
    return wrapper


def current_user():
    if 'user_id' in session:
        db = get_db()
        return db.execute('SELECT * FROM users WHERE id = ?', (session['user_id'],)).fetchone()
    return None


@app.context_processor
def inject_globals():
    user = current_user()
    notifications = []
    unread_count = 0
    if user:
        db = get_db()
        notifications = db.execute(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 8',
            (user['id'],)
        ).fetchall()
        unread_count = db.execute(
            'SELECT COUNT(*) c FROM notifications WHERE user_id = ? AND is_read = 0', (user['id'],)
        ).fetchone()['c']
    return dict(
        current_user=user, CATEGORIES=CATEGORIES, PRIORITIES=PRIORITIES, STATUSES=STATUSES,
        notifications=notifications, unread_count=unread_count
    )


# ---------------------------------------------------------------------------
# Landing / auth routes
# ---------------------------------------------------------------------------
@app.route('/')
def index():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return render_template('landing.html')


@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        email = request.form.get('email', '').strip().lower()
        password = request.form.get('password', '')
        confirm = request.form.get('confirm_password', '')

        if not name or not email or not password:
            flash('All fields are required.', 'danger')
            return redirect(url_for('register'))
        if password != confirm:
            flash('Passwords do not match.', 'danger')
            return redirect(url_for('register'))
        if len(password) < 6:
            flash('Password must be at least 6 characters long.', 'danger')
            return redirect(url_for('register'))

        db = get_db()
        if db.execute('SELECT id FROM users WHERE email = ?', (email,)).fetchone():
            flash('That email is already registered.', 'danger')
            return redirect(url_for('register'))

        db.execute(
            'INSERT INTO users (name, email, password, role, created_at) VALUES (?,?,?,?,?)',
            (name, email, generate_password_hash(password), 'user', now_iso())
        )
        db.commit()
        flash('Registration successful. Please log in.', 'success')
        return redirect(url_for('login'))

    return render_template('register.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email', '').strip().lower()
        password = request.form.get('password', '')

        db = get_db()
        user = db.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
        if user and check_password_hash(user['password'], password):
            session['user_id'] = user['id']
            session['name'] = user['name']
            session['role'] = user['role']
            flash(f'Welcome back, {user["name"]}!', 'success')
            return redirect(url_for('dashboard'))

        flash('Invalid email or password.', 'danger')
        return redirect(url_for('login'))

    return render_template('login.html')


@app.route('/logout')
def logout():
    session.clear()
    flash('You have been logged out.', 'info')
    return redirect(url_for('login'))


@app.route('/profile', methods=['GET', 'POST'])
@login_required
def profile():
    db = get_db()
    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        new_password = request.form.get('new_password', '').strip()

        if not name:
            flash('Name cannot be empty.', 'danger')
            return redirect(url_for('profile'))

        db.execute('UPDATE users SET name = ? WHERE id = ?', (name, session['user_id']))

        if new_password:
            if len(new_password) < 6:
                flash('New password must be at least 6 characters.', 'danger')
                return redirect(url_for('profile'))
            db.execute('UPDATE users SET password = ? WHERE id = ?',
                       (generate_password_hash(new_password), session['user_id']))

        db.commit()
        session['name'] = name
        flash('Profile updated successfully.', 'success')
        return redirect(url_for('profile'))

    user = db.execute('SELECT * FROM users WHERE id = ?', (session['user_id'],)).fetchone()
    complaint_count = db.execute(
        'SELECT COUNT(*) c FROM complaints WHERE user_id = ?', (session['user_id'],)
    ).fetchone()['c']
    resolved_count = db.execute(
        "SELECT COUNT(*) c FROM complaints WHERE user_id = ? AND status = 'Resolved'", (session['user_id'],)
    ).fetchone()['c']
    return render_template('profile.html', user=user, complaint_count=complaint_count, resolved_count=resolved_count)


# ---------------------------------------------------------------------------
# Notifications
# ---------------------------------------------------------------------------
@app.route('/notifications/mark-all-read', methods=['POST'])
@login_required
def mark_all_read():
    db = get_db()
    db.execute('UPDATE notifications SET is_read = 1 WHERE user_id = ?', (session['user_id'],))
    db.commit()
    return redirect(request.referrer or url_for('dashboard'))


@app.route('/notifications/<int:nid>/open')
@login_required
def open_notification(nid):
    db = get_db()
    notif = db.execute('SELECT * FROM notifications WHERE id = ? AND user_id = ?',
                        (nid, session['user_id'])).fetchone()
    if notif:
        db.execute('UPDATE notifications SET is_read = 1 WHERE id = ?', (nid,))
        db.commit()
        if notif['link']:
            return redirect(notif['link'])
    return redirect(url_for('dashboard'))


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------
@app.route('/dashboard')
@login_required
def dashboard():
    db = get_db()
    is_admin = session['role'] == 'admin'

    base_where = '' if is_admin else 'WHERE user_id = ?'
    params = () if is_admin else (session['user_id'],)

    stats = {}
    stats['total'] = db.execute(f'SELECT COUNT(*) c FROM complaints {base_where}', params).fetchone()['c']
    for status in STATUSES:
        clause = "WHERE status = ?" if is_admin else "WHERE status = ? AND user_id = ?"
        p = (status,) if is_admin else (status, session['user_id'])
        stats[status] = db.execute(f'SELECT COUNT(*) c FROM complaints {clause}', p).fetchone()['c']

    cat_query = f'SELECT category, COUNT(*) c FROM complaints {base_where} GROUP BY category'
    by_category = db.execute(cat_query, params).fetchall()

    if is_admin:
        recent = db.execute('''
            SELECT complaints.*, users.name as user_name FROM complaints
            JOIN users ON complaints.user_id = users.id
            ORDER BY complaints.created_at DESC LIMIT 6
        ''').fetchall()
        unassigned = db.execute(
            "SELECT COUNT(*) c FROM complaints WHERE assigned_to IS NULL AND status NOT IN ('Resolved','Rejected')"
        ).fetchone()['c']
        high_priority_open = db.execute(
            "SELECT COUNT(*) c FROM complaints WHERE priority = 'High' AND status IN ('Pending','In Progress')"
        ).fetchone()['c']
    else:
        recent = db.execute(
            'SELECT * FROM complaints WHERE user_id = ? ORDER BY created_at DESC LIMIT 6',
            (session['user_id'],)
        ).fetchall()
        unassigned = None
        high_priority_open = None

    return render_template('dashboard.html', stats=stats, by_category=by_category, recent=recent,
                            is_admin=is_admin, unassigned=unassigned, high_priority_open=high_priority_open)


# ---------------------------------------------------------------------------
# Complaints
# ---------------------------------------------------------------------------
@app.route('/complaints')
@login_required
def complaints_list():
    db = get_db()
    search = request.args.get('search', '').strip()
    status_filter = request.args.get('status', '')
    category_filter = request.args.get('category', '')
    priority_filter = request.args.get('priority', '')
    page = max(1, request.args.get('page', 1, type=int))

    where = ['1=1']
    params = []

    if session['role'] != 'admin':
        where.append('complaints.user_id = ?')
        params.append(session['user_id'])

    if search:
        where.append('(complaints.title LIKE ? OR complaints.description LIKE ?)')
        params += [f'%{search}%', f'%{search}%']

    if status_filter:
        where.append('complaints.status = ?')
        params.append(status_filter)

    if category_filter:
        where.append('complaints.category = ?')
        params.append(category_filter)

    if priority_filter:
        where.append('complaints.priority = ?')
        params.append(priority_filter)

    where_clause = ' AND '.join(where)

    total = db.execute(
        f'SELECT COUNT(*) c FROM complaints JOIN users ON complaints.user_id = users.id WHERE {where_clause}',
        params
    ).fetchone()['c']
    total_pages = max(1, (total + PER_PAGE - 1) // PER_PAGE)
    page = min(page, total_pages)
    offset = (page - 1) * PER_PAGE

    complaints = db.execute(f'''
        SELECT complaints.*, users.name as user_name, admins.name as assignee_name
        FROM complaints
        JOIN users ON complaints.user_id = users.id
        LEFT JOIN users admins ON complaints.assigned_to = admins.id
        WHERE {where_clause}
        ORDER BY complaints.created_at DESC
        LIMIT ? OFFSET ?
    ''', params + [PER_PAGE, offset]).fetchall()

    return render_template(
        'complaints_list.html',
        complaints=complaints,
        search=search,
        status_filter=status_filter,
        category_filter=category_filter,
        priority_filter=priority_filter,
        is_admin=session['role'] == 'admin',
        page=page,
        total_pages=total_pages,
        total=total
    )


@app.route('/complaints/new', methods=['GET', 'POST'])
@login_required
def complaint_new():
    if request.method == 'POST':
        title = request.form.get('title', '').strip()
        description = request.form.get('description', '').strip()
        category = request.form.get('category', CATEGORIES[0])
        priority = request.form.get('priority', 'Medium')

        if not title or not description:
            flash('Title and description are required.', 'danger')
            return redirect(url_for('complaint_new'))

        attachment_name = None
        file = request.files.get('attachment')
        if file and file.filename:
            if not allowed_file(file.filename):
                flash('Unsupported file type. Allowed: png, jpg, jpeg, gif, pdf, docx, txt.', 'danger')
                return redirect(url_for('complaint_new'))
            os.makedirs(UPLOAD_FOLDER, exist_ok=True)
            safe_name = secure_filename(file.filename)
            attachment_name = f"{int(datetime.now(timezone.utc).timestamp())}_{safe_name}"
            file.save(os.path.join(UPLOAD_FOLDER, attachment_name))

        db = get_db()
        now = now_iso()
        cur = db.execute('''
            INSERT INTO complaints (user_id, title, description, category, priority, status, attachment, created_at, updated_at)
            VALUES (?,?,?,?,?,?,?,?,?)
        ''', (session['user_id'], title, description, category, priority, 'Pending', attachment_name, now, now))
        new_id = cur.lastrowid
        notify_all_admins(db, f'New complaint #{new_id}: "{title}" was submitted by {session["name"]}.',
                           link=url_for('complaint_detail', cid=new_id))
        db.commit()
        flash('Complaint submitted successfully.', 'success')
        return redirect(url_for('complaints_list'))

    return render_template('complaint_form.html', complaint=None)


@app.route('/complaints/<int:cid>')
@login_required
def complaint_detail(cid):
    db = get_db()
    complaint = db.execute('''
        SELECT complaints.*, users.name as user_name, users.email as user_email, admins.name as assignee_name
        FROM complaints
        JOIN users ON complaints.user_id = users.id
        LEFT JOIN users admins ON complaints.assigned_to = admins.id
        WHERE complaints.id = ?
    ''', (cid,)).fetchone()

    if not complaint:
        flash('Complaint not found.', 'danger')
        return redirect(url_for('complaints_list'))

    if session['role'] != 'admin' and complaint['user_id'] != session['user_id']:
        flash('Access denied.', 'danger')
        return redirect(url_for('complaints_list'))

    updates = db.execute('''
        SELECT complaint_updates.*, users.name as admin_name FROM complaint_updates
        JOIN users ON complaint_updates.updated_by = users.id
        WHERE complaint_id = ? ORDER BY updated_at DESC
    ''', (cid,)).fetchall()

    admins = db.execute("SELECT id, name FROM users WHERE role = 'admin' ORDER BY name").fetchall()

    return render_template('complaint_detail.html', complaint=complaint, updates=updates,
                            is_admin=session['role'] == 'admin', admins=admins)


@app.route('/complaints/<int:cid>/edit', methods=['GET', 'POST'])
@login_required
def complaint_edit(cid):
    db = get_db()
    complaint = db.execute('SELECT * FROM complaints WHERE id = ?', (cid,)).fetchone()

    if not complaint:
        flash('Complaint not found.', 'danger')
        return redirect(url_for('complaints_list'))

    if complaint['user_id'] != session['user_id']:
        flash('Access denied.', 'danger')
        return redirect(url_for('complaints_list'))

    if complaint['status'] != 'Pending':
        flash('This complaint can only be edited while its status is Pending.', 'warning')
        return redirect(url_for('complaint_detail', cid=cid))

    if request.method == 'POST':
        title = request.form.get('title', '').strip()
        description = request.form.get('description', '').strip()
        category = request.form.get('category', complaint['category'])
        priority = request.form.get('priority', complaint['priority'])

        if not title or not description:
            flash('Title and description are required.', 'danger')
            return redirect(url_for('complaint_edit', cid=cid))

        attachment_name = complaint['attachment']
        file = request.files.get('attachment')
        if file and file.filename:
            if not allowed_file(file.filename):
                flash('Unsupported file type. Allowed: png, jpg, jpeg, gif, pdf, docx, txt.', 'danger')
                return redirect(url_for('complaint_edit', cid=cid))
            os.makedirs(UPLOAD_FOLDER, exist_ok=True)
            safe_name = secure_filename(file.filename)
            attachment_name = f"{int(datetime.now(timezone.utc).timestamp())}_{safe_name}"
            file.save(os.path.join(UPLOAD_FOLDER, attachment_name))

        db.execute('''
            UPDATE complaints SET title=?, description=?, category=?, priority=?, attachment=?, updated_at=?
            WHERE id=?
        ''', (title, description, category, priority, attachment_name, now_iso(), cid))
        db.commit()
        flash('Complaint updated.', 'success')
        return redirect(url_for('complaint_detail', cid=cid))

    return render_template('complaint_form.html', complaint=complaint)


@app.route('/complaints/<int:cid>/delete', methods=['POST'])
@login_required
def complaint_delete(cid):
    db = get_db()
    complaint = db.execute('SELECT * FROM complaints WHERE id = ?', (cid,)).fetchone()

    if not complaint:
        flash('Complaint not found.', 'danger')
        return redirect(url_for('complaints_list'))

    if complaint['user_id'] != session['user_id'] and session['role'] != 'admin':
        flash('Access denied.', 'danger')
        return redirect(url_for('complaints_list'))

    if complaint['attachment']:
        try:
            os.remove(os.path.join(UPLOAD_FOLDER, complaint['attachment']))
        except OSError:
            pass

    db.execute('DELETE FROM complaint_updates WHERE complaint_id = ?', (cid,))
    db.execute('DELETE FROM complaints WHERE id = ?', (cid,))
    db.commit()
    flash('Complaint deleted.', 'info')
    return redirect(url_for('complaints_list'))


@app.route('/uploads/<path:filename>')
@login_required
def uploaded_file(filename):
    db = get_db()
    complaint = db.execute('SELECT * FROM complaints WHERE attachment = ?', (filename,)).fetchone()
    if not complaint:
        abort(404)
    if session['role'] != 'admin' and complaint['user_id'] != session['user_id']:
        abort(403)
    return send_from_directory(UPLOAD_FOLDER, filename)


# ---------------------------------------------------------------------------
# Admin
# ---------------------------------------------------------------------------
@app.route('/admin/complaints/<int:cid>/update', methods=['POST'])
@login_required
@admin_required
def admin_update_complaint(cid):
    db = get_db()
    complaint = db.execute('SELECT * FROM complaints WHERE id = ?', (cid,)).fetchone()
    if not complaint:
        flash('Complaint not found.', 'danger')
        return redirect(url_for('complaints_list'))

    new_status = request.form.get('status', complaint['status'])
    remarks = request.form.get('remarks', '').strip()
    assigned_to = request.form.get('assigned_to', '').strip()

    if new_status not in STATUSES:
        flash('Invalid status.', 'danger')
        return redirect(url_for('complaint_detail', cid=cid))

    assigned_val = int(assigned_to) if assigned_to else None

    db.execute('UPDATE complaints SET status = ?, assigned_to = ?, updated_at = ? WHERE id = ?',
               (new_status, assigned_val, now_iso(), cid))
    db.execute('''
        INSERT INTO complaint_updates (complaint_id, updated_by, status, remarks, updated_at)
        VALUES (?,?,?,?,?)
    ''', (cid, session['user_id'], new_status, remarks, now_iso()))

    status_changed = new_status != complaint['status']
    if status_changed:
        msg = f'Your complaint #{cid} "{complaint["title"]}" status changed to {new_status}.'
        if remarks:
            msg += f' Remark: {remarks}'
        add_notification(db, complaint['user_id'], msg, link=url_for('complaint_detail', cid=cid))

    db.commit()
    flash('Complaint updated.', 'success')
    return redirect(url_for('complaint_detail', cid=cid))


@app.route('/export/csv')
@login_required
@admin_required
def export_csv():
    db = get_db()
    complaints = db.execute('''
        SELECT complaints.*, users.name as user_name, users.email as user_email
        FROM complaints JOIN users ON complaints.user_id = users.id
        ORDER BY complaints.created_at DESC
    ''').fetchall()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['ID', 'Title', 'Description', 'Category', 'Priority', 'Status',
                      'Submitted By', 'Email', 'Created At', 'Updated At'])
    for c in complaints:
        writer.writerow([c['id'], c['title'], c['description'], c['category'], c['priority'],
                          c['status'], c['user_name'], c['user_email'], c['created_at'], c['updated_at']])

    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={'Content-Disposition': 'attachment; filename=complaints_report.csv'}
    )


@app.route('/export/pdf')
@login_required
@admin_required
def export_pdf():
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import landscape, A4
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.lib.units import cm
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer

    db = get_db()
    complaints = db.execute('''
        SELECT complaints.*, users.name as user_name
        FROM complaints JOIN users ON complaints.user_id = users.id
        ORDER BY complaints.created_at DESC
    ''').fetchall()

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=landscape(A4), topMargin=1.5 * cm, bottomMargin=1.5 * cm)
    styles = getSampleStyleSheet()
    elements = [Paragraph('Complaint Management System - Report', styles['Title']),
                Paragraph(f'Generated: {now_iso()[:19].replace("T", " ")} UTC', styles['Normal']),
                Spacer(1, 0.5 * cm)]

    data = [['ID', 'Title', 'Category', 'Priority', 'Status', 'Submitted By', 'Created']]
    for c in complaints:
        data.append([str(c['id']), c['title'][:40], c['category'], c['priority'], c['status'],
                     c['user_name'], c['created_at'][:10]])

    table = Table(data, repeatRows=1)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4f46e5')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#dddddd')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f4f6f9')]),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(table)
    doc.build(elements)
    buf.seek(0)

    return Response(
        buf.read(),
        mimetype='application/pdf',
        headers={'Content-Disposition': 'attachment; filename=complaints_report.pdf'}
    )


# ---------------------------------------------------------------------------
# Error handlers
# ---------------------------------------------------------------------------
@app.errorhandler(404)
def not_found(e):
    return render_template('404.html'), 404


@app.errorhandler(413)
def too_large(e):
    flash('File is too large. Maximum upload size is 8 MB.', 'danger')
    return redirect(request.referrer or url_for('dashboard'))


# Initialize the database as soon as the module is imported (covers both
# `python app.py` and running under a WSGI server like gunicorn).
init_db()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
