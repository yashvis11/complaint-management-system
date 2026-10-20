const express = require("express");

const router = express.Router();
const uploadImage = require("../middleware/upload");


const {
    createComplaint,
    getComplaints,
    getComplaintById,
    updateComplaint,
    deleteComplaint
} = require("../controllers/complaintController");

const {authMiddleware} = require("../middleware/authMiddleware")

router.post("/", authMiddleware, uploadImage, createComplaint);
router.get("/", authMiddleware, getComplaints);
router.get("/:id", authMiddleware, getComplaintById);
router.put("/:id", authMiddleware, updateComplaint);
router.delete("/:id", authMiddleware, deleteComplaint);

module.exports = router;