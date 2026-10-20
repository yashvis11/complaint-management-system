// =========================================================
// CREATE COMPLAINT PAGE JAVASCRIPT
// =========================================================

const API_BASE_URL = "http://localhost:3000";

const complaintForm = document.getElementById("complaintForm");
const submitButton = document.getElementById("submitButton");

const errorMessage = document.getElementById("errorMessage");
const successMessage = document.getElementById("successMessage");


// =========================================================
// FORM SUBMISSION
// =========================================================

complaintForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    // Hide previous messages
    errorMessage.classList.add("d-none");
    successMessage.classList.add("d-none");

    // Get form values
    const title = document.getElementById("title").value.trim();
    const description = document.getElementById("description").value.trim();
    const category = document.getElementById("category").value;
    const priority = document.getElementById("priority").value;


    // =====================================================
    // CLIENT-SIDE VALIDATION
    // =====================================================

    if (!title || !description || !category || !priority) {

        errorMessage.textContent =
            "Please fill in all the required fields.";

        errorMessage.classList.remove("d-none");

        return;
    }

        // =====================================================
    // IMAGE CHECK (optional field)
    // =====================================================

    const imageFile = document.getElementById("image").files[0];

    if (imageFile && imageFile.size > 5 * 1024 * 1024) {

        errorMessage.textContent =
            "Image must be under 5 MB.";

        errorMessage.classList.remove("d-none");

        return;
    }


    // =====================================================
    // BUILD FORM DATA (needed for file uploads)
    // =====================================================

    const formData = new FormData();

    formData.append("title", title);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("priority", priority);

    if (imageFile) {
        formData.append("image", imageFile);
    }


    // =====================================================
    // DISABLE BUTTON WHILE SUBMITTING
    // =====================================================

    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";


    try {

        // =================================================
        // SEND COMPLAINT TO BACKEND
        // =================================================

        const response = await fetch(
            `${API_BASE_URL}/api/complaints`,
            {
                method: "POST",
                credentials: "include",
                

                body: formData
            }
        );


        const result = await response.json();

        console.log("Create Complaint API:", result);


        // =================================================
        // HANDLE API ERROR
        // =================================================

        if (!response.ok || !result.success) {

            throw new Error(
                result.message ||
                "Failed to create complaint."
            );

        }


        // =================================================
        // SUCCESS
        // =================================================

        successMessage.textContent =
            "Complaint created successfully!";

        successMessage.classList.remove("d-none");


        // Reset form
        complaintForm.reset();


        // Redirect after a short delay
        setTimeout(() => {

            window.location.href = "complaints.html";

        }, 1000);


    } catch (error) {

        console.error(
            "Error creating complaint:",
            error
        );

        errorMessage.textContent =
            error.message ||
            "Something went wrong while creating the complaint.";

        errorMessage.classList.remove("d-none");

    } finally {

        // Re-enable button
        submitButton.disabled = false;
        submitButton.textContent = "Submit Complaint";

    }

});