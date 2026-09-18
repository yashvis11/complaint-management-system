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
    try {
        const userId = req.body.user_id;

        const [complaints] = await db.query(
            "SELECT * FROM complaints WHERE user_id = ? ORDER BY created_at DESC",
            [userId]
        );

        res.status(200).json({
            success: true,
            complaints: complaints
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to fetch complaints"
        });
    }
};

const getComplaintById = async (req, res) => {
    try {
        const complaintId = req.params.id;

        const [complaints] = await db.query(
            "SELECT * FROM complaints WHERE id = ?",
            [complaintId]
        );

        if (complaints.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Complaint not found"
            });
        }

        res.status(200).json({
            success: true,
            complaint: complaints[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to fetch complaint"
        });
    }
};

const updateComplaint = async (req, res) => {
    try {
        const complaintId = req.params.id;
        const { title, description, category, priority } = req.body;

        if (!title || !description || !category || !priority) {
            return res.status(400).json({
                success: false,
                message: "All complaint fields are required"
            });
        }

        const [complaints] = await db.query(
            "SELECT status FROM complaints WHERE id = ?",
            [complaintId]
        );

        if (complaints.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Complaint not found"
            });
        }

        if (complaints[0].status !== "Pending") {
            return res.status(400).json({
                success: false,
                message: "Only pending complaints can be updated"
            });
        }

        await db.query(
            `UPDATE complaints
             SET title = ?, description = ?, category = ?, priority = ?
             WHERE id = ?`,
            [title, description, category, priority, complaintId]
        );

        res.status(200).json({
            success: true,
            message: "Complaint updated successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to update complaint"
        });
    }
};

const deleteComplaint = async (req, res) => {
    try {
        const complaintId = req.params.id;

        const [complaints] = await db.query(
            "SELECT status FROM complaints WHERE id = ?",
            [complaintId]
        );

        if (complaints.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Complaint not found"
            });
        }

        if (complaints[0].status !== "Pending") {
            return res.status(400).json({
                success: false,
                message: "Only pending complaints can be deleted"
            });
        }

        await db.query(
            "DELETE FROM complaints WHERE id = ?",
            [complaintId]
        );

        res.status(200).json({
            success: true,
            message: "Complaint deleted successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to delete complaint"
        });
    }
};

module.exports = {
    createComplaint,
    getComplaints,
    getComplaintById,
    updateComplaint,
    deleteComplaint
};