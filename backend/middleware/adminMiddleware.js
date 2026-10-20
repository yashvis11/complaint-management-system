// middleware/isAdmin.js
// Uses the logged-in user from the session, then checks their role in MySQL
const db = require("../config/db");

module.exports = async function isAdmin(req, res, next) {
  const userId = req.session.userId;

  if (!userId) {
    return res.status(401).json({ success: false, message: "Please login first" });
  }

  try {
    const [rows] = await db.query("SELECT role FROM users WHERE id = ?", [userId]);

    if (rows.length === 0 || rows[0].role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    next();
  } catch (error) {
    console.error("isAdmin error:", error);
    res.status(500).json({ success: false, message: "Permission check failed" });
  }
};
