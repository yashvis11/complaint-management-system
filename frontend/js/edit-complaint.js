// =========================================================
// EDIT COMPLAINT PAGE JAVASCRIPT
// =========================================================

const API_BASE_URL = "http://localhost:3000";

const loadingMessage = document.getElementById("loadingMessage");
const errorMessage = document.getElementById("errorMessage");
const editFormContainer = document.getElementById("editFormContainer");

const editComplaintForm = document.getElementById("editComplaintForm");
const saveButton = document.getElementById("saveButton");

const formErrorMessage = document.getElementById("formErrorMessage");
const successMessage = document.getElementById("successMessage");


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

        showPageError("No complaint ID was provided.");

        return;
    }


    try {

        const response = await fetch(
            `${API_BASE_URL}/api/complaints/${complaintId}`,
            {
                credentials: "include"
            }
        );

        const result = await response.json();

        console.log("Complaint Details API:", result);


        // -------------------------------------------------
        // HANDLE API ERROR
        // -------------------------------------------------

        if (!response.ok || !result.success) {

            throw new Error(
                result.message ||
                "Failed to load complaint."
            );

        }


        // Your backend currently returns:
        // { success: true, complaint: {...} }

        const complaint = result.complaint;


        if (!complaint) {

            throw new Error(
                "Complaint was not found."
            );

        }


        // -------------------------------------------------
        // CHECK COMPLAINT STATUS
        // -------------------------------------------------

        if (complaint.status !== "Pending") {

            showPageError(
                "Only pending complaints can be edited."
            );

            return;
        }


        // -------------------------------------------------
        // FILL FORM
        // -------------------------------------------------

        document.getElementById("complaintId").value =
            `#${complaint.id}`;

        document.getElementById("title").value =
            complaint.title || "";

        document.getElementById("description").value =
            complaint.description || "";

        document.getElementById("category").value =
            complaint.category || "";

        document.getElementById("priority").value =
            complaint.priority || "Medium";

        if (complaint.image_path) {
            document.getElementById("currentImage").src =
            `${API_BASE_URL}/${complaint.image_path}`;

            document
                .getElementById("currentImageSection")
                .classList.remove("d-none");
        }
        // -------------------------------------------------
        // DISPLAY STATUS
        // -------------------------------------------------

        const statusBadge =
            document.getElementById("statusBadge");

        statusBadge.textContent =
            complaint.status || "-";

        statusBadge.className =
            `badge ${getStatusClass(complaint.status)}`;


        // -------------------------------------------------
        // SHOW FORM
        // -------------------------------------------------

        loadingMessage.classList.add("d-none");

        editFormContainer.classList.remove("d-none");


    } catch (error) {

        console.error(
            "Error loading complaint:",
            error
        );

        showPageError(
            error.message ||
            "Failed to load complaint."
        );

    }

}


// =========================================================
// UPDATE COMPLAINT
// =========================================================

editComplaintForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        // Hide previous messages
        formErrorMessage.classList.add("d-none");
        successMessage.classList.add("d-none");


        // -------------------------------------------------
        // GET FORM VALUES
        // -------------------------------------------------

        const title =
            document.getElementById("title").value.trim();

        const description =
            document.getElementById("description").value.trim();

        const category =
            document.getElementById("category").value;

        const priority =
            document.getElementById("priority").value;


        // -------------------------------------------------
        // CLIENT-SIDE VALIDATION
        // -------------------------------------------------

        if (
            !title ||
            !description ||
            !category ||
            !priority
        ) {

            formErrorMessage.textContent =
                "Please fill in all the required fields.";

            formErrorMessage.classList.remove("d-none");

            return;
        }


        // -------------------------------------------------
        // DISABLE BUTTON
        // -------------------------------------------------

        saveButton.disabled = true;
        saveButton.textContent = "Saving...";


        try {

            // -------------------------------------------------
            // SEND UPDATE REQUEST
            // -------------------------------------------------

            const response = await fetch(
                `${API_BASE_URL}/api/complaints/${complaintId}`,
                {
                    method: "PUT",
                    credentials: "include",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        title: title,
                        description: description,
                        category: category,
                        priority: priority
                    })
                }
            );


            const result = await response.json();

            console.log("Update Complaint API:", result);


            // -------------------------------------------------
            // HANDLE API ERROR
            // -------------------------------------------------

            if (!response.ok || !result.success) {

                throw new Error(
                    result.message ||
                    "Failed to update complaint."
                );

            }


            // -------------------------------------------------
            // SUCCESS
            // -------------------------------------------------

            successMessage.textContent =
                "Complaint updated successfully!";

            successMessage.classList.remove("d-none");


            // Redirect after a short delay
            setTimeout(() => {

                window.location.href =
                    `complaint-details.html?id=${complaintId}`;

            }, 1000);


        } catch (error) {

            console.error(
                "Error updating complaint:",
                error
            );

            formErrorMessage.textContent =
                error.message ||
                "Something went wrong while updating the complaint.";

            formErrorMessage.classList.remove("d-none");


        } finally {

            // Re-enable button
            saveButton.disabled = false;
            saveButton.textContent = "Save Changes";

        }

    }
);


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
// SHOW PAGE ERROR
// =========================================================

function showPageError(message) {

    loadingMessage.classList.add("d-none");

    editFormContainer.classList.add("d-none");

    errorMessage.textContent = message;

    errorMessage.classList.remove("d-none");

}


// =========================================================
// START
// =========================================================

loadComplaint();