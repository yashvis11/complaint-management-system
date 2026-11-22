const express = require("express");
const router = express.Router();

const uploadImage = require("../middleware/upload");

const {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaint,
  deleteComplaint,
  getAssignedComplaints,
  resolveAssignedComplaint,
} = require("../controllers/complaintController");

const { authMiddleware } = require("../middleware/authMiddleware");
const { isStaff } = require("../middleware/staffMiddleware");

// Create a complaint
router.post("/", authMiddleware, uploadImage, createComplaint);

// Get complaints submitted by the logged-in user
router.get("/", authMiddleware, getComplaints);

// Get complaints assigned to approved staff
router.get("/assigned", authMiddleware, isStaff, getAssignedComplaints);

// Staff marks their assigned complaint as resolved
router.patch("/:id/resolve", authMiddleware, isStaff, resolveAssignedComplaint);

// Get a particular complaint by ID
router.get("/:id", authMiddleware, getComplaintById);

// Update a complaint submitted by a user
router.put("/:id", authMiddleware, uploadImage, updateComplaint);

// Delete a complaint submitted by a user
router.delete("/:id", authMiddleware, deleteComplaint);

module.exports = router;
