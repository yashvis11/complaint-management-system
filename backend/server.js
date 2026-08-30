const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const db = require("./config/db");

// Route imports
const dashboardRoutes = require("./routes/dashboardRoutes");

let authRoutes;
let complaintRoutes;
let adminRoutes;

try {
  authRoutes = require("./routes/authRoutes");
} catch (error) {
  console.log("authRoutes not available yet");
}

try {
  complaintRoutes = require("./routes/complaintRoutes");
} catch (error) {
  console.log("complaintRoutes not available yet");
}

try {
  adminRoutes = require("./routes/adminRoutes");
} catch (error) {
  console.log("adminRoutes not available yet");
}

const app = express();


// ================================
// MIDDLEWARE
// ================================

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({
  extended: true
}));


// ================================
// FRONTEND
// ================================

// IMPORTANT:
// server.js is inside /backend
// frontend is one level above /backend

const frontendPath = path.join(__dirname, "frontend");

app.use(express.static(frontendPath));


// ================================
// API ROUTES
// ================================

app.use(
  "/api/dashboard",
  dashboardRoutes
);

if (
  authRoutes &&
  typeof authRoutes === "function"
) {
  app.use(
    "/api/auth",
    authRoutes
  );
}

if (
  complaintRoutes &&
  typeof complaintRoutes === "function"
) {
  app.use(
    "/api/complaints",
    complaintRoutes
  );
}

if (
  adminRoutes &&
  typeof adminRoutes === "function"
) {
  app.use(
    "/api/admin",
    adminRoutes
  );
}


// ================================
// HOME PAGE
// ================================

app.get("/", (req, res) => {

  res.sendFile(
    path.join(
      frontendPath,
      "pages",
      "dashboard.html"
    )
  );

});


// ================================
// HEALTH CHECK
// ================================

app.get(
  "/api/health",
  async (req, res) => {

    try {

      await db.query("SELECT 1");

      res.json({

        success: true,

        message:
          "Server and MySQL database are connected"

      });

    } catch (error) {

      console.error(
        "Database connection check failed:",
        error.message
      );

      res.status(500).json({

        success: false,

        message:
          "Database connection failed",

        error:
          error.message

      });

    }

  }
);


// ================================
// SERVER
// ================================

const PORT =
  process.env.PORT || 3000;

app.listen(
  PORT,
  () => {

    console.log(
      `Complaint Management System Server running on port ${PORT}`
    );

    console.log(
      `Frontend: http://localhost:${PORT}/pages/dashboard.html`
    );

    console.log(
      `API: http://localhost:${PORT}/api/complaints`
    );

  }
);