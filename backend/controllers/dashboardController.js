const db = require("../config/db");

/**
 * Controller for Member 4: Dashboard, Statistics & Reports
 */

// 1. Get Dashboard Statistics & Metrics
exports.getStats = async (req, res) => {
  try {
    const { status, category, priority, startDate, endDate } = req.query;

    let whereClauses = [];
    let queryParams = [];

    if (status && status !== "All") {
      whereClauses.push("c.status = ?");
      queryParams.push(status);
    }
    if (category && category !== "All") {
      whereClauses.push("c.category = ?");
      queryParams.push(category);
    }
    if (priority && priority !== "All") {
      whereClauses.push("c.priority = ?");
      queryParams.push(priority);
    }
    if (startDate) {
      whereClauses.push("c.created_at >= ?");
      queryParams.push(`${startDate} 00:00:00`);
    }
    if (endDate) {
      whereClauses.push("c.created_at <= ?");
      queryParams.push(`${endDate} 23:59:59`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    // Total and Status Counts
    const [statusStats] = await db.query(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN c.status = 'Pending' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN c.status = 'In Progress' THEN 1 ELSE 0 END) AS inProgress,
        SUM(CASE WHEN c.status = 'Resolved' THEN 1 ELSE 0 END) AS resolved,
        SUM(CASE WHEN c.status = 'Rejected' THEN 1 ELSE 0 END) AS rejected
      FROM Complaints c
      ${whereSql}
    `, queryParams);

    // Priority Counts
    const [priorityStats] = await db.query(`
      SELECT 
        SUM(CASE WHEN c.priority = 'High' THEN 1 ELSE 0 END) AS high,
        SUM(CASE WHEN c.priority = 'Medium' THEN 1 ELSE 0 END) AS medium,
        SUM(CASE WHEN c.priority = 'Low' THEN 1 ELSE 0 END) AS low
      FROM Complaints c
      ${whereSql}
    `, queryParams);

    // Category Breakdown
    const [categoryStats] = await db.query(`
      SELECT c.category, COUNT(*) AS count
      FROM Complaints c
      ${whereSql}
      GROUP BY c.category
      ORDER BY count DESC
    `, queryParams);

    // Recent Complaints (up to 10)
    const [recentComplaints] = await db.query(`
      SELECT 
        c.id,
        c.title,
        c.description,
        c.category,
        c.priority,
        c.status,
        c.created_at,
        c.updated_at,
        u.name AS user_name,
        u.email AS user_email
      FROM Complaints c
      LEFT JOIN Users u ON c.user_id = u.id
      ${whereSql}
      ORDER BY c.created_at DESC
      LIMIT 10
    `, queryParams);

    const total = Number(statusStats[0]?.total || 0);
    const resolved = Number(statusStats[0]?.resolved || 0);
    const resolutionRate = total > 0 ? ((resolved / total) * 100).toFixed(1) : "0.0";

    res.json({
      success: true,
      data: {
        summary: {
          total,
          pending: Number(statusStats[0]?.pending || 0),
          inProgress: Number(statusStats[0]?.inProgress || 0),
          resolved,
          rejected: Number(statusStats[0]?.rejected || 0),
          resolutionRate: `${resolutionRate}%`,
          highPriority: Number(priorityStats[0]?.high || 0),
          mediumPriority: Number(priorityStats[0]?.medium || 0),
          lowPriority: Number(priorityStats[0]?.low || 0),
        },
        categoryBreakdown: categoryStats,
        recentComplaints,
      },
    });
  } catch (error) {
    console.error("Error in getStats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
      error: error.message,
    });
  }
};

// 2. Get Chart-Specific Visual Data (Trends & Distributions)
exports.getChartsData = async (req, res) => {
  try {
    const { category, priority, status } = req.query;

    let whereClauses = [];
    let queryParams = [];

    if (status && status !== "All") {
      whereClauses.push("c.status = ?");
      queryParams.push(status);
    }
    if (category && category !== "All") {
      whereClauses.push("c.category = ?");
      queryParams.push(category);
    }
    if (priority && priority !== "All") {
      whereClauses.push("c.priority = ?");
      queryParams.push(priority);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    // Monthly Trends (Last 6-12 months)
    const [monthlyTrends] = await db.query(`
      SELECT 
        DATE_FORMAT(c.created_at, '%b %Y') AS monthLabel,
        DATE_FORMAT(c.created_at, '%Y-%m') AS monthYear,
        COUNT(*) AS total,
        SUM(CASE WHEN c.status = 'Resolved' THEN 1 ELSE 0 END) AS resolved
      FROM Complaints c
      ${whereSql}
      GROUP BY monthYear, monthLabel
      ORDER BY monthYear ASC
      LIMIT 12
    `, queryParams);

    // Status Distribution
    const [statusDistribution] = await db.query(`
      SELECT c.status, COUNT(*) AS count
      FROM Complaints c
      ${whereSql}
      GROUP BY c.status
    `, queryParams);

    // Priority Distribution
    const [priorityDistribution] = await db.query(`
      SELECT c.priority, COUNT(*) AS count
      FROM Complaints c
      ${whereSql}
      GROUP BY c.priority
    `, queryParams);

    // Category Distribution
    const [categoryDistribution] = await db.query(`
      SELECT c.category, COUNT(*) AS count
      FROM Complaints c
      ${whereSql}
      GROUP BY c.category
      ORDER BY count DESC
      LIMIT 8
    `, queryParams);

    res.json({
      success: true,
      data: {
        monthlyTrends,
        statusDistribution,
        priorityDistribution,
        categoryDistribution,
      },
    });
  } catch (error) {
    console.error("Error in getChartsData:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch chart data",
      error: error.message,
    });
  }
};

// 3. Export Complaints Report as CSV
exports.exportCSV = async (req, res) => {
  try {
    const { status, category, priority, startDate, endDate } = req.query;

    let whereClauses = [];
    let queryParams = [];

    if (status && status !== "All") {
      whereClauses.push("c.status = ?");
      queryParams.push(status);
    }
    if (category && category !== "All") {
      whereClauses.push("c.category = ?");
      queryParams.push(category);
    }
    if (priority && priority !== "All") {
      whereClauses.push("c.priority = ?");
      queryParams.push(priority);
    }
    if (startDate) {
      whereClauses.push("c.created_at >= ?");
      queryParams.push(`${startDate} 00:00:00`);
    }
    if (endDate) {
      whereClauses.push("c.created_at <= ?");
      queryParams.push(`${endDate} 23:59:59`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const [rows] = await db.query(`
      SELECT 
        c.id,
        u.name AS user_name,
        u.email AS user_email,
        c.title,
        c.description,
        c.category,
        c.priority,
        c.status,
        DATE_FORMAT(c.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
        DATE_FORMAT(c.updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at
      FROM Complaints c
      LEFT JOIN Users u ON c.user_id = u.id
      ${whereSql}
      ORDER BY c.created_at DESC
    `, queryParams);

    // CSV Helper to sanitize fields
    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const escaped = String(str).replace(/"/g, '""').replace(/\r\n|\n|\r/g, " ");
      return `"${escaped}"`;
    };

    const headers = [
      "Complaint ID",
      "User Name",
      "User Email",
      "Title",
      "Category",
      "Priority",
      "Status",
      "Created At",
      "Last Updated",
      "Description",
    ];

    let csvRows = [headers.join(",")];

    for (const row of rows) {
      csvRows.push([
        row.id,
        escapeCsv(row.user_name || "N/A"),
        escapeCsv(row.user_email || "N/A"),
        escapeCsv(row.title),
        escapeCsv(row.category),
        escapeCsv(row.priority),
        escapeCsv(row.status),
        escapeCsv(row.created_at),
        escapeCsv(row.updated_at),
        escapeCsv(row.description),
      ].join(","));
    }

    const csvContent = csvRows.join("\n");
    const timestamp = new Date().toISOString().slice(0, 10);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="complaints_report_${timestamp}.csv"`);
    res.status(200).send(csvContent);
  } catch (error) {
    console.error("Error in exportCSV:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export CSV report",
      error: error.message,
    });
  }
};

// 4. Get Report Summary for PDF / Printable Report
exports.getReportSummary = async (req, res) => {
  try {
    const { status, category, priority, startDate, endDate } = req.query;

    let whereClauses = [];
    let queryParams = [];

    if (status && status !== "All") {
      whereClauses.push("c.status = ?");
      queryParams.push(status);
    }
    if (category && category !== "All") {
      whereClauses.push("c.category = ?");
      queryParams.push(category);
    }
    if (priority && priority !== "All") {
      whereClauses.push("c.priority = ?");
      queryParams.push(priority);
    }
    if (startDate) {
      whereClauses.push("c.created_at >= ?");
      queryParams.push(`${startDate} 00:00:00`);
    }
    if (endDate) {
      whereClauses.push("c.created_at <= ?");
      queryParams.push(`${endDate} 23:59:59`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const [stats] = await db.query(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN c.status = 'Pending' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN c.status = 'In Progress' THEN 1 ELSE 0 END) AS inProgress,
        SUM(CASE WHEN c.status = 'Resolved' THEN 1 ELSE 0 END) AS resolved,
        SUM(CASE WHEN c.status = 'Rejected' THEN 1 ELSE 0 END) AS rejected,
        SUM(CASE WHEN c.priority = 'High' THEN 1 ELSE 0 END) AS highPriority
      FROM Complaints c
      ${whereSql}
    `, queryParams);

    const [complaints] = await db.query(`
      SELECT 
        c.id,
        c.title,
        c.category,
        c.priority,
        c.status,
        c.created_at,
        u.name AS user_name
      FROM Complaints c
      LEFT JOIN Users u ON c.user_id = u.id
      ${whereSql}
      ORDER BY c.created_at DESC
      LIMIT 100
    `, queryParams);

    res.json({
      success: true,
      data: {
        generatedAt: new Date().toLocaleString(),
        filtersApplied: { status, category, priority, startDate, endDate },
        stats: stats[0] || {},
        complaints,
      },
    });
  } catch (error) {
    console.error("Error in getReportSummary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate report summary",
      error: error.message,
    });
  }
};
