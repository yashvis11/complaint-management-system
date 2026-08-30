const express = require("express");
const router = express.Router();

const db = require("../config/db");

// GET all complaints
router.get("/", async (req, res) => {
    try {

        const [complaints] = await db.query(
            "SELECT * FROM Complaints ORDER BY id DESC"
        );

        res.json({
            success: true,
            data: complaints
        });

    } catch (error) {

        console.error("Error fetching complaints:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch complaints"
        });

    }
});

// GET single complaint
router.get("/:id", async (req, res) => {

    try {

        const { id } = req.params;

        const [complaints] = await db.query(
            "SELECT * FROM Complaints WHERE id = ?",
            [id]
        );

        if (complaints.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Complaint not found"
            });

        }

        res.json({
            success: true,
            data: complaints[0]
        });

    } catch (error) {

        console.error(
            "Error fetching complaint:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to fetch complaint"
        });

    }

});

// POST - Create new complaint
router.post("/", async (req, res) => {

    try {
        const {
            user_id,
            title,
            description,
            category,
            priority
        } = req.body;


        // Basic validation
        if (!user_id || !title || !description || !category || !priority) {

            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });

        }


        const [result] = await db.query(
            `INSERT INTO Complaints
    (user_id, title, description, category, priority, status)
    VALUES (?, ?, ?, ?, ?, ?)`,
            [
                user_id,
                title,
                description,
                category,
                priority,
                "Pending"
            ]
        );


        res.status(201).json({

            success: true,

            message: "Complaint created successfully",

            data: {
                id: result.insertId,
                user_id,
                title,
                description,
                category,
                priority,
                status: "Pending"
            }
        });


    } catch (error) {

        console.error("Error creating complaint:", error);

        res.status(500).json({

            success: false,

            message: "Failed to create complaint"

        });

    }

});

// PUT - Update an existing complaint
router.put("/:id", async (req, res) => {

    try {

        const { id } = req.params;

        const {
            title,
            description,
            category,
            priority
        } = req.body;

        // Basic validation
        if (!title || !description || !category || !priority) {

            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });

        }

        const [result] = await db.query(
            `UPDATE Complaints
             SET title = ?,
                 description = ?,
                 category = ?,
                 priority = ?
             WHERE id = ?`,
            [
                title,
                description,
                category,
                priority,
                id
            ]
        );

        if (result.affectedRows === 0) {

            return res.status(404).json({
                success: false,
                message: "Complaint not found"
            });

        }

        res.json({

            success: true,

            message: "Complaint updated successfully"

        });

    } catch (error) {

        console.error("Error updating complaint:", error);

        res.status(500).json({

            success: false,

            message: "Failed to update complaint"

        });

    }

});

module.exports = router;