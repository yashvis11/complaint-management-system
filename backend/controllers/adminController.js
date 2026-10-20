// controllers/adminController.js
const db = require("../config/db");

// Must match the values stored in your complaints table
const STATUSES = ["Pending", "In Progress", "Resolved", "Rejected"];
const PRIORITIES = ["Low", "Medium", "High"];

function serverError(res, error, message) {
  console.error(message, error);
  res.status(500).json({ success: false, message });
}


// ---------- Dashboard statistics ----------
exports.getStats = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT status, COUNT(*) AS count FROM complaints GROUP BY status"
    );

    const stats = { total: 0 };
    STATUSES.forEach((s) => (stats[s] = 0));
    rows.forEach((r) => {
      stats[r.status] = r.count;
      stats.total += r.count;
    });

    res.json({ success: true, data: stats });
  } catch (error) {
    serverError(res, error, "Failed to load statistics");
  }
};


// ---------- All complaints (list) ----------
exports.getComplaints = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.id, c.title, c.category, c.priority, c.status, c.created_at,
              u.name AS user_name
       FROM complaints c
       JOIN users u ON u.id = c.user_id
       ORDER BY c.created_at DESC`
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    serverError(res, error, "Failed to load complaints");
  }
};


// ---------- One complaint (details) ----------
exports.getComplaint = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.*, u.name AS user_name, u.email AS user_email,
              a.name AS assigned_name
       FROM complaints c
       JOIN users u ON u.id = c.user_id
       LEFT JOIN users a ON a.id = c.assigned_to
       WHERE c.id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    serverError(res, error, "Failed to load complaint");
  }
};


// ---------- Admins that a complaint can be assigned to ----------
exports.getStaff = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT id, name FROM users WHERE role = 'admin'");
    res.json({ success: true, data: rows });
  } catch (error) {
    serverError(res, error, "Failed to load admins");
  }
};


// ---------- Update status / priority / assignment ----------
exports.updateComplaint = async (req, res) => {
  try {
    const { status, priority, assigned_to } = req.body;
    const fields = [];
    const values = [];

    if (status !== undefined) {
      if (!STATUSES.includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status" });
      }
      fields.push("status = ?");
      values.push(status);
    }

    if (priority !== undefined) {
      if (!PRIORITIES.includes(priority)) {
        return res.status(400).json({ success: false, message: "Invalid priority" });
      }
      fields.push("priority = ?");
      values.push(priority);
    }

    if (assigned_to !== undefined) {
      if (assigned_to !== null) {
        const [admins] = await db.query(
          "SELECT id FROM users WHERE id = ? AND role = 'admin'",
          [assigned_to]
        );
        if (admins.length === 0) {
          return res.status(400).json({ success: false, message: "Assignee must be an admin" });
        }
      }
      fields.push("assigned_to = ?");
      values.push(assigned_to);
    }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: "Nothing to update" });
    }

    const [result] = await db.query(
      `UPDATE complaints SET ${fields.join(", ")} WHERE id = ?`,
      [...values, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    res.json({ success: true, message: "Complaint updated successfully" });
  } catch (error) {
    serverError(res, error, "Failed to update complaint");
  }
};
