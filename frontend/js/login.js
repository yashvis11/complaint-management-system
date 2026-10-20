
// =========================================================
// LOGIN PAGE JAVASCRIPT
// =========================================================

const API_BASE_URL = "http://localhost:3000";

const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");


// =========================================================
// LOGIN
// =========================================================

loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();


    // -------------------------------------------------
    // GET FORM VALUES
    // -------------------------------------------------

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;


    // -------------------------------------------------
    // SEND LOGIN REQUEST
    // -------------------------------------------------

    try {

        const response = await fetch(
            `${API_BASE_URL}/api/auth/login`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                credentials: "include",

                body: JSON.stringify({
                    email: email,
                    password: password
                })
            }
        );


        const result = await response.json();

        console.log("Login API:", result);


        // -------------------------------------------------
        // LOGIN FAILED
        // -------------------------------------------------

        if (!response.ok || !result.success) {

            showMessage(
                result.message || "Invalid email or password.",
                "danger"
            );

            return;
        }


        // -------------------------------------------------
        // LOGIN SUCCESSFUL
        // -------------------------------------------------

        showMessage(
            result.message || "Login successful.",
            "success"
        );


        // Redirect after successful login
        setTimeout(() => {

            window.location.href = "dashboard.html";

        }, 500);


    } catch (error) {

        console.error(
            "Login error:",
            error
        );

        showMessage(
            "Unable to connect to the server.",
            "danger"
        );

    }

});


// =========================================================
// SHOW MESSAGE
// =========================================================

function showMessage(message, type) {

    loginMessage.textContent = message;

    loginMessage.className = `alert alert-${type}`;

}

