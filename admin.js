const API_BASE = CONFIG.API_URL;
const API_KEY = CONFIG.API_KEY;

let editingToyId = null;
let toysCache = [];

// ============================================================ */
// MODAL HELPER FUNCTIONS (DEFINED FIRST SO THEY CAN BE CALLED)  */
// ============================================================ */

function showSuccessModal(message) {
    document.getElementById("success-modal-message").textContent = message;
    document.getElementById("success-modal").classList.remove("hidden");
}

function closeSuccessModal() {
    document.getElementById("success-modal").classList.add("hidden");
    cancelEdit();
    loadToys();
}

function showErrorModal(message) {
    document.getElementById("error-modal-message").textContent = message;
    document.getElementById("error-modal").classList.remove("hidden");
}

function closeErrorModal() {
    document.getElementById("error-modal").classList.add("hidden");
}

// Expose modal helpers globally
window.closeSuccessModal = closeSuccessModal;
window.closeErrorModal = closeErrorModal;

// 1. Guard check
if (localStorage.getItem("isLoggedIn") !== "true" || localStorage.getItem("userRole") !== "staff") {
    window.location.href = "login.html";
} else {
    const welcomeUser = document.getElementById("welcome-user");

    if (welcomeUser) {
        welcomeUser.textContent = `${localStorage.getItem("currentUser")}`;
    }
}

// 2. Logout handler
const logoutBtn = document.getElementById("logout-btn");

if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        localStorage.clear();
        window.location.href = "login.html";
    });
}

// 3. Stock status badge
function getStockBadge(stock) {
    const quantity = Number(stock) || 0;

    if (quantity === 0) {
        return `<span class="stock-badge stock-out">Out of Stock</span>`;
    }

    if (quantity <= 5) {
        return `<span class="stock-badge stock-low">Low Stock (${quantity})</span>`;
    }

    return `<span class="stock-badge stock-good">In Stock (${quantity})</span>`;
}

// 4. Fetch and render toys
async function loadToys() {
    try {
        const res = await fetch(`${API_BASE}/toys`, {
            headers: { "x-api-key": API_KEY }
        });

        let data = await res.json();

        toysCache = Array.isArray(data) ? data : (data.toys || data.data || []);

        toysCache.sort((a, b) => a.id - b.id);

        const tbody = document.getElementById("toy-table-body");

        if (!tbody) return;

        tbody.innerHTML = "";

        if (toysCache.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="padding: 16px; text-align: center; color: #6b7280;">
                        No toys found in the database.
                    </td>
                </tr>
            `;
            return;
        }

        toysCache.forEach(toy => {
            tbody.innerHTML += `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px; border: 1px solid #b3b3b3;">${toy.id}</td>
                    <td style="padding: 12px; border: 1px solid #b3b3b3; font-weight: 600;">${toy.title}</td>
                    <td style="padding: 12px; border: 1px solid #b3b3b3;">${toy.brand}</td>
                    <td style="padding: 12px; border: 1px solid #b3b3b3;">₱${toy.price}</td>
                    <td style="padding: 12px; border: 1px solid #b3b3b3;">${getStockBadge(toy.stock)}</td>
                    <td style="padding: 12px; border: 1px solid #b3b3b3;">
                        <button onclick="viewToy(${toy.id})" style="background: #417bd8; color: #ffffff; border: none; padding: 6px 10px; border-radius: 8px; font-size: 0.75rem; cursor: pointer; margin-right: 4px;">View</button>
                        <button onclick="editToy(${toy.id})" style="background: #f5c02e; color: #ffffff; border: none; padding: 6px 10px; border-radius: 8px; font-size: 0.75rem; cursor: pointer; margin-right: 4px;">Edit</button>
                        <button onclick="deleteToy(${toy.id})" style="background: #d84141; color: #ffffff; border: none; padding: 6px 10px; border-radius: 8px; font-size: 0.75rem; cursor: pointer;">Delete</button>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        console.error("Failed to load toys:", err);
    }
}

// 5. View toy details
function viewToy(id) {
    const toy = toysCache.find(t => t.id === id);

    if (!toy) return;

    document.getElementById("details-title").textContent = toy.title || "Toy Details";
    document.getElementById("details-id").textContent = toy.id ?? "";
    document.getElementById("details-title-value").textContent = toy.title || "";
    document.getElementById("details-brand").textContent = toy.brand || "";
    document.getElementById("details-year").textContent = toy.year || "";
    document.getElementById("details-genre").textContent = toy.genre || "";
    document.getElementById("details-price").textContent = toy.price !== undefined && toy.price !== null ? `$${toy.price}` : "";
    document.getElementById("details-stock").innerHTML = getStockBadge(toy.stock);
    document.getElementById("details-rating").textContent = toy.rating || "";
    document.getElementById("details-age").textContent = toy.age_range || "";
    document.getElementById("details-dimensions").textContent = toy.dimensions || "";
    document.getElementById("details-height").textContent = toy.height || "";
    document.getElementById("details-weight").textContent = toy.weight || "";
    document.getElementById("details-image").textContent = toy.image || "";
    document.getElementById("details-description").textContent = toy.description || "";

    document.getElementById("toy-details-modal").classList.remove("hidden");
}

// 6. Close toy details modal
function closeToyDetails() {
    document.getElementById("toy-details-modal").classList.add("hidden");
}

// 7. Populate form with toy details for editing
function editToy(id) {
    const toy = toysCache.find(t => t.id === id);

    if (!toy) return;

    editingToyId = toy.id;

    document.getElementById("toy-title").value = toy.title || "";
    document.getElementById("toy-brand").value = toy.brand || "";
    document.getElementById("toy-year").value = toy.year || "";
    document.getElementById("toy-genre").value = toy.genre || "";
    document.getElementById("toy-price").value = toy.price || "";
    document.getElementById("toy-stock").value = toy.stock || "";
    document.getElementById("toy-image").value = toy.image || "";
    document.getElementById("toy-rating").value = toy.rating || "";
    document.getElementById("toy-age").value = toy.age_range || "";
    document.getElementById("toy-dimensions").value = toy.dimensions || "";
    document.getElementById("toy-height").value = toy.height || "";
    document.getElementById("toy-weight").value = toy.weight || "";
    document.getElementById("toy-desc").value = toy.description || "";

    document.getElementById("form-title").textContent = `Edit Toy (ID: ${toy.id})`;

    const submitBtn = document.getElementById("form-submit-btn");
    submitBtn.textContent = "Update Toy in Database";
    submitBtn.className = "add-toy-btn update-mode-btn";

    document.getElementById("cancel-edit-btn").classList.remove("hidden");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

// 8. Cancel edit mode
function cancelEdit() {
    editingToyId = null;

    document.getElementById("add-toy-form").reset();
    document.getElementById("form-title").textContent = "Add New Toy";

    const submitBtn = document.getElementById("form-submit-btn");
    submitBtn.textContent = "Add Toy to Database";
    submitBtn.className = "add-toy-btn";

    document.getElementById("cancel-edit-btn").classList.add("hidden");
}

// Expose general functions globally
window.cancelEdit = cancelEdit;
window.editToy = editToy;
window.viewToy = viewToy;
window.closeToyDetails = closeToyDetails;
window.deleteToy = deleteToy;

// 9. Handle form submission
const addToyForm = document.getElementById("add-toy-form");

if (addToyForm) {
    addToyForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const toyPayload = {
            title: document.getElementById("toy-title").value,
            brand: document.getElementById("toy-brand").value,
            year: parseInt(document.getElementById("toy-year").value),
            genre: document.getElementById("toy-genre").value,
            price: parseFloat(document.getElementById("toy-price").value),
            stock: parseInt(document.getElementById("toy-stock").value),
            image: document.getElementById("toy-image").value,
            description: document.getElementById("toy-desc").value,
            rating: document.getElementById("toy-rating").value,
            age_range: document.getElementById("toy-age").value,
            dimensions: document.getElementById("toy-dimensions").value,
            height: document.getElementById("toy-height").value,
            weight: document.getElementById("toy-weight").value
        };

        let url = `${API_BASE}/toys`;
        let method = "POST";

        if (editingToyId !== null) {
            url = `${API_BASE}/toys/${editingToyId}`;
            method = "PUT";
            toyPayload.id = editingToyId;
        }

        try {
            const res = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": API_KEY
                },
                body: JSON.stringify(toyPayload)
            });

            if (res.ok) {
                const successMsg = editingToyId ? "Toy successfully updated!" : "Toy successfully added!";
                showSuccessModal(successMsg);
            } else {
                const errData = await res.json();
                
                // Parse FastAPI/Pydantic validation error cleanly for the modal
                let errorMessage = "";
                if (Array.isArray(errData.detail)) {
                    errorMessage = errData.detail.map(err => `${err.loc.join(' -> ')}: ${err.msg}`).join('\n');
                } else {
                    errorMessage = JSON.stringify(errData.detail || errData, null, 2);
                }

                showErrorModal(errorMessage);
            }
        } catch (err) {
            console.error("Submission failed:", err);
            showErrorModal("Network error occurred while saving toy.");
        }
    });
}

let toyIdToDelete = null;

// Open and close delete confirmation modal helpers
function closeDeleteModal() {
    toyIdToDelete = null;
    document.getElementById("delete-confirm-modal").classList.add("hidden");
}

window.closeDeleteModal = closeDeleteModal;

// 10. Handle Delete Toy Action (Updated with custom modal)
async function deleteToy(id) {
    toyIdToDelete = id;
    document.getElementById("delete-confirm-modal").classList.remove("hidden");
}

// Bind confirmation action listener once DOM is loaded or at the script scope
const confirmDeleteBtn = document.getElementById("confirm-delete-btn");
if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener("click", async () => {
        if (toyIdToDelete === null) return;

        const id = toyIdToDelete;
        closeDeleteModal();

        try {
            const res = await fetch(`${API_BASE}/toys/${id}`, {
                method: "DELETE",
                headers: { "x-api-key": API_KEY }
            });

            if (res.ok) {
                showSuccessModal("Toy deleted successfully.");
            } else {
                showErrorModal("Failed to delete toy from database.");
            }
        } catch (err) {
            console.error("Delete failed:", err);
            showErrorModal("Network error occurred while deleting toy.");
        }
    });
}

// Initial load
loadToys();