
document.addEventListener("DOMContentLoaded", () => {
    // Create the back button
    const backButton = document.createElement("button");

    backButton.innerHTML = "&#8592; Back";
    backButton.type = "button";

    // Button styling
    backButton.style.cssText = `
        background-color: #ffffff;
        color: #2563eb;
        border: 1px solid #2563eb;
        padding: 9px 18px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        margin: 15px 20px;
        transition: 0.2s;
    `;

    backButton.addEventListener("mouseenter", () => {
        backButton.style.backgroundColor = "#2563eb";
        backButton.style.color = "#ffffff";
    });

    backButton.addEventListener("mouseleave", () => {
        backButton.style.backgroundColor = "#ffffff";
        backButton.style.color = "#2563eb";
    });

    backButton.addEventListener("click", () => {
        // Go to the previous page within the application
        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = "/pages/login.html";
        }
    });

    // Add button at the beginning of the page
    document.body.prepend(backButton);
});
