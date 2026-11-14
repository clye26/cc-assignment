// admin.js - Secure Admin Dashboard Logic (with Edit/Update support)

const API_BASE = CONFIG.API_URL; 
const API_KEY = CONFIG.API_KEY;

// Track whether we are currently editing a toy, and store loaded toys locally
let editingToyId = null;
let toysCache = [];

// 1. Guard check: Kick back to login if not authenticated
if (localStorage.getItem("isStaffLoggedIn") !== "true") {
    window.location.href = "login.html";
} else {
    const welcomeUser = document.getElementById("welcome-user");
    if (welcomeUser) {
        welcomeUser.textContent = `Logged in as: ${localStorage.getItem("staffUsername")}`;
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

// 3. Fetch and render toys (Sorted numerically by ID)
async function loadToys() {
    try {
        const res = await fetch(`${API_BASE}/toys`, {
            headers: { "x-api-key": API_KEY }
        });
        
        let data = await res.json();
        toysCache = Array.isArray(data) ? data : (data.toys || data.data || []);

        // Sort items numerically by ID (1, 2, 3...)
        toysCache.sort((a, b) => a.id - b.id);

        const tbody = document.getElementById("toy-table-body");
        if (!tbody) return;
        tbody.innerHTML = "";

        if (toysCache.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-gray-500">No toys found in the database.</td></tr>`;
            return;
        }

        toysCache.forEach(toy => {
            tbody.innerHTML += `
                <tr class="border-b hover:bg-gray-50">
                    <td class="p-3 border">${toy.id}</td>
                    <td class="p-3 border font-semibold">${toy.title}</td>
                    <td class="p-3 border">${toy.brand}</td>
                    <td class="p-3 border">$${toy.price}</td>
                    <td class="p-3 border">${toy.stock}</td>
                    <td class="p-3 border">
                        <button onclick="editToy(${toy.id})" class="bg-yellow-500 text-white px-2 py-1 rounded text-sm hover:bg-yellow-600 mr-1">Edit</button>
                        <button onclick="deleteToy(${toy.id})" class="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600">Delete</button>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        console.error("Failed to load toys:", err);
    }
}

// 4. Populate form with toy details for editing
function editToy(id) {
    const toy = toysCache.find(t => t.id === id);
    if (!toy) return;

    editingToyId = toy.id;

    // Fill inputs with existing data
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

    // Update UI headers and button states
    document.getElementById("form-title").textContent = `Edit Toy (ID: ${toy.id})`;
    const submitBtn = document.getElementById("form-submit-btn");
    submitBtn.textContent = "Update Toy in Database";
    submitBtn.className = "bg-yellow-600 text-white font-bold py-2 px-4 rounded hover:bg-yellow-700 transition col-span-full md:col-span-2";
    
    document.getElementById("cancel-edit-btn").classList.remove("hidden");

    // Scroll smoothly up to the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Cancel edit mode and reset form
function cancelEdit() {
    editingToyId = null;
    document.getElementById("add-toy-form").reset();
    document.getElementById("form-title").textContent = "Add New Toy";
    const submitBtn = document.getElementById("form-submit-btn");
    submitBtn.textContent = "Add Toy to Database";
    submitBtn.className = "bg-green-600 text-white font-bold py-2 px-4 rounded hover:bg-green-700 transition col-span-full";
    document.getElementById("cancel-edit-btn").classList.add("hidden");
}

// Expose cancelEdit globally so the HTML button can trigger it
window.cancelEdit = cancelEdit;
window.editToy = editToy;
window.deleteToy = deleteToy;

// 5. Handle Form Submission (Smart routing: POST for create, PUT for update)
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

        // If we are editing, target the specific item endpoint with PUT
        if (editingToyId !== null) {
            url = `${API_BASE}/toys/${editingToyId}`;
            method = "PUT";
            // Include ID in payload if required by Pydantic model during updates
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
                alert(editingToyId ? "Toy successfully updated!" : "Toy successfully added!");
                cancelEdit();
                loadToys();
            } else {
                const errData = await res.json();
                alert("Error: " + JSON.stringify(errData.detail));
            }
        } catch (err) {
            console.error("Submission failed:", err);
            alert("Network error occurred while saving toy.");
        }
    });
}

// 6. Handle Delete Toy Action
async function deleteToy(id) {
    if (!confirm(`Are you sure you want to delete Toy ID ${id}?`)) return;

    try {
        const res = await fetch(`${API_BASE}/toys/${id}`, {
            method: "DELETE",
            headers: { "x-api-key": API_KEY }
        });

        if (res.ok) {
            alert("Toy deleted successfully.");
            loadToys();
        } else {
            alert("Failed to delete toy.");
        }
    } catch (err) {
        console.error("Delete failed:", err);
    }
}

// Initial load
loadToys();