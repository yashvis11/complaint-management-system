const express = require("express");
const router = express.Router();

const db = require("../config/db");


// ============================================================
// HELPER: BUILD FILTERS
// ============================================================

function buildFilters(req, tableAlias = "") {

    const {
        status,
        category,
        priority,
        startDate,
        endDate
    } = req.query;

    const conditions = [];
    const params = [];

    const prefix = tableAlias
        ? `${tableAlias}.`
        : "";

    // ----------------------------------------------------------
    // STATUS
    // ----------------------------------------------------------

    if (status && status !== "All") {

        conditions.push(
            `${prefix}status = ?`
        );

        params.push(status);
    }


    // ----------------------------------------------------------
    // CATEGORY
    // ----------------------------------------------------------

    if (category && category !== "All") {

        conditions.push(
            `${prefix}category = ?`
        );

        params.push(category);
    }


    // ----------------------------------------------------------
    // PRIORITY
    // ----------------------------------------------------------

    if (priority && priority !== "All") {

        conditions.push(
            `${prefix}priority = ?`
        );

        params.push(priority);
    }


    // ----------------------------------------------------------
    // FROM DATE
    // ----------------------------------------------------------

    if (startDate) {

        conditions.push(
            `DATE(${prefix}created_at) >= ?`
        );

        params.push(startDate);
    }


    // ----------------------------------------------------------
    // TO DATE
    // ----------------------------------------------------------

    if (endDate) {

        conditions.push(
            `DATE(${prefix}created_at) <= ?`
        );

        params.push(endDate);
    }


    // ----------------------------------------------------------
    // WHERE CLAUSE
    // ----------------------------------------------------------

    const whereClause =
        conditions.length > 0
            ? `WHERE ${conditions.join(" AND ")}`
            : "";


    return {
        whereClause,
        params
    };
}



// ============================================================
// GET DASHBOARD STATISTICS
// ============================================================

router.get("/stats", async (req, res) => {

    try {

        const {
            whereClause,
            params
        } = buildFilters(req);


        // ======================================================
        // SUMMARY
        // ======================================================

        const [summaryRows] = await db.query(
            `
            SELECT

                COUNT(*) AS total,

                SUM(
                    CASE
                        WHEN status = 'Pending'
                        THEN 1
                        ELSE 0
                    END
                ) AS pending,

                SUM(
                    CASE
                        WHEN status = 'In Progress'
                        THEN 1
                        ELSE 0
                    END
                ) AS inProgress,

                SUM(
                    CASE
                        WHEN status = 'Resolved'
                        THEN 1
                        ELSE 0
                    END
                ) AS resolved,

                SUM(
                    CASE
                        WHEN status = 'Rejected'
                        THEN 1
                        ELSE 0
                    END
                ) AS rejected

            FROM Complaints

            ${whereClause}
            `,
            params
        );


        const summary = summaryRows[0] || {};


        // ======================================================
        // CONVERT VALUES TO NUMBERS
        // ======================================================

        const total =
            Number(summary.total || 0);

        const pending =
            Number(summary.pending || 0);

        const inProgress =
            Number(summary.inProgress || 0);

        const resolved =
            Number(summary.resolved || 0);

        const rejected =
            Number(summary.rejected || 0);


        // ======================================================
        // RESOLUTION RATE
        // ======================================================

        const resolutionRate =
            total > 0
                ? Math.round(
                    (resolved / total) * 100
                )
                : 0;


        // ======================================================
        // RECENT COMPLAINTS
        // ======================================================

        const {
            whereClause: complaintWhere,
            params: complaintParams
        } = buildFilters(req, "c");


        const [recentComplaints] = await db.query(
            `
            SELECT

                c.id,

                c.user_id,

                u.name AS user_name,

                u.email AS user_email,

                c.title,

                c.description,

                c.category,

                c.priority,

                c.status,

                c.created_at,

                c.updated_at

            FROM Complaints c

            LEFT JOIN Users u
                ON c.user_id = u.id

            ${complaintWhere}

            ORDER BY c.created_at DESC

            LIMIT 10
            `,
            complaintParams
        );


        // ======================================================
        // RESPONSE
        // ======================================================

        res.json({

            success: true,

            data: {

                summary: {

                    total,

                    pending,

                    inProgress,

                    resolved,

                    rejected,

                    resolutionRate

                },

                recentComplaints

            }

        });

    } catch (error) {

        console.error(
            "Error fetching dashboard statistics:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Failed to fetch dashboard statistics",

            error:
                error.message

        });

    }

});



// ============================================================
// GET DASHBOARD CHARTS
// ============================================================

router.get("/charts", async (req, res) => {

    try {

        const {
            whereClause,
            params
        } = buildFilters(req);


        // ======================================================
        // STATUS DISTRIBUTION
        // ======================================================

        const [statusDistribution] = await db.query(
            `
            SELECT

                status,

                COUNT(*) AS count

            FROM Complaints

            ${whereClause}

            GROUP BY status

            ORDER BY count DESC
            `,
            params
        );


        // ======================================================
        // CATEGORY DISTRIBUTION
        // ======================================================

        const [categoryDistribution] = await db.query(
            `
            SELECT

                category,

                COUNT(*) AS count

            FROM Complaints

            ${whereClause}

            GROUP BY category

            ORDER BY count DESC
            `,
            params
        );


        // ======================================================
        // PRIORITY DISTRIBUTION
        // ======================================================

        const [priorityDistribution] = await db.query(
            `
            SELECT

                priority,

                COUNT(*) AS count

            FROM Complaints

            ${whereClause}

            GROUP BY priority

            ORDER BY count DESC
            `,
            params
        );


        // ======================================================
        // MONTHLY TRENDS
        //
        // IMPORTANT:
        // We group directly by YYYY-MM.
        //
        // This avoids MySQL ONLY_FULL_GROUP_BY errors.
        // ======================================================

        const [monthlyTrends] = await db.query(
            `
            SELECT

                DATE_FORMAT(
                    MIN(created_at),
                    '%Y-%m'
                ) AS month,

                DATE_FORMAT(
                    MIN(created_at),
                    '%b %Y'
                ) AS monthLabel,

                COUNT(*) AS total,

                SUM(
                    CASE
                        WHEN status = 'Pending'
                        THEN 1
                        ELSE 0
                    END
                ) AS pending,

                SUM(
                    CASE
                        WHEN status = 'In Progress'
                        THEN 1
                        ELSE 0
                    END
                ) AS inProgress,

                SUM(
                    CASE
                        WHEN status = 'Resolved'
                        THEN 1
                        ELSE 0
                    END
                ) AS resolved,

                SUM(
                    CASE
                        WHEN status = 'Rejected'
                        THEN 1
                        ELSE 0
                    END
                ) AS rejected

            FROM Complaints

            ${whereClause}

            GROUP BY
                DATE_FORMAT(created_at, '%Y-%m')

            ORDER BY
                DATE_FORMAT(created_at, '%Y-%m')

            LIMIT 12
            `,
            params
        );


        // ======================================================
        // RESPONSE
        // ======================================================

        res.json({

            success: true,

            data: {

                statusDistribution,

                categoryDistribution,

                priorityDistribution,

                monthlyTrends

            }

        });

    } catch (error) {

        console.error(
            "Error fetching dashboard charts:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Failed to fetch dashboard charts",

            error:
                error.message

        });

    }

});



// ============================================================
// GET DASHBOARD SUMMARY / RECENT COMPLAINTS
// ============================================================

router.get("/", async (req, res) => {

    try {

        const {
            whereClause,
            params
        } = buildFilters(req, "c");


        const [complaints] = await db.query(
            `
            SELECT

                c.id,

                c.title,

                c.category,

                c.priority,

                c.status,

                c.created_at

            FROM Complaints c

            ${whereClause}

            ORDER BY c.created_at DESC

            LIMIT 5
            `,
            params
        );


        // ======================================================
        // RESPONSE
        // ======================================================

        res.json({

            success: true,

            data: {

                recentComplaints:
                    complaints

            }

        });

    } catch (error) {

        console.error(
            "Error fetching dashboard:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Failed to fetch dashboard",

            error:
                error.message

        });

    }

});



// ============================================================
// EXPORT ROUTER
// ============================================================

module.exports = router;