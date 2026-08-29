const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");

// Member 4 Dashboard Routes
router.get("/stats", dashboardController.getStats);
router.get("/charts", dashboardController.getChartsData);
router.get("/export/csv", dashboardController.exportCSV);
router.get("/report-summary", dashboardController.getReportSummary);

module.exports = router;
