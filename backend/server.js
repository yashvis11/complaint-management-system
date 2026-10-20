const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const db = require("./config/db");
const complaintRoutes = require("./routes/complaintRoutes");
const profileRoutes = require("./routes/profileRoutes");
   
const app = express();
const session = require("express-session")
const authenticationRoutes = require("./routes/authRoutes")
const dashboardRoutes = require("./routes/dashboardRoutes");
const adminRoutes = require("./routes/adminRoutes");
app.use(
  cors({
    origin: "http://localhost:5500",
    credentials: true,
  }),
);
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET, 
  resave: false,
  saveUninitialized: false,
  cookie:{
    maxAge: 1000*60*60,
    secure: false,
    sameSite: "lax"  //1 hour
  }
}))
app.use("/api/complaints", complaintRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/profile", profileRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Complaint Management System API is running",
  });
});

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
app.use("/api/auth", authenticationRoutes)
app.use("/api/dashboard", dashboardRoutes);
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
