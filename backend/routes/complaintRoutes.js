const express = require("express");

const router = express.Router();
const uploadImage = require("../middleware/upload");


const {
    createComplaint,
    getComplaints,
    getComplaintById,
    updateComplaint,
    deleteComplaint,
    getAssignedComplaints
} = require("../controllers/complaintController");

const {authMiddleware} = require("../middleware/authMiddleware")

router.post("/", authMiddleware, uploadImage, createComplaint);
router.get("/", authMiddleware, getComplaints);
router.get("/assigned", authMiddleware, getAssignedComplaints);
router.get("/:id", authMiddleware, getComplaintById);
router.put("/:id", authMiddleware, uploadImage, updateComplaint);
router.delete("/:id", authMiddleware, deleteComplaint);

module.exports = router;