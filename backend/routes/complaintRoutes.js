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
} = require("../controllers/complaintController");

const { authMiddleware } = require("../middleware/authMiddleware");
const { isStaff } = require("../middleware/staffMiddleware");

// Create a complaint
router.post("/", authMiddleware, uploadImage, createComplaint);

// Get complaints submitted by the logged-in user
router.get("/", authMiddleware, getComplaints);

// Get complaints assigned to the logged-in, approved staff member
// IMPORTANT: Keep this route BEFORE /:id
router.get(
  "/assigned",
  authMiddleware,
  isStaff,
  getAssignedComplaints,
);

// Get a particular complaint by ID
router.get("/:id", authMiddleware, getComplaintById);

// Update a complaint
router.put("/:id", authMiddleware, uploadImage, updateComplaint);

// Delete a complaint
router.delete("/:id", authMiddleware, deleteComplaint);

module.exports = router;
