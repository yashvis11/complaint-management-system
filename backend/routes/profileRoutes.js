const express = require("express");
const router = express.Router();

const {
  getProfile,
  updateProfile,
} = require("../controllers/profileController");

// If you already have an auth middleware, add it here:
// router.get("/", isAuthenticated, getProfile);
router.get("/", getProfile);
router.put("/update", updateProfile);

module.exports = router;
