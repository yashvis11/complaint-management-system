const db = require("../config/db");

const {
  sendAssignmentNotification,
  sendStaffVerificationEmail,
} = require("../utils/emailService");

// Must match the values stored in your complaints table
const STATUSES = ["Pending", "In Progress", "Resolved", "Rejected"];
const PRIORITIES = ["Low", "Medium", "High"];

function serverError(res, error, message) {
  console.error(message, error);
  res.status(500).json({
    success: false,
    message,
  });
}

// ---------- Dashboard statistics ----------
exports.getStats = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT status, COUNT(*) AS count FROM complaints GROUP BY status",
    );

    const stats = { total: 0 };

    STATUSES.forEach((status) => {
      stats[status] = 0;
    });

    rows.forEach((row) => {
      stats[row.status] = Number(row.count);
      stats.total += Number(row.count);
    });

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    serverError(res, error, "Failed to load statistics");
  }
};

// ---------- All complaints ----------
exports.getComplaints = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.id, c.title, c.category, c.priority,
                    c.status, c.created_at,
                    u.name AS user_name
             FROM complaints c
             JOIN users u ON u.id = c.user_id
             ORDER BY c.created_at DESC`,
    );

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    serverError(res, error, "Failed to load complaints");
  }
};

// ---------- One complaint details ----------
exports.getComplaint = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.*, u.name AS user_name,
                    u.email AS user_email,
                    a.name AS assigned_name
             FROM complaints c
             JOIN users u ON u.id = c.user_id
             LEFT JOIN users a ON a.id = c.assigned_to
             WHERE c.id = ?`,
      [req.params.id],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    res.json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    serverError(res, error, "Failed to load complaint");
  }
};

// ---------- Approved staff available for assignment ----------
exports.getStaff = async (req, res) => {
  try {
    const [staff] = await db.query(
      `SELECT id, name, department
             FROM users
             WHERE role = 'staff'
             AND is_verified = 1
             ORDER BY name`,
    );

    res.json({
      success: true,
      data: staff,
    });
  } catch (error) {
    serverError(res, error, "Failed to fetch staff");
  }
};

// ---------- Update complaint status / priority / assignment ----------
exports.updateComplaint = async (req, res) => {
  try {
    const { status, priority, assigned_to } = req.body;

    const fields = [];
    const values = [];

    if (status !== undefined) {
      if (!STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status",
        });
      }

      fields.push("status = ?");
      values.push(status);
    }

    if (priority !== undefined) {
      if (!PRIORITIES.includes(priority)) {
        return res.status(400).json({
          success: false,
          message: "Invalid priority",
        });
      }

      fields.push("priority = ?");
      values.push(priority);
    }

    if (assigned_to !== undefined) {
      if (assigned_to !== null) {
        const [staff] = await db.query(
          `SELECT id FROM users
                     WHERE id = ?
                     AND role = 'staff'
                     AND is_verified = 1`,
          [assigned_to],
        );

        if (staff.length === 0) {
          return res.status(400).json({
            success: false,
            message: "Assignee must be an approved staff member",
          });
        }
      }

      fields.push("assigned_to = ?");
      values.push(assigned_to);
    }

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Nothing to update",
      });
    }

    // Check complaint and get its previous assignment
    const [existingComplaints] = await db.query(
      "SELECT assigned_to FROM complaints WHERE id = ?",
      [req.params.id],
    );

    if (existingComplaints.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    const oldAssignedTo = existingComplaints[0].assigned_to;

    // Update complaint
    await db.query(
      `UPDATE complaints
             SET ${fields.join(", ")}
             WHERE id = ?`,
      [...values, req.params.id],
    );

    // Send email only when a new staff member is assigned
    if (
      assigned_to !== undefined &&
      assigned_to !== null &&
      Number(assigned_to) !== Number(oldAssignedTo)
    ) {
      try {
        const [complaints] = await db.query(
          `SELECT c.id, c.title, c.category, c.priority,
                            u.name AS user_name,
                            u.email AS user_email
                     FROM complaints c
                     JOIN users u ON u.id = c.user_id
                     WHERE c.id = ?`,
          [req.params.id],
        );

        const [staffRecords] = await db.query(
          `SELECT name, department
                     FROM users
                     WHERE id = ?
                     AND role = 'staff'
                     AND is_verified = 1`,
          [assigned_to],
        );

        if (complaints.length > 0 && staffRecords.length > 0) {
          const complaint = complaints[0];

          await sendAssignmentNotification(
            {
              id: complaint.id,
              title: complaint.title,
              category: complaint.category,
              priority: complaint.priority,
            },
            {
              name: complaint.user_name,
              email: complaint.user_email,
            },
            staffRecords[0],
          );

          console.log("Assignment notification email sent");
        }
      } catch (emailError) {
        console.error("Assignment email failed:", emailError);
      }
    }

    res.json({
      success: true,
      message: "Complaint updated successfully",
    });
  } catch (error) {
    serverError(res, error, "Failed to update complaint");
  }
};

// ---------- Get pending staff registrations ----------
exports.getPendingStaff = async (req, res) => {
  try {
    const [staff] = await db.query(
      `SELECT id, name, email, department, created_at
             FROM users
             WHERE role = 'staff'
             AND is_verified = 0
             ORDER BY created_at DESC`,
    );

    res.json({
      success: true,
      data: staff,
    });
  } catch (error) {
    serverError(res, error, "Failed to fetch pending staff");
  }
};

// ---------- Approve or reject staff registration ----------
exports.verifyStaff = async (req, res) => {
  try {
    const staffId = req.params.id;
    const { action } = req.body;

    if (action !== "Approved" && action !== "Rejected") {
      return res.status(400).json({
        success: false,
        message: "Invalid verification action",
      });
    }

    const [staff] = await db.query(
      `SELECT id, name, email, role, is_verified
             FROM users
             WHERE id = ?`,
      [staffId],
    );

    if (staff.length === 0 || staff[0].role !== "staff") {
      return res.status(404).json({
        success: false,
        message: "Staff account not found",
      });
    }

    if (Number(staff[0].is_verified) === 1) {
      return res.status(400).json({
        success: false,
        message: "Staff account is already approved",
      });
    }

    if (action === "Approved") {
      await db.query("UPDATE users SET is_verified = 1 WHERE id = ?", [
        staffId,
      ]);
    }

    // Send approval or rejection email
    try {
      await sendStaffVerificationEmail(staff[0], action);
    } catch (emailError) {
      console.error("Staff verification email failed:", emailError);
    }

    res.json({
      success: true,
      message:
        action === "Approved"
          ? "Staff account approved successfully"
          : "Staff registration rejected",
    });
  } catch (error) {
    serverError(res, error, "Failed to verify staff");
  }
};
