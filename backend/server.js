
const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const db = require("./config/db");

const complaintRoutes = require("./routes/complaintRoutes");
const profileRoutes = require("./routes/profileRoutes");
const authenticationRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const adminRoutes = require("./routes/adminRoutes");

const session = require("express-session");

const app = express();

const isProduction = process.env.NODE_ENV === "production";

// Trust Render's reverse proxy for secure cookies
if (isProduction) {
    app.set("trust proxy", 1);
}

// CORS configuration
app.use(
    cors({
        origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
        credentials: true,
    })
);

app.use(express.json());

// Session configuration
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 1000 * 60 * 60,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
            httpOnly: true,
        },
    })
);

// API routes
app.use("/api/complaints", complaintRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/auth", authenticationRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Uploaded complaint images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Basic server check
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Complaint Management System API is running",
    });
});

// Database health check
app.get("/api/health", async (req, res) => {
    try {
        await db.query("SELECT 1");

        res.json({
            success: true,
            message: "Server and database are connected",
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Database connection failed",
        });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
