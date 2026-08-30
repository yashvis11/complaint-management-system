// =========================================================
// COMPLAINTS PAGE JAVASCRIPT
// =========================================================

const API_BASE_URL = window.location.origin;

const tableBody =
    document.getElementById("complaintsTableBody");


// =========================================================
// LOAD ALL COMPLAINTS
// =========================================================

async function loadComplaints() {

    try {

        const response = await fetch(
            `${API_BASE_URL}/api/complaints`
        );

        const result = await response.json();

        console.log("Complaints API:", result);


        if (!response.ok || !result.success) {

            throw new Error(
                result.message ||
                "Failed to load complaints"
            );

        }


        const complaints = result.data;


        // -------------------------------------------------
        // NO COMPLAINTS
        // -------------------------------------------------

        if (!complaints || complaints.length === 0) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="7"
                        class="text-center text-muted py-5">
                        No complaints found.
                    </td>
                </tr>
            `;

            return;
        }


        // -------------------------------------------------
        // CLEAR TABLE
        // -------------------------------------------------

        tableBody.innerHTML = "";


        // -------------------------------------------------
        // CREATE ROW FOR EACH COMPLAINT
        // -------------------------------------------------

        complaints.forEach(complaint => {

            const row = document.createElement("tr");


            row.innerHTML = `

                <!-- ID -->

                <td>
                    <strong>
                        #${complaint.id}
                    </strong>
                </td>


                <!-- TITLE -->

                <td>
                    ${escapeHtml(complaint.title)}
                </td>


                <!-- CATEGORY -->

                <td>
                    ${escapeHtml(complaint.category)}
                </td>


                <!-- PRIORITY -->

                <td>

                    <span class="badge ${getPriorityClass(
                complaint.priority
            )}">

                        ${escapeHtml(
                complaint.priority
            )}

                    </span>

                </td>


                <!-- STATUS -->

                <td>

                    <span class="badge ${getStatusClass(
                complaint.status
            )}">

                        ${escapeHtml(
                complaint.status
            )}

                    </span>

                </td>


                <!-- DATE -->

                <td>
                    ${formatDate(
                complaint.created_at
            )}
                </td>


                <!-- ACTIONS -->

                <td>

                    <div class="d-flex gap-2">

                        <!-- VIEW -->

                        <a
                            href="complaint-details.html?id=${complaint.id}"
                            class="btn btn-sm btn-outline-primary">

                            View

                        </a>


                        <!-- EDIT -->

                        <a
                            href="edit-complaint.html?id=${complaint.id}"
                            class="btn btn-sm btn-outline-warning">

                            Edit

                        </a>

                    </div>

                </td>

            `;


            tableBody.appendChild(row);

        });


    } catch (error) {

        console.error(
            "Error loading complaints:",
            error
        );


        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="text-center text-danger py-5">

                    Failed to load complaints.

                </td>

            </tr>

        `;

    }

}


// =========================================================
// ESCAPE HTML
// =========================================================

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");

}


// =========================================================
// PRIORITY BADGE
// =========================================================

function getPriorityClass(priority) {

    switch (priority) {

        case "High":
            return "bg-danger";

        case "Medium":
            return "bg-warning text-dark";

        case "Low":
            return "bg-success";

        default:
            return "bg-secondary";

    }

}


// =========================================================
// STATUS BADGE
// =========================================================

function getStatusClass(status) {

    switch (status) {

        case "Pending":
            return "bg-warning text-dark";

        case "In Progress":
            return "bg-info text-dark";

        case "Resolved":
            return "bg-success";

        case "Rejected":
            return "bg-danger";

        default:
            return "bg-secondary";

    }

}


// =========================================================
// FORMAT DATE
// =========================================================

function formatDate(dateValue) {

    if (!dateValue) {

        return "-";

    }


    const date =
        new Date(dateValue);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "-";

    }


    return date.toLocaleDateString(
        "en-GB"
    );

}


// =========================================================
// START
// =========================================================

loadComplaints();