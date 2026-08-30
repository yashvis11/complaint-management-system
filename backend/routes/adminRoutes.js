const express = require("express");

const router = express.Router();

const adminController =
    require("../controllers/adminController");


// GET all complaints
router.get(
    "/complaints",
    adminController.getAllComplaints
);


// UPDATE complaint status
router.put(
    "/complaints/:id/status",
    adminController.updateComplaintStatus
);


module.exports = router;