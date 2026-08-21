const db = require("../config/db");

const createComplaint = async (req, res) => {
    try {
        const { title, description, category, priority } = req.body;

        if (!title || !description || !category || !priority) {
            return res.status(400).json({
                success: false,
                message: "All complaint fields are required"
            });
        }

        const userId = req.body.user_id;

        const [result] = await db.query(
            `INSERT INTO Complaints
            (user_id, title, description, category, priority, status)
            VALUES (?, ?, ?, ?, ?, 'Pending')`,
            [userId, title, description, category, priority]
        );

        res.status(201).json({
            success: true,
            message: "Complaint created successfully",
            complaintId: result.insertId
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to create complaint"
        });
    }
};

const getComplaints = async (req, res) => {

};

const getComplaintById = async (req, res) => {

};

const updateComplaint = async (req, res) => {

};

const deleteComplaint = async (req, res) => {

};

module.exports = {
    createComplaint,
    getComplaints,
    getComplaintById,
    updateComplaint,
    deleteComplaint
};