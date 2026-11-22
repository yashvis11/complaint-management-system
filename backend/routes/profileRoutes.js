const express = require("express");
const router = express.Router();

const {
  getProfile,
  updateProfile,
  getStaffProfile,
} = require("../controllers/profileController");

const { authMiddleware } = require("../middleware/authMiddleware");
const { isStaff } = require("../middleware/staffMiddleware");

// Get logged-in user's profile
router.get("/", authMiddleware, getProfile);

// Update logged-in user's profile
router.put("/update", authMiddleware, updateProfile);

// Get the logged-in, approved staff member's profile
router.get("/staff", authMiddleware, isStaff, getStaffProfile);

module.exports = router;
