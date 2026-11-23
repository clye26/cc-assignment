const API_BASE = CONFIG.API_URL;
const API_KEY = CONFIG.API_KEY;

const ITEMS_PER_PAGE = 10;

let editingToyId = null;
let toysCache = [];
let currentPage = 1;

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
    loadToys(currentPage);
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

// Helper: ensure a genre value exists in the <select id="toy-genre"> dropdown
function ensureGenreOption(genreValue) {
    const selectEl = document.getElementById("toy-genre");
    if (!selectEl || !genreValue) return;

    const exists = Array.from(selectEl.options).some(opt => opt.value === genreValue);
    if (!exists) {
        const customOpt = document.createElement("option");
        customOpt.value = genreValue;
        customOpt.textContent = genreValue;
        selectEl.appendChild(customOpt);
    }
    selectEl.value = genreValue;
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

// Render current 10-item page & pagination controls
function renderInventoryPage(page = 1) {
    const tbody = document.getElementById("toy-table-body");
    const pageInfoEl = document.getElementById("inventory-page-info");
    const paginationEl = document.getElementById("inventory-pagination");
    const pageNumbersEl = document.getElementById("page-numbers");
    const prevBtn = document.getElementById("prev-page-btn");
    const nextBtn = document.getElementById("next-page-btn");

    if (!tbody) return;

    const totalItems = toysCache.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));

    currentPage = Math.min(Math.max(1, page), totalPages);

    tbody.innerHTML = "";

    if (totalItems === 0) {
        if (pageInfoEl) pageInfoEl.textContent = "Showing 0 of 0 toys";
        if (paginationEl) paginationEl.classList.add("hidden");

        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="padding: 16px; text-align: center; color: #6b7280;">
                    No toys found in the database.
                </td>
            </tr>
        `;
        return;
    }

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
    const pageToys = toysCache.slice(startIndex, endIndex);

    if (pageInfoEl) {
        pageInfoEl.textContent = `Showing ${startIndex + 1}–${endIndex} of ${totalItems} toys (Page ${currentPage} of ${totalPages})`;
    }

    pageToys.forEach(toy => {
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

    if (paginationEl) {
        paginationEl.classList.remove("hidden");
    }

    if (prevBtn) {
        prevBtn.disabled = currentPage <= 1;
    }

    if (nextBtn) {
        nextBtn.disabled = currentPage >= totalPages;
    }

    if (pageNumbersEl) {
        pageNumbersEl.innerHTML = "";
        for (let p = 1; p <= totalPages; p++) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.textContent = p;
            btn.className = `page-num-btn ${p === currentPage ? "active" : ""}`;
            btn.addEventListener("click", () => renderInventoryPage(p));
            pageNumbersEl.appendChild(btn);
        }
    }
}

// 4. Fetch and render toys
async function loadToys(targetPage = 1) {
    try {
        const res = await fetch(`${API_BASE}/toys`, {
            headers: { "x-api-key": API_KEY }
        });

        let data = await res.json();

        toysCache = Array.isArray(data) ? data : (data.toys || data.data || []);
        toysCache.sort((a, b) => a.id - b.id);

        renderInventoryPage(targetPage);
    } catch (err) {
        console.error("Failed to load toys:", err);
        const tbody = document.getElementById("toy-table-body");
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="padding: 16px; text-align: center; color: #dc2626;">
                        Failed to load toys from server.
                    </td>
                </tr>
            `;
        }
    }
}

// Pagination button listeners
const prevPageBtn = document.getElementById("prev-page-btn");
const nextPageBtn = document.getElementById("next-page-btn");

if (prevPageBtn) {
    prevPageBtn.addEventListener("click", () => {
        if (currentPage > 1) {
            renderInventoryPage(currentPage - 1);
        }
    });
}

if (nextPageBtn) {
    nextPageBtn.addEventListener("click", () => {
        const totalPages = Math.max(1, Math.ceil(toysCache.length / ITEMS_PER_PAGE));
        if (currentPage < totalPages) {
            renderInventoryPage(currentPage + 1);
        }
    });
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
    document.getElementById("details-price").textContent = toy.price !== undefined && toy.price !== null ? `₱${toy.price}` : "";
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
    ensureGenreOption(toy.genre || "");
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
    document.getElementById("toy-genre").selectedIndex = 0;
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

function closeDeleteModal() {
    toyIdToDelete = null;
    document.getElementById("delete-confirm-modal").classList.add("hidden");
}

window.closeDeleteModal = closeDeleteModal;

// 10. Handle Delete Toy Action
async function deleteToy(id) {
    toyIdToDelete = id;
    document.getElementById("delete-confirm-modal").classList.remove("hidden");
}

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

// 11. Lookup Order Details -> GET /api/v1/orders/{order_id}
const lookupOrderBtn = document.getElementById("lookup-order-btn");
if (lookupOrderBtn) {
    lookupOrderBtn.addEventListener("click", async () => {
        const orderId = document.getElementById("admin-order-id")?.value;
        const previewBox = document.getElementById("admin-order-preview");

        if (!orderId) {
            showErrorModal("Please enter an Order ID to look up.");
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/orders/${orderId}`, {
                headers: { "x-api-key": API_KEY }
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.detail || "Order not found.");
            }

            document.getElementById("admin-order-status").value = data.status || "pending";

            const itemsList = (data.order_items || [])
                .map(i => `<li>${i.toys?.title || `Toy #${i.toy_id}`} &times; ${i.quantity}</li>`)
                .join("");

            const safeStatus = (data.status || "pending").toLowerCase();

            previewBox.innerHTML = `
                <div class="order-preview-top">
                    <div>
                        <strong>Order #${data.id}</strong>
                        <span class="order-preview-meta">&bull; Customer ID: ${data.user_id} &bull; Total: <strong>₱${Number(data.total_amount || 0).toFixed(2)}</strong></span>
                    </div>
                    <span class="order-status-pill status-${safeStatus}">${safeStatus}</span>
                </div>
                <ul class="order-preview-items">${itemsList || "<li>No line items listed.</li>"}</ul>
            `;
            previewBox.classList.remove("hidden");
        } catch (err) {
            previewBox.classList.add("hidden");
            showErrorModal(err.message);
        }
    });
}

// 12. Update Order Status -> PATCH /api/v1/orders/{order_id}/status
const updateOrderStatusBtn = document.getElementById("update-order-status-btn");
if (updateOrderStatusBtn) {
    updateOrderStatusBtn.addEventListener("click", async () => {
        const orderId = document.getElementById("admin-order-id")?.value;
        const status = document.getElementById("admin-order-status")?.value;

        if (!orderId) {
            showErrorModal("Please enter an Order ID first.");
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": API_KEY
                },
                body: JSON.stringify({ status })
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.detail || "Failed to update order status.");
            }

            showSuccessModal(`Order #${orderId} status updated to "${status}".`);
        } catch (err) {
            showErrorModal(err.message);
        }
    });
}

// Initial load
loadToys(1);