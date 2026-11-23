console.log("NEW LOGIN.JS LOADED");

const API_URL = CONFIG.API_URL;
const API_KEY = CONFIG.API_KEY;

const loginForm = document.getElementById("login-form");

if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;
        const errorDiv = document.getElementById("error-msg");
        const errorText = document.getElementById("error-text");

        errorDiv.classList.add("hidden");
        errorText.textContent = "";

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": API_KEY
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });

            const data = await response.json();

            console.log("LOGIN RESPONSE:", data);

            if (!response.ok) {
                throw new Error(data.detail || "Login failed.");
            }

            // ==================================================
            // SAVE BASIC LOGIN INFORMATION
            // ==================================================

            localStorage.setItem("isLoggedIn", "true");
            localStorage.setItem("currentUser", data.username);
            localStorage.setItem("userRole", data.role);

            // ==================================================
            // SAVE ROLE-SPECIFIC USER ID
            // ==================================================

            if (data.role === "customer") {

                // The backend is confirmed to return user_id.
                // Make sure we save it as a string in localStorage.

                if (
                    data.user_id === undefined ||
                    data.user_id === null
                ) {
                    throw new Error(
                        "Login succeeded, but the customer ID was not returned by the server."
                    );
                }

                localStorage.setItem(
                    "userId",
                    String(data.user_id)
                );
                localStorage.removeItem("superAdminId");

                console.log(
                    "Customer userId saved:",
                    localStorage.getItem("userId")
                );

            } else if (data.role === "super_admin") {
                localStorage.removeItem("userId");
                if (data.user_id !== undefined && data.user_id !== null) {
                    localStorage.setItem("superAdminId", String(data.user_id));
                }
            } else {
                // Staff accounts do not need a customer user ID.
                localStorage.removeItem("userId");
                localStorage.removeItem("superAdminId");
            }

            // ==================================================
            // VERIFY SESSION BEFORE REDIRECT
            // ==================================================

            console.log("SESSION AFTER LOGIN:", {
                isLoggedIn: localStorage.getItem("isLoggedIn"),
                currentUser: localStorage.getItem("currentUser"),
                userRole: localStorage.getItem("userRole"),
                userId: localStorage.getItem("userId"),
                superAdminId: localStorage.getItem("superAdminId")
            });

            // ==================================================
            // REDIRECT
            // ==================================================

            if (data.role === "super_admin") {
                window.location.href = "super_admin.html";
            } else if (data.role === "staff") {
                window.location.href = "admin.html";
            } else {
                window.location.href = "index.html";
            }

        } catch (err) {

            console.error("LOGIN ERROR:", err);

            errorText.textContent = err.message;
            errorDiv.classList.remove("hidden");
        }
    });
}