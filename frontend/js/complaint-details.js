// =========================================================
// COMPLAINT DETAILS PAGE JAVASCRIPT
// =========================================================

const API_BASE_URL = window.location.origin;

const loadingMessage = document.getElementById("loadingMessage");
const errorMessage = document.getElementById("errorMessage");
const complaintDetails = document.getElementById("complaintDetails");


// =========================================================
// GET COMPLAINT ID FROM URL
// =========================================================

const urlParams = new URLSearchParams(window.location.search);
const complaintId = urlParams.get("id");


// =========================================================
// LOAD COMPLAINT
// =========================================================

async function loadComplaint() {

    // -----------------------------------------------------
    // CHECK COMPLAINT ID
    // -----------------------------------------------------

    if (!complaintId) {

        showError("No complaint ID was provided.");

        return;
    }


    try {

        const response = await fetch(
            `${API_BASE_URL}/api/complaints/${complaintId}`
        );

        const result = await response.json();

        console.log("Complaint Details API:", result);


        // -------------------------------------------------
        // HANDLE API ERROR
        // -------------------------------------------------

        if (!response.ok || !result.success) {

            throw new Error(
                result.message ||
                "Failed to load complaint details."
            );

        }


        // Your backend currently returns:
        // { success: true, complaint: {...} }

        const complaint = result.complaint;


        if (!complaint) {

            throw new Error(
                "Complaint details were not found."
            );

        }


        // -------------------------------------------------
        // DISPLAY COMPLAINT
        // -------------------------------------------------

        displayComplaint(complaint);


    } catch (error) {

        console.error(
            "Error loading complaint:",
            error
        );

        showError(
            error.message ||
            "Failed to load complaint details."
        );

    }

}


// =========================================================
// DISPLAY COMPLAINT
// =========================================================

function displayComplaint(complaint) {

    document.getElementById("complaintId").textContent =
        `Complaint #${complaint.id}`;

    document.getElementById("complaintTitle").textContent =
        complaint.title || "-";

    document.getElementById("complaintCategory").textContent =
        complaint.category || "-";

    document.getElementById("complaintDescription").textContent =
        complaint.description || "-";


    // -----------------------------------------------------
    // PRIORITY
    // -----------------------------------------------------

    const priorityElement =
        document.getElementById("complaintPriority");

    priorityElement.textContent =
        complaint.priority || "-";

    priorityElement.className =
        `badge ${getPriorityClass(complaint.priority)}`;


    // -----------------------------------------------------
    // STATUS
    // -----------------------------------------------------

    const statusElement =
        document.getElementById("complaintStatus");

    statusElement.textContent =
        complaint.status || "-";

    statusElement.className =
        `badge fs-6 ${getStatusClass(complaint.status)}`;


    // -----------------------------------------------------
    // DATES
    // -----------------------------------------------------

    document.getElementById("complaintCreatedAt").textContent =
        formatDate(complaint.created_at);

    document.getElementById("complaintUpdatedAt").textContent =
        formatDate(complaint.updated_at);


    // -----------------------------------------------------
    // EDIT BUTTON
    // -----------------------------------------------------

    const editButton =
        document.getElementById("editButton");

    editButton.href =
        `edit-complaint.html?id=${complaint.id}`;


    // -----------------------------------------------------
    // SHOW DETAILS
    // -----------------------------------------------------

    loadingMessage.classList.add("d-none");

    complaintDetails.classList.remove("d-none");

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

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {

        return "-";

    }

    return date.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });

}


// =========================================================
// SHOW ERROR
// =========================================================

function showError(message) {

    loadingMessage.classList.add("d-none");

    complaintDetails.classList.add("d-none");

    errorMessage.textContent = message;

    errorMessage.classList.remove("d-none");

}


// =========================================================
// START
// =========================================================

loadComplaint();