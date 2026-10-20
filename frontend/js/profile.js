// =========================================================
// PROFILE PAGE JAVASCRIPT
// =========================================================

const API_BASE_URL = "http://localhost:3000";

const profileForm = document.getElementById("profileForm");

const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");

const editButton = document.getElementById("editButton");
const saveButton = document.getElementById("saveButton");
const cancelButton = document.getElementById("cancelButton");

const viewButtons = document.getElementById("viewButtons");
const editButtons = document.getElementById("editButtons");

const errorMessage = document.getElementById("errorMessage");
const successMessage = document.getElementById("successMessage");
const loadingMessage = document.getElementById("loadingMessage");

// Last values saved in the database (used by Cancel)
let currentUser = null;

// =========================================================
// EDIT MODE ON / OFF
// =========================================================

function setEditMode(isEditing) {
  // Only name and email become editable.
  // Role and member since always stay read-only.
  nameInput.readOnly = !isEditing;
  emailInput.readOnly = !isEditing;

  viewButtons.classList.toggle("d-none", isEditing);
  editButtons.classList.toggle("d-none", !isEditing);

  if (isEditing) {
    nameInput.focus();
  }
}

function fillForm(user) {
  nameInput.value = user.name;
  emailInput.value = user.email;
}

// =========================================================
// LOAD PROFILE
// =========================================================

async function loadProfile() {
  try {
    // =================================================
    // GET PROFILE FROM BACKEND
    // =================================================

    const response = await fetch(`${API_BASE_URL}/api/profile`, {
      method: "GET",
      credentials: "include",
    });

    // Not logged in -> go to login page
    if (response.status === 401) {
      window.location.href = "login.html";

      return;
    }

    const result = await response.json();

    console.log("Get Profile API:", result);

    // =================================================
    // HANDLE API ERROR
    // =================================================

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to load profile.");
    }

    // =================================================
    // FILL THE FORM
    // =================================================

    const user = result.data;

    currentUser = { name: user.name, email: user.email };

    fillForm(currentUser);

    // document.getElementById("role").value = user.role;
    document.getElementById("createdAt").value = new Date(
      user.created_at,
    ).toLocaleDateString();

    loadingMessage.classList.add("d-none");
    profileForm.classList.remove("d-none");
  } catch (error) {
    console.error("Error loading profile:", error);

    loadingMessage.classList.add("d-none");

    errorMessage.textContent =
      error.message || "Something went wrong while loading the profile.";

    errorMessage.classList.remove("d-none");
  }
}

loadProfile();

// =========================================================
// UPDATE PROFILE BUTTON (turn editing on)
// =========================================================

editButton.addEventListener("click", function () {
  errorMessage.classList.add("d-none");
  successMessage.classList.add("d-none");

  setEditMode(true);
});

// =========================================================
// CANCEL BUTTON (discard changes)
// =========================================================

cancelButton.addEventListener("click", function () {
  errorMessage.classList.add("d-none");
  successMessage.classList.add("d-none");

  fillForm(currentUser);

  setEditMode(false);
});

// =========================================================
// FORM SUBMISSION (Save changes)
// =========================================================

profileForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  // Hide previous messages
  errorMessage.classList.add("d-none");
  successMessage.classList.add("d-none");

  // Get form values
  const name = nameInput.value.trim();
  const email = emailInput.value.trim();

  // =====================================================
  // CLIENT-SIDE VALIDATION
  // =====================================================

  if (!name || !email) {
    errorMessage.textContent = "Please fill in all the required fields.";

    errorMessage.classList.remove("d-none");

    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errorMessage.textContent = "Please enter a valid email address.";

    errorMessage.classList.remove("d-none");

    return;
  }

  // =====================================================
  // DISABLE BUTTON WHILE SUBMITTING
  // =====================================================

  saveButton.disabled = true;
  cancelButton.disabled = true;
  saveButton.textContent = "Saving...";

  try {
    // =================================================
    // SEND UPDATE TO BACKEND
    // =================================================

    const response = await fetch(`${API_BASE_URL}/api/profile/update`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        name: name,
        email: email,
      }),
    });

    const result = await response.json();

    console.log("Update Profile API:", result);

    // =================================================
    // HANDLE API ERROR
    // =================================================

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to update profile.");
    }

    // =================================================
    // SUCCESS
    // =================================================

    currentUser = { name: result.data.name, email: result.data.email };

    fillForm(currentUser);

    setEditMode(false);

    successMessage.textContent = "Profile updated successfully!";

    successMessage.classList.remove("d-none");
  } catch (error) {
    console.error("Error updating profile:", error);

    errorMessage.textContent =
      error.message || "Something went wrong while updating the profile.";

    errorMessage.classList.remove("d-none");
  } finally {
    // Re-enable buttons
    saveButton.disabled = false;
    cancelButton.disabled = false;
    saveButton.textContent = "Save changes";
  }
});
