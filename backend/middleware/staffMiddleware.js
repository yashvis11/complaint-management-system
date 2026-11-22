const db = require("../config/db");

// Middleware to check whether the logged-in user
// is an approved staff member
const isStaff = async (req, res, next) => {
  try {
    // Check whether the user is logged in
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        success: false,
        message: "Please log in first",
      });
    }

    // Get the user's role and verification status
    const [users] = await db.query(
      `SELECT role, is_verified
             FROM users
             WHERE id = ?`,
      [req.session.userId],
    );

    // Check whether the user exists
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check whether the user is approved staff
    if (users[0].role !== "staff" || Number(users[0].is_verified) !== 1) {
      return res.status(403).json({
        success: false,
        message: "Your staff account is not approved",
      });
    }

    // User is approved staff, continue to the route
    next();
  } catch (error) {
    console.error("Staff middleware error:", error);

    return res.status(500).json({
      success: false,
      message: "Authorization failed",
    });
  }
};

module.exports = { isStaff };
