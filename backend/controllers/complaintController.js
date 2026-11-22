const db = require("../config/db");
const fs = require("fs");
const path = require("path");
const { sendComplaintAcknowledgement } = require("../utils/emailService");

// =========================================================
// CREATE COMPLAINT
// =========================================================

const createComplaint = async (req, res) => {
  try {
    const { title, description, category, priority } = req.body;

    if (!title || !description || !category || !priority) {
      return res.status(400).json({
        success: false,
        message: "All complaint fields are required",
      });
    }

    const userId = req.session.userId;
    const imagePath = req.file ? `uploads/${req.file.filename}` : null;

    const [result] = await db.query(
      `INSERT INTO complaints
            (user_id, title, description, category, priority, status, image_path)
            VALUES (?, ?, ?, ?, ?, 'Pending', ?)`,
      [userId, title, description, category, priority, imagePath],
    );

    const [users] = await db.query(
      "SELECT name, email FROM users WHERE id = ?",
      [userId],
    );

    if (users.length > 0) {
      try {
        await sendComplaintAcknowledgement(
          {
            id: result.insertId,
            title,
            category,
            priority,
          },
          users[0],
        );

        console.log("Complaint acknowledgement email sent");
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
      }
    }

    return res.status(201).json({
      success: true,
      message: "Complaint created successfully",
      complaintId: result.insertId,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Unable to create complaint",
    });
  }
};

// =========================================================
// GET USER'S COMPLAINTS
// =========================================================

const getComplaints = async (req, res) => {
  try {
    const userId = req.session.userId;

    const [complaints] = await db.query(
      `SELECT c.*, a.name AS assigned_name
             FROM complaints c
             LEFT JOIN users a ON a.id = c.assigned_to
             WHERE c.user_id = ?
             ORDER BY c.created_at DESC`,
      [userId],
    );

    return res.status(200).json({
      success: true,
      complaints,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch complaints",
    });
  }
};

// =========================================================
// GET COMPLAINT BY ID
// =========================================================

const getComplaintById = async (req, res) => {
  try {
    const complaintId = req.params.id;
    const userId = req.session.userId;

    const [complaints] = await db.query(
      `SELECT c.*, a.name AS assigned_name
             FROM complaints c
             LEFT JOIN users a ON a.id = c.assigned_to
             WHERE c.id = ?`,
      [complaintId],
    );

    if (complaints.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    if (Number(complaints[0].user_id) !== Number(userId)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    return res.status(200).json({
      success: true,
      complaint: complaints[0],
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch complaint",
    });
  }
};

// =========================================================
// UPDATE USER'S COMPLAINT
// =========================================================

const updateComplaint = async (req, res) => {
  try {
    const complaintId = req.params.id;
    const userId = req.session.userId;

    const newImagePath = req.file ? `uploads/${req.file.filename}` : null;

    const { title, description, category, priority } = req.body;

    if (!title || !description || !category || !priority) {
      return res.status(400).json({
        success: false,
        message: "All complaint fields are required",
      });
    }

    const [complaints] = await db.query(
      "SELECT * FROM complaints WHERE id = ?",
      [complaintId],
    );

    if (complaints.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    const complaint = complaints[0];

    if (complaint.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending complaints can be updated",
      });
    }

    if (Number(complaint.user_id) !== Number(userId)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    await db.query(
      `UPDATE complaints
             SET title = ?,
                 description = ?,
                 category = ?,
                 priority = ?,
                 image_path = COALESCE(?, image_path)
             WHERE id = ?`,
      [title, description, category, priority, newImagePath, complaintId],
    );

    return res.status(200).json({
      success: true,
      message: "Complaint updated successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Unable to update complaint",
    });
  }
};

// =========================================================
// DELETE USER'S COMPLAINT
// =========================================================

const deleteComplaint = async (req, res) => {
  try {
    const complaintId = req.params.id;
    const userId = req.session.userId;

    const [complaints] = await db.query(
      "SELECT * FROM complaints WHERE id = ?",
      [complaintId],
    );

    if (complaints.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    const complaint = complaints[0];

    if (complaint.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending complaints can be deleted",
      });
    }

    if (Number(complaint.user_id) !== Number(userId)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    if (complaint.image_path) {
      fs.unlink(path.join(__dirname, "..", complaint.image_path), () => {});
    }

    await db.query("DELETE FROM complaints WHERE id = ?", [complaintId]);

    return res.status(200).json({
      success: true,
      message: "Complaint deleted successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete complaint",
    });
  }
};

// =========================================================
// GET COMPLAINTS ASSIGNED TO STAFF
// =========================================================

const getAssignedComplaints = async (req, res) => {
  try {
    const staffId = req.session.userId;

    const [complaints] = await db.query(
      `SELECT c.*, u.name AS user_name
             FROM complaints c
             JOIN users u ON u.id = c.user_id
             WHERE c.assigned_to = ?
             ORDER BY c.created_at DESC`,
      [staffId],
    );

    return res.status(200).json({
      success: true,
      complaints,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch assigned complaints",
    });
  }
};

// =========================================================
// MARK ASSIGNED COMPLAINT AS RESOLVED
// =========================================================

const resolveAssignedComplaint = async (req, res) => {
  try {
    const complaintId = req.params.id;
    const staffId = req.session.userId;

    // Find the complaint and verify its assignment
    const [complaints] = await db.query(
      `SELECT id, assigned_to, status
             FROM complaints
             WHERE id = ?`,
      [complaintId],
    );

    if (complaints.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    const complaint = complaints[0];

    // Ensure this complaint belongs to the logged-in staff member
    if (Number(complaint.assigned_to) !== Number(staffId)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to resolve this complaint",
      });
    }

    if (complaint.status === "Resolved") {
      return res.status(400).json({
        success: false,
        message: "This complaint is already resolved",
      });
    }

    if (complaint.status !== "Pending" && complaint.status !== "In Progress") {
      return res.status(400).json({
        success: false,
        message: "This complaint cannot be marked as resolved",
      });
    }

    await db.query(
      `UPDATE complaints
             SET status = 'Resolved'
             WHERE id = ? AND assigned_to = ?`,
      [complaintId, staffId],
    );

    return res.status(200).json({
      success: true,
      message: "Complaint marked as resolved successfully",
    });
  } catch (error) {
    console.error("Resolve complaint error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to resolve complaint",
    });
  }
};

// =========================================================
// EXPORTS
// =========================================================

module.exports = {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaint,
  deleteComplaint,
  getAssignedComplaints,
  resolveAssignedComplaint,
};
