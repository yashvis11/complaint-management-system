from datetime import datetime, timedelta
from flask import Flask, redirect, url_for

from models import db, User, Complaint, ComplaintUpdate
from auth_stub import auth_bp
from admin import admin_bp


def create_app():
    app = Flask(__name__)
    app.config["SECRET_KEY"] = "dev-secret-change-me"
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///complaints.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_bp)

    @app.route("/")
    def index():
        return redirect(url_for("admin.dashboard"))

    with app.app_context():
        db.create_all()
        seed_if_empty()

    return app


def seed_if_empty():
    """Adds a demo admin, a demo user, and a few sample complaints so the
    admin panel has something to show the first time you run it."""
    if User.query.first():
        return

    admin = User(name="Admin User", email="admin@example.com", role="admin")
    admin.set_password("admin123")

    student = User(name="Riya Sharma", email="riya@example.com", role="user")
    student.set_password("user123")

    db.session.add_all([admin, student])
    db.session.commit()

    sample = [
        Complaint(user_id=student.id, title="Water leakage in hostel room",
                  description="Ceiling leaking near window since two days.",
                  category="Maintenance", priority="High", status="Pending",
                  created_at=datetime.utcnow() - timedelta(days=2)),
        Complaint(user_id=student.id, title="Wi-Fi not working in library",
                  description="No internet connectivity on 2nd floor.",
                  category="IT", priority="Medium", status="In Progress",
                  created_at=datetime.utcnow() - timedelta(days=1)),
        Complaint(user_id=student.id, title="Mess food quality complaint",
                  description="Food quality has dropped over the last week.",
                  category="Mess", priority="Low", status="Resolved",
                  created_at=datetime.utcnow() - timedelta(days=5)),
    ]
    db.session.add_all(sample)
    db.session.commit()


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
