const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const isAdmin = require("../middleware/adminMiddleware");

const {
  getStats,
  getComplaints,
  getComplaint,
  updateComplaint,
  getStaff,
  getPendingStaff,
  verifyStaff,
} = require("../controllers/adminController");

// All admin routes require login and admin access
router.use(authMiddleware.authMiddleware, isAdmin);

// Dashboard statistics
router.get("/stats", getStats);

// Staff management
router.get("/staff", getStaff);
router.get("/staff/pending", getPendingStaff);
router.patch("/staff/:id/verify", verifyStaff);

// Complaint management
router.get("/complaints", getComplaints);
router.get("/complaints/:id", getComplaint);
router.put("/complaints/:id", updateComplaint);

module.exports = router;
