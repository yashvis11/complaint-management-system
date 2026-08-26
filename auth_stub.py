"""
STUB AUTH MODULE — NOT part of Member 3's deliverable.

Member 1 owns real registration/login/role-based access. This file exists
only so the admin panel (Member 3's work) can be run and tested standalone
before the pieces are merged. It provides:
  - /login and /logout
  - a login_required / admin_required decorator
  - session-based current user

Delete or replace this file once Member 1's auth module is merged — just
make sure the admin blueprint keeps importing `admin_required` and
`current_user()` from wherever auth ends up living.
"""
from functools import wraps
from flask import Blueprint, render_template, request, redirect, url_for, session, flash
from models import User

auth_bp = Blueprint("auth", __name__)


def current_user():
    from models import db
    user_id = session.get("user_id")
    if not user_id:
        return None
    return User.query.get(user_id)


def login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if not session.get("user_id"):
            return redirect(url_for("auth.login", next=request.path))
        return view(*args, **kwargs)
    return wrapped


def admin_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        user = current_user()
        if not user:
            return redirect(url_for("auth.login", next=request.path))
        if not user.is_admin():
            flash("Admins only.", "danger")
            return redirect(url_for("auth.login"))
        return view(*args, **kwargs)
    return wrapped


@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        user = User.query.filter_by(email=email).first()
        if user and user.check_password(password):
            session["user_id"] = user.id
            session["role"] = user.role
            next_url = request.args.get("next") or url_for("admin.dashboard")
            return redirect(next_url)
        flash("Invalid email or password.", "danger")
    return render_template("auth/login.html")


@auth_bp.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("auth.login"))
