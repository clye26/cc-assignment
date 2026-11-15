const API_URL = CONFIG.API_URL;
const API_KEY = CONFIG.API_KEY; 

const loginForm = document.getElementById("login-form");
if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;
        const errorDiv = document.getElementById("error-msg");

        errorDiv.classList.add("hidden");
        document.getElementById("error-text").textContent = "";

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "x-api-key": API_KEY
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || "Login failed.");
            }

            // Save login state, role, and username in browser storage
            localStorage.setItem("isLoggedIn", "true");
            localStorage.setItem("currentUser", data.username);
            localStorage.setItem("userRole", data.role); // 'staff' or 'customer'

            if (data.role === "staff") {
                window.location.href = "admin.html"; // Redirect staff to admin dashboard
            } else {
                window.location.href = "index.html"; // Redirect customers to the main shop
            }

        } catch (err) {
            document.getElementById("error-text").textContent = err.message;
            errorDiv.classList.remove("hidden");
        }
    });
}