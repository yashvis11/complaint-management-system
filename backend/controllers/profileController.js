// =========================================================
// PROFILE CONTROLLER
// =========================================================

const db = require("../config/db");

// Supports either req.session.user.id or req.session.userId,
// depending on what your login controller stores
function getSessionUserId(req) {
  return req.session.userId;
}

// =========================================================
// GET LOGGED-IN USER'S PROFILE
// =========================================================

exports.getProfile = async (req, res) => {
  try {
    const userId = getSessionUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please login first",
      });
    }

    const [rows] = await db.query(
      "SELECT id, name, email, role, created_at FROM users WHERE id = ?",
      [userId],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error("Get profile error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load profile",
    });
  }
};

// =========================================================
// UPDATE LOGGED-IN USER'S PROFILE (name and email)
// =========================================================

exports.updateProfile = async (req, res) => {
  try {
    const userId = getSessionUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please login first",
      });
    }

    const name = (req.body.name || "").trim();
    const email = (req.body.email || "").trim().toLowerCase();

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Name and email are required",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    // Make sure no other user already uses this email
    const [existing] = await db.query(
      "SELECT id FROM users WHERE email = ? AND id != ?",
      [email, userId],
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "That email is already in use",
      });
    }

    await db.query("UPDATE users SET name = ?, email = ? WHERE id = ?", [
      name,
      email,
      userId,
    ]);

    // Keep the session copy in sync if you store the user object there
    if (req.session.user) {
      req.session.user.name = name;
      req.session.user.email = email;
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: { name, email },
    });
  } catch (error) {
    console.error("Update profile error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};
