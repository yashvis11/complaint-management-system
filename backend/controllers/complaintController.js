
const db = require("../config/db");
const fs = require("fs");
const path = require("path");
const { v2: cloudinary } = require("cloudinary");
const { sendComplaintAcknowledgement } = require("../utils/emailService");

// Load backend environment variables
require("dotenv").config({
  path: path.join(__dirname, "..", ".env"),
});

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// =========================================================
// DELETE IMAGE FROM ITS STORAGE LOCATION
// =========================================================

const deleteComplaintImage = async (imagePath, publicId) => {
  if (!imagePath) return;

  try {
    // Cloudinary image
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
      return;
    }

    // Local image
    if (!imagePath.startsWith("http")) {
      const localPath = path.join(__dirname, "..", imagePath);

      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
    }
  } catch (error) {
    console.error("Image deletion failed:", error);
  }
};

// =========================================================
// GET IMAGE DETAILS FROM MULTER
// =========================================================

const getUploadedImageDetails = (file) => {
  if (!file) {
    return {
      imagePath: null,
      imagePublicId: null,
    };
  }

  if (process.env.STORAGE_TYPE === "cloudinary") {
    return {
      imagePath: file.path,
      imagePublicId: file.filename,
    };
  }

  return {
    imagePath: `uploads/${file.filename}`,
    imagePublicId: null,
  };
};

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

    const { imagePath, imagePublicId } =
      getUploadedImageDetails(req.file);

    const [result] = await db.query(
      `INSERT INTO complaints
       (user_id, title, description, category, priority, status,
        image_path, image_public_id)
       VALUES (?, ?, ?, ?, ?, 'Pending', ?, ?)`,
      [
        userId,
        title,
        description,
        category,
        priority,
        imagePath,
        imagePublicId,
      ]
    );

    const [users] = await db.query(
      "SELECT name, email FROM users WHERE id = ?",
      [userId]
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
          users[0]
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
      [userId]
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
      [complaintId]
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

    const { title, description, category, priority } = req.body;

    if (!title || !description || !category || !priority) {
      return res.status(400).json({
        success: false,
        message: "All complaint fields are required",
      });
    }

    const [complaints] = await db.query(
      "SELECT * FROM complaints WHERE id = ?",
      [complaintId]
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

    const { imagePath, imagePublicId } =
      getUploadedImageDetails(req.file);

    await db.query(
      `UPDATE complaints
       SET title = ?,
           description = ?,
           category = ?,
           priority = ?,
           image_path = COALESCE(?, image_path),
           image_public_id = COALESCE(?, image_public_id)
       WHERE id = ?`,
      [
        title,
        description,
        category,
        priority,
        imagePath,
        imagePublicId,
        complaintId,
      ]
    );

    // Delete the previous image only after the database update succeeds
    if (req.file && complaint.image_path) {
      await deleteComplaintImage(
        complaint.image_path,
        complaint.image_public_id
      );
    }

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
      [complaintId]
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

    await db.query(
      "DELETE FROM complaints WHERE id = ?",
      [complaintId]
    );

    await deleteComplaintImage(
      complaint.image_path,
      complaint.image_public_id
    );

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
      [staffId]
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

    const [complaints] = await db.query(
      `SELECT id, assigned_to, status
       FROM complaints
       WHERE id = ?`,
      [complaintId]
    );

    if (complaints.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    const complaint = complaints[0];

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

    if (
      complaint.status !== "Pending" &&
      complaint.status !== "In Progress"
    ) {
      return res.status(400).json({
        success: false,
        message: "This complaint cannot be marked as resolved",
      });
    }

    await db.query(
      `UPDATE complaints
       SET status = 'Resolved'
       WHERE id = ? AND assigned_to = ?`,
      [complaintId, staffId]
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
