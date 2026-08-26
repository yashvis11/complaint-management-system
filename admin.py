from datetime import datetime
from flask import Blueprint, render_template, request, redirect, url_for, flash
from sqlalchemy import or_

from models import db, Complaint, ComplaintUpdate, User, VALID_STATUSES
from auth_stub import admin_required, current_user

admin_bp = Blueprint("admin", __name__, url_prefix="/admin")


# ---------------------------------------------------------------------------
# Dashboard (basic counts — Member 4 builds the full charts/reports version)
# ---------------------------------------------------------------------------
@admin_bp.route("/dashboard")
@admin_required
def dashboard():
    stats = {
        status: Complaint.query.filter_by(status=status).count()
        for status in VALID_STATUSES
    }
    stats["Total"] = Complaint.query.count()
    recent = Complaint.query.order_by(Complaint.created_at.desc()).limit(5).all()
    return render_template("admin/dashboard.html", stats=stats, recent=recent)


# ---------------------------------------------------------------------------
# View all complaints + search & filter
# ---------------------------------------------------------------------------
@admin_bp.route("/complaints")
@admin_required
def list_complaints():
    query = Complaint.query

    status = request.args.get("status", "").strip()
    category = request.args.get("category", "").strip()
    priority = request.args.get("priority", "").strip()
    search = request.args.get("q", "").strip()

    if status:
        query = query.filter(Complaint.status == status)
    if category:
        query = query.filter(Complaint.category == category)
    if priority:
        query = query.filter(Complaint.priority == priority)
    if search:
        like = f"%{search}%"
        query = query.filter(or_(Complaint.title.ilike(like),
                                  Complaint.description.ilike(like)))

    page = request.args.get("page", 1, type=int)
    per_page = 10
    pagination = query.order_by(Complaint.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    categories = [c[0] for c in db.session.query(Complaint.category).distinct()]
    admins = User.query.filter_by(role="admin").all()

    return render_template(
        "admin/complaints.html",
        complaints=pagination.items,
        pagination=pagination,
        statuses=VALID_STATUSES,
        categories=categories,
        admins=admins,
        filters={"status": status, "category": category, "priority": priority, "q": search},
    )


# ---------------------------------------------------------------------------
# Complaint detail + history
# ---------------------------------------------------------------------------
@admin_bp.route("/complaints/<int:complaint_id>")
@admin_required
def complaint_detail(complaint_id):
    complaint = Complaint.query.get_or_404(complaint_id)
    admins = User.query.filter_by(role="admin").all()
    return render_template(
        "admin/complaint_detail.html",
        complaint=complaint,
        statuses=VALID_STATUSES,
        admins=admins,
    )


# ---------------------------------------------------------------------------
# Change status + add admin remarks (writes a ComplaintUpdate history row)
# ---------------------------------------------------------------------------
@admin_bp.route("/complaints/<int:complaint_id>/status", methods=["POST"])
@admin_required
def update_status(complaint_id):
    complaint = Complaint.query.get_or_404(complaint_id)
    new_status = request.form.get("status")
    remarks = request.form.get("remarks", "").strip()

    if new_status not in VALID_STATUSES:
        flash("Invalid status.", "danger")
        return redirect(url_for("admin.complaint_detail", complaint_id=complaint_id))

    complaint.status = new_status
    complaint.updated_at = datetime.utcnow()

    update = ComplaintUpdate(
        complaint_id=complaint.id,
        updated_by=current_user().id,
        status=new_status,
        remarks=remarks or None,
    )
    db.session.add(update)
    db.session.commit()

    flash(f"Complaint #{complaint.id} marked as '{new_status}'.", "success")
    return redirect(url_for("admin.complaint_detail", complaint_id=complaint_id))


# ---------------------------------------------------------------------------
# Assign complaint to an admin (optional, per spec)
# ---------------------------------------------------------------------------
@admin_bp.route("/complaints/<int:complaint_id>/assign", methods=["POST"])
@admin_required
def assign_complaint(complaint_id):
    complaint = Complaint.query.get_or_404(complaint_id)
    assignee_id = request.form.get("assigned_to")

    complaint.assigned_to = int(assignee_id) if assignee_id else None
    db.session.commit()

    flash(f"Complaint #{complaint.id} assignment updated.", "success")
    return redirect(url_for("admin.complaint_detail", complaint_id=complaint_id))
