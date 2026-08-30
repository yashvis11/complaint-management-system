const db = require("../config/db");

// Get all complaints for admin
async function getAllComplaints(req, res) {
    try {

        const [complaints] = await db.query(`
            SELECT
                c.id,
                c.user_id,
                u.name AS user_name,
                u.email AS user_email,
                c.title,
                c.description,
                c.category,
                c.priority,
                c.status,
                c.created_at,
                c.updated_at
            FROM Complaints c
            LEFT JOIN Users u ON c.user_id = u.id
            ORDER BY c.id DESC
        `);

        res.json({
            success: true,
            data: complaints
        });

    } catch (error) {

        console.error("Error fetching admin complaints:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch complaints"
        });

    }
}


// Update complaint status
async function updateComplaintStatus(req, res) {

    try {

        const { id } = req.params;
        const { status } = req.body;


        const allowedStatuses = [
            "Pending",
            "In Progress",
            "Resolved",
            "Rejected"
        ];


        if (!allowedStatuses.includes(status)) {

            return res.status(400).json({
                success: false,
                message: "Invalid complaint status"
            });

        }


        const [result] = await db.query(
            `
            UPDATE Complaints
            SET status = ?
            WHERE id = ?
            `,
            [status, id]
        );


        if (result.affectedRows === 0) {

            return res.status(404).json({
                success: false,
                message: "Complaint not found"
            });

        }


        res.json({
            success: true,
            message: "Complaint status updated successfully"
        });


    } catch (error) {

        console.error(
            "Error updating complaint status:",
            error
        );


        res.status(500).json({
            success: false,
            message: "Failed to update complaint status"
        });

    }
}


module.exports = {
    getAllComplaints,
    updateComplaintStatus
};