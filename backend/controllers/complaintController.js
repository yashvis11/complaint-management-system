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

        const userId = req.session.userId; //from session, protected route going through the middleware

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
        const userId = req.session.userId; //from session, will go through the middleware

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
        const userId = req.session.userId;

        //check if complaint exists

        const [complaints] = await db.query(
            "SELECT * FROM complaints WHERE id = ?", 
            [complaintId]
        )

        if (complaints.length > 0) { //complaint is found
            //proceed with checking if the user trying to get the complaint owns that complaint

            if(complaints[0].user_id === userId){  //the user owns the complaint
                res.status(200).json({   //return the positive status
                    success: true,
                    complaint: complaints[0]
                });
            } 
            else{
                res.status(401).json({
                    success: false,
                    message: "Unauthorized access"
                })
            }
        }
        //if complaint is not found, no need to authenticate user and simply return failed response
        else{
            return res.status(404).json({
              success: false,
              message: "Complaint not found",
            });
        }
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to fetch complaint"
        });
    }
};

const updateComplaint = async (req, res) => {
    //should authenticate that only the user who own the complaint can update it
    try {
        const complaintId = req.params.id;
        const userId = req.session.userId;

        const { title, description, category, priority } = req.body;

        if (!title || !description || !category || !priority) {
            return res.status(400).json({
                success: false,
                message: "All complaint fields are required"
            });
        }

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
        if (complaints[0].status !== "Pending") {
            return res.status(400).json({
                success: false,
                message: "Only pending complaints can be updated"
            });
        }

        //check if the logged in user owns the complaint only then can they update it
        if (complaints[0].user_id === userId){  //user is authorized
            await db.query(
              `UPDATE complaints
             SET title = ?, description = ?, category = ?, priority = ?
             WHERE id = ?`,
              [title, description, category, priority, complaintId],
            );

            return res.status(200).json({
              success: true,
              message: "Complaint updated successfully",
            });
        } //user owns the file
        else{
            return res.status(401).json({
                success: false,
                message: "Unauthorized access"
            })
        }
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to update complaint"
        });
    }
};

const deleteComplaint = async (req, res) => {
    //only the user owning the complaint can delete it
    try {
        const complaintId = req.params.id;
        const userId = req.session.userId

        const [complaints] = await db.query(
            "SELECT * FROM complaints WHERE id = ?",
            [complaintId]
        );

        if (complaints.length > 0) {
          //complaint is found
          //proceed with checking if the user trying to get the complaint owns that complaint

          //only pending complaints can be deleted
          if (complaints[0].status !== "Pending") {
            return res.status(400).json({
              success: false,
              message: "Only pending complaints can be deleted",
            });
          }

          if (complaints[0].user_id === userId) {
            //the user owns the complaint
           await db.query("DELETE FROM complaints WHERE id = ?", [complaintId]);
           return res.status(200).json({
            success: true,
            message: "Complaint deleted successfully"
           })
          } else {
            return res.status(401).json({
              success: false,
              message: "Unauthorized access",
            });
          }
        }
        //complaint is not found
        return res.status(404).json({
            success: false,
            message: "Complaint not found"
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