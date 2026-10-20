// routes/adminRoutes.js
const express = require("express");
const router = express.Router();

const isAdmin = require("../middleware/adminMiddleware");
const {
  getStats, getComplaints, getComplaint, updateComplaint, getStaff,
} = require("../controllers/adminController");

router.use(isAdmin); // every admin route is protected

router.get("/stats", getStats);
router.get("/staff", getStaff);
router.get("/complaints", getComplaints);
router.get("/complaints/:id", getComplaint);
router.put("/complaints/:id", updateComplaint);

module.exports = router;
