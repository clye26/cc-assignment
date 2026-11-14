const API_URL = CONFIG.API_URL;

const loginForm = document.getElementById("login-form");
if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;
        const errorDiv = document.getElementById("error-msg");

        errorDiv.classList.add("hidden");

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || "Login failed.");
            }

            // Save login state in browser storage and redirect
            localStorage.setItem("isStaffLoggedIn", "true");
            localStorage.setItem("staffUsername", data.username);
            window.location.href = "admin.html";

        } catch (err) {
            errorDiv.textContent = err.message;
            errorDiv.classList.remove("hidden");
        }
    });
}