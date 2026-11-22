// =========================================================
// REGISTER PAGE JAVASCRIPT
// =========================================================

const API_BASE_URL = "http://localhost:3000";

const registerForm = document.getElementById("registerForm");
const registerMessage = document.getElementById("registerMessage");

// =========================================================
// register
// =========================================================

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  // -------------------------------------------------
  // GET FORM VALUES
  // -------------------------------------------------

  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const role = document.getElementById("role").value.trim();
  const department = document.getElementById("department").value.trim();

  // -------------------------------------------------
  // SEND register REQUEST
  // -------------------------------------------------

  try {
    const registerResponse = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      credentials: "include",

      body: JSON.stringify({
        email: email,
        name: name,
        password: password,
        role: role,
        department: department
      }),
    });

    const result = await registerResponse.json();

    console.log("register API:", result);

    // -------------------------------------------------
    // register FAILED
    // -------------------------------------------------

    if (!registerResponse.ok || !result.success) {
      showMessage(result.message || "Something went wrong");

      return;
    }

    // -------------------------------------------------
    // register SUCCESSFUL
    // -------------------------------------------------

    showMessage(result.message || "Account created successfully");

    // Redirect after successful register
    setTimeout(() => {
      window.location.href = "login.html";
    }, 500);
  } catch (error) {
    console.error("register error:", error);

    showMessage("Unable to connect to the server.");
  }
});

// =========================================================
// SHOW MESSAGE
// =========================================================

function showMessage(message, type) {
  registerMessage.textContent = message;

  registerMessage.className = `alert alert-${type}`;
}
