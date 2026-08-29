const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const db = require("./config/db");

// Route imports
const dashboardRoutes = require("./routes/dashboardRoutes");

// Placeholder routes for team members (will be activated as members add them)
let authRoutes, complaintRoutes, adminRoutes;
try { authRoutes = require("./routes/authRoutes"); } catch (e) {}
try { complaintRoutes = require("./routes/complaintRoutes"); } catch (e) {}
try { adminRoutes = require("./routes/adminRoutes"); } catch (e) {}

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, "../frontend")));

// API Routes
app.use("/api/dashboard", dashboardRoutes);

// Member 1, 2, 3 route mounts (if present and configured)
if (authRoutes && typeof authRoutes === "function") app.use("/api/auth", authRoutes);
if (complaintRoutes && typeof complaintRoutes === "function") app.use("/api/complaints", complaintRoutes);
if (adminRoutes && typeof adminRoutes === "function") app.use("/api/admin", adminRoutes);

// Root route - redirect to dashboard or welcome
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/pages/dashboard.html"));
});

// Health check endpoint
app.get("/api/health", async (req, res) => {
  try {
    await db.query("SELECT 1");

    res.json({
      success: true,
      message: "Server and MySQL database are connected",
    });
  } catch (error) {
    console.error("Database connection check failed:", error.message);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Complaint Management System Server running on port ${PORT}`);
  console.log(`Dashboard available at: http://localhost:${PORT}/pages/dashboard.html`);
});
