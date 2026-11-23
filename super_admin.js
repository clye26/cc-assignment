const API_URL = CONFIG.API_URL;
const API_KEY = CONFIG.API_KEY;

// ============================================================
// SESSION & ROLE GUARD
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const userRole = localStorage.getItem("userRole");
    const currentUser = localStorage.getItem("currentUser") || "Super Admin";

    if (isLoggedIn !== "true" || userRole !== "super_admin") {
        window.location.href = "login.html";
        return;
    }

    const welcomeUserEl = document.getElementById("welcome-user");
    if (welcomeUserEl) {
        welcomeUserEl.textContent = currentUser;
    }

    bindUIEvents();
    loadAllAccounts();
});

// ============================================================
// HELPER: API REQUEST WRAPPER
// ============================================================
async function apiRequest(endpoint, options = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            "x-api-key": API_KEY,
            ...(options.headers || {})
        }
    });

    let data = {};
    try {
        data = await response.json();
    } catch (_) {
        data = {};
    }

    if (!response.ok) {
        throw new Error(data.detail || `Request failed (${response.status})`);
    }

    return data;
}

// ============================================================
// HELPER: ESCAPE HTML TO PREVENT XSS
// ============================================================
function escapeHtml(value) {
    if (value === null || value === undefined) return "";
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ============================================================
// FEEDBACK MODALS (SUCCESS & ERROR)
// ============================================================
function showSuccessModal(title, message) {
    document.getElementById("success-modal-title").textContent = title;
    document.getElementById("success-modal-message").textContent = message;
    document.getElementById("success-modal").classList.remove("hidden");
}

function hideSuccessModal() {
    document.getElementById("success-modal").classList.add("hidden");
}

function showErrorModal(title, message) {
    document.getElementById("error-modal-title").textContent = title;
    document.getElementById("error-modal-message").textContent = message;
    document.getElementById("error-modal").classList.remove("hidden");
}

function hideErrorModal() {
    document.getElementById("error-modal").classList.add("hidden");
}

// ============================================================
// LOAD STAFF & CUSTOMER ACCOUNTS
// ============================================================
async function loadAllAccounts() {
    await Promise.all([loadStaffAccounts(), loadCustomerAccounts()]);
}

async function loadStaffAccounts() {
    const tbody = document.getElementById("staff-accounts-tbody");
    tbody.innerHTML = `<tr><td colspan="5" class="shop-loading">Loading staff accounts...</td></tr>`;

    try {
        const data = await apiRequest("/super-admin/staff");
        renderAccountRows(tbody, data.users || [], "staff");
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" class="shop-error">Failed to load staff accounts: ${escapeHtml(err.message)}</td></tr>`;
    }
}

async function loadCustomerAccounts() {
    const tbody = document.getElementById("customer-accounts-tbody");
    tbody.innerHTML = `<tr><td colspan="5" class="shop-loading">Loading customer accounts...</td></tr>`;

    try {
        const data = await apiRequest("/super-admin/customers");
        renderAccountRows(tbody, data.users || [], "customer");
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" class="shop-error">Failed to load customer accounts: ${escapeHtml(err.message)}</td></tr>`;
    }
}

function renderAccountRows(tbody, users, role) {
    if (!users.length) {
        tbody.innerHTML = `<tr><td colspan="5" class="shop-empty">No ${escapeHtml(role)} accounts found.</td></tr>`;
        return;
    }

    tbody.innerHTML = users.map((user) => {
        const isActive = user.is_active !== false;
        const statusBadge = isActive
            ? `<span class="stock-badge stock-good">Active</span>`
            : `<span class="stock-badge stock-out">Deactivated</span>`;

        const toggleBtnClass = isActive ? "deactivate" : "activate";
        const toggleBtnIcon = isActive ? "fa-user-slash" : "fa-user-check";
        const toggleBtnLabel = isActive ? "Deactivate" : "Activate";
        const nextStatus = !isActive;

        return `
            <tr>
                <td style="padding: 10px 12px; border: 1px solid #d1d5db;">${escapeHtml(user.id)}</td>
                <td style="padding: 10px 12px; border: 1px solid #d1d5db; font-weight: 600;">${escapeHtml(user.username)}</td>
                <td style="padding: 10px 12px; border: 1px solid #d1d5db;">${escapeHtml(user.email)}</td>
                <td style="padding: 10px 12px; border: 1px solid #d1d5db;">${statusBadge}</td>
                <td style="padding: 10px 12px; border: 1px solid #d1d5db;">
                    <button
                        type="button"
                        class="account-action-btn reset-pw"
                        data-action="reset-password"
                        data-role="${escapeHtml(role)}"
                        data-id="${escapeHtml(user.id)}"
                        data-username="${escapeHtml(user.username)}"
                    >
                        <i class="fa-solid fa-key"></i> Reset Password
                    </button>
                    <button
                        type="button"
                        class="account-action-btn ${toggleBtnClass}"
                        data-action="toggle-status"
                        data-role="${escapeHtml(role)}"
                        data-id="${escapeHtml(user.id)}"
                        data-username="${escapeHtml(user.username)}"
                        data-next-status="${nextStatus}"
                    >
                        <i class="fa-solid ${toggleBtnIcon}"></i> ${toggleBtnLabel}
                    </button>
                </td>
            </tr>
        `;
    }).join("");
}

// ============================================================
// CREATE ACCOUNT HANDLER (AUTO-HASHED ON BACKEND)
// ============================================================
async function handleCreateAccount(e) {
    e.preventDefault();

    const role = document.getElementById("new-account-role").value;
    const username = document.getElementById("new-account-username").value.trim();
    const email = document.getElementById("new-account-email").value.trim();
    const password = document.getElementById("new-account-password").value;
    const isActive = document.getElementById("new-account-status").value === "true";

    const submitBtn = document.getElementById("create-account-submit-btn");
    submitBtn.disabled = true;

    try {
        const res = await apiRequest("/super-admin/users", {
            method: "POST",
            body: JSON.stringify({
                role,
                username,
                email,
                password,
                is_active: isActive
            })
        });

        document.getElementById("create-account-form").reset();
        document.getElementById("new-account-status").value = "true";

        showSuccessModal(
            "Account Created",
            res.message || `${role.toUpperCase()} account '${username}' created with a hashed password.`
        );

        if (role === "staff") {
            await loadStaffAccounts();
        } else {
            await loadCustomerAccounts();
        }
    } catch (err) {
        showErrorModal("Account Creation Failed", err.message);
    } finally {
        submitBtn.disabled = false;
    }
}

// ============================================================
// RESET PASSWORD MODAL & HANDLER
// ============================================================
let activeResetTarget = null;

function openResetPasswordModal(role, userId, username) {
    activeResetTarget = { role, userId, username };
    document.getElementById("reset-target-label").textContent = `${username} (${role.toUpperCase()} #${userId})`;
    document.getElementById("reset-new-password").value = "";
    document.getElementById("reset-password-modal").classList.remove("hidden");
    document.getElementById("reset-new-password").focus();
}

function closeResetPasswordModal() {
    activeResetTarget = null;
    document.getElementById("reset-password-form").reset();
    document.getElementById("reset-password-modal").classList.add("hidden");
}

async function handleResetPasswordSubmit(e) {
    e.preventDefault();
    if (!activeResetTarget) return;

    const newPassword = document.getElementById("reset-new-password").value;
    const { role, userId, username } = activeResetTarget;

    try {
        const res = await apiRequest(`/super-admin/users/${role}/${userId}/password`, {
            method: "PATCH",
            body: JSON.stringify({ new_password: newPassword })
        });

        closeResetPasswordModal();
        showSuccessModal(
            "Password Reset",
            res.message || `Password for '${username}' has been updated and hashed.`
        );
    } catch (err) {
        showErrorModal("Password Reset Failed", err.message);
    }
}

// ============================================================
// ACTIVATE / DEACTIVATE ACCOUNT HANDLER
// ============================================================
async function handleToggleAccountStatus(role, userId, username, nextStatus) {
    try {
        const res = await apiRequest(`/super-admin/users/${role}/${userId}/status`, {
            method: "PATCH",
            body: JSON.stringify({ is_active: nextStatus })
        });

        const actionWord = nextStatus ? "activated" : "deactivated";
        showSuccessModal(
            "Account Status Updated",
            res.message || `${role.toUpperCase()} account '${username}' has been ${actionWord}.`
        );

        if (role === "staff") {
            await loadStaffAccounts();
        } else {
            await loadCustomerAccounts();
        }
    } catch (err) {
        showErrorModal("Status Update Failed", err.message);
    }
}

// ============================================================
// TABLE ACTION DELEGATION & UI EVENT LISTENERS
// ============================================================
function handleTableActionClick(e) {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;

    const action = btn.dataset.action;
    const role = btn.dataset.role;
    const userId = Number(btn.dataset.id);
    const username = btn.dataset.username;

    if (action === "reset-password") {
        openResetPasswordModal(role, userId, username);
    } else if (action === "toggle-status") {
        const nextStatus = btn.dataset.nextStatus === "true";
        handleToggleAccountStatus(role, userId, username, nextStatus);
    }
}

function performLogout() {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");
    localStorage.removeItem("superAdminId");
    window.location.href = "login.html";
}

function bindUIEvents() {
    // Create account form
    document.getElementById("create-account-form").addEventListener("submit", handleCreateAccount);

    // Refresh buttons
    document.getElementById("refresh-staff-btn").addEventListener("click", loadStaffAccounts);
    document.getElementById("refresh-customers-btn").addEventListener("click", loadCustomerAccounts);

    // Delegated row actions
    document.getElementById("staff-accounts-tbody").addEventListener("click", handleTableActionClick);
    document.getElementById("customer-accounts-tbody").addEventListener("click", handleTableActionClick);

    // Reset password modal
    document.getElementById("reset-password-form").addEventListener("submit", handleResetPasswordSubmit);
    document.getElementById("close-reset-modal-btn").addEventListener("click", closeResetPasswordModal);
    document.getElementById("cancel-reset-password-btn").addEventListener("click", closeResetPasswordModal);

    // Success & Error modals
    document.getElementById("close-success-modal-x").addEventListener("click", hideSuccessModal);
    document.getElementById("close-success-modal-btn").addEventListener("click", hideSuccessModal);
    document.getElementById("close-error-modal-x").addEventListener("click", hideErrorModal);
    document.getElementById("close-error-modal-btn").addEventListener("click", hideErrorModal);

    // Logout modal
    const logoutModal = document.getElementById("logout-modal");
    document.getElementById("logout-btn").addEventListener("click", () => {
        logoutModal.classList.remove("hidden");
    });
    document.getElementById("close-logout-modal-x").addEventListener("click", () => {
        logoutModal.classList.add("hidden");
    });
    document.getElementById("cancel-logout-btn").addEventListener("click", () => {
        logoutModal.classList.add("hidden");
    });
    document.getElementById("confirm-logout-btn").addEventListener("click", performLogout);
}