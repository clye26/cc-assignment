// API CONFIGURATION
const API_URL = CONFIG.API_URL;
const API_KEY = CONFIG.API_KEY;

// REUSABLE HEADER OBJECT
const FETCH_OPTIONS = {
  headers: { "x-api-key": API_KEY }
};

function getJsonHeaders() {
    return {
        "Content-Type": "application/json",
        "x-api-key": API_KEY
    };
}

// AUTHENTICATION CHECK FOR CUSTOMER-ONLY PAGES
function requireCustomerId() {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    const userId = localStorage.getItem("userId");
    const role = localStorage.getItem("userRole");

    if (!isLoggedIn || !userId || role !== "customer") {
        showCustomerWarningModal(
        "Please log in with a customer account to use Cart, Wishlist, and Orders.",
        "Login Required"
        );
        return null;
    }
    return Number(userId);
}

// GET ALL TOYS
async function loadToys() {
    const toyList = document.getElementById("toyList");
    if (!toyList) return; // Prevents running on details.html

    const errorBanner = document.getElementById("error-banner");

    try {
        const response = await fetch(`${API_URL}/toys`, FETCH_OPTIONS);
        
        // Check if the server responded with an error (like a 401 or 500).
        if (!response.ok) {
            throw new Error(`Server status: ${response.status}`);
        }

        // Parse or break down the JSON response.
        const data = await response.json();
        
        // Hide error banner if everything loaded successfully.
        if (errorBanner) errorBanner.style.display = "none";
        
        // Show Carousel Images when "Show All Toys"/Home.
        document.getElementById("carouselBanner").style.display = "flex";
        document.getElementById("showAllBtn").style.display = "none";
        
        // Extract Toy Data and Display.
        document.getElementById("sectionTitle").innerText = "All Toys";
        document.getElementById("resultsCount").innerText = `Showing ${data.toys.length} results`;
        
        displayToys(data.toys);
    } catch (error) {
        console.error(error);
        
        const toyList = document.getElementById("toyList");
        toyList.innerHTML = `
            <div class="error-card-box">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <h2>Whoops! The toy box won't open, please try again later!</h2>
                <p>Toy Error: ${error.message}</p>
            </div>
        `;
    }
}


// DISPLAY TOYS IN A 4-ITEM GRID
function displayToys(toys) {
    const toyList = document.getElementById("toyList");
    toyList.innerHTML = "";

    // Check if the Toy list is empty, if the toy does not exist, an error message will be displayed to the user.
    if (!toys || toys.length === 0) {
        toyList.innerHTML = `
            <div class="no-toys-message" style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #666;">
                <img src="images/errorsearch.png" alt="No toys found!" class="no-toys-img">
                <h3>Oops! That toy must be hiding in the toy box. Let's try another search!</h3>
            </div>
        `;
        return;
    }

    // TOY CARD TEMPLATE
    toys.forEach(toy => {
    const card = document.createElement("div");
    card.className = "toy-card";

    const isOut = toy.stock === 0; // Check if out of stock

    card.innerHTML = `
            <img src="${toy.image}" alt="${toy.title}" class="toy-card-img">
            <h3>${toy.title}</h3>
            <p class="toy-brand">${toy.brand}</p>
            <div class="toy-card-star-rating">
                ${renderCSSStars(toy.rating)}
            </div>
            <p class="toy-price">₱${Number(toy.price).toFixed(2)}</p>
            <div class="card-action-row">
                <button type="button" class="add-to-bag-btn" ${isOut ? 'disabled style="background-color: #ccc; cursor: not-allowed;"' : ''}>
                    ${isOut ? 'Out of Stock' : 'Add to Cart'}
                </button>
                <button type="button" class="card-wishlist-btn" title="Add to Wishlist">
                    <i class="fa-solid fa-heart"></i>
                </button>
            </div>
        `;

        // Clicking card body opens details
        card.addEventListener("click", () => {
            viewToy(toy.id);
        });

        // Connect Add to Cart button -> POST /api/v1/cart
        const addBtn = card.querySelector(".add-to-bag-btn");
        addBtn.addEventListener("click", async (event) => {
            event.stopPropagation();
            if (isOut) return;
            await addToCartAPI(toy.id, 1);
        });

        // Connect Card Wishlist button -> POST /api/v1/wishlist
        const wishBtn = card.querySelector(".card-wishlist-btn");
        wishBtn.addEventListener("click", async (event) => {
            event.stopPropagation();
            await addToWishlistAPI(toy.id);
        });

        toyList.appendChild(card);
    });
}

// REDIRECT TO DETAILS PAGE
function viewToy(id) {
    window.location.href = `details.html?id=${id}`;
}

// STARS FUNCTION FOR RATING
function renderCSSStars(rating) {
    const numRating = parseFloat(rating) || 0;
    // Calculate the width percentage (e.g., 4.5 out of 5 = 90%)
    const percentage = (numRating / 5) * 100;

    /* 
    Plots the background empty stars and overlays the filled stars based on the rating percentage.
    If 90% is the ratinng, then 90% of the stars will be filled and 10% will be cut/empty (grey area visible).
    */
    return `
        <div class="star-rating-container">
            <div class="star-rating">
                <div class="fill-stars" style="width: ${percentage}%;">★★★★★</div>
                <div class="empty-stars">★★★★★</div>
            </div>
            <span class="rating-value">(${numRating.toFixed(1)} / 5)</span>
        </div>
    `;
}

// FETCH AND DISPLAY SINGLE TOY DETAILS
async function fetchToyDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const toyId = urlParams.get("id");
    const container = document.getElementById("toyDetails");

    // SHOW LOADING STATE IMMEDIATELY WITH CENTERED STYLING
    container.classList.add("empty-shelf");
    container.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin" style="font-size: 2.5rem; color: #ffa100; margin-bottom: 12px;"></i>
        <h2>Sorting through the Toy Shelf...</h2>
        <p>Hang tight!</p>
    `;

    // CHECK IF ID EXISTS
    if (!toyId) {
        container.innerHTML = `
            <img src="images/errornotoy.png" alt="No toys found!" class="empty-shelf-img">
            <h2>This shelf is empty!</h2>
            <p>Looks like this toy rolled away. Head back to the toy box to pick a fun toy!</p>
            <a href='index.html' class='back-home-btn'>Back to Homepage</a>
        `;
        return;
    }

    try {
        const response = await fetch(`${API_URL}/toys/${toyId}`, FETCH_OPTIONS);
        if (!response.ok) throw new Error("Toy not found");

        const toy = await response.json();
        const isOut = toy.stock === 0; // Check if out of stock

        // REMOVE empty-shelf class so the 2-column grid works normally
        container.classList.remove("empty-shelf");

        container.innerHTML = `
            <div class="details-image-section">
                <img src="${toy.image}" alt="${toy.title}" class="main-detail-img">
            </div>

            <div class="detail-info-container">
                <h1>${toy.title}</h1>

                <div class="detail-brand-year-genre">
                    <p class="detail-rating">
                        <strong>Rating:</strong> ${renderCSSStars(toy.rating)}
                    </p>
                    <p><strong>Brand:</strong> ${toy.brand}</p>
                    <p><strong>Year:</strong> ${toy.year}</p>
                    <p><strong>Genre:</strong> ${toy.genre}</p>
                </div>

                <div class="detail-agerange-measurements">
                    <p><strong>Age Range:</strong> ${toy.age_range}</p>
                    <p><strong>Dimensions:</strong> ${toy.dimensions}</p>
                    <p><strong>Height:</strong> ${toy.height}</p>
                    <p><strong>Weight:</strong> ${toy.weight}</p>
                </div>

                <div class="detail-description">
                    <p><strong>Description:</strong><br>${toy.description}</p>
                </div>

                <div class="detail-price-stock">
                    <p class="detail-price">Price: <span class="price-value">₱${toy.price.toFixed(2)}</span></p>
                    <p class="stock-status">
                        Stock: 
                        <span class="stock-value ${isOut ? 'out-of-stock' : ''}">${isOut ? 'Out of Stock' : `${toy.stock} available`}</span> 
                    </p>
                </div>

                <div class="quantity-selector-container">
                    <span class="qty-label">Quantity:</span>
                    <div class="qty-controls">
                        <button type="button" class="qty-btn" id="decreaseQtyBtn" ${isOut ? 'disabled' : ''}>-</button>
                        <input type="text" id="qtyInput" class="qty-input" value="${isOut ? '0' : '1'}" readonly>
                        <button type="button" class="qty-btn" id="increaseQtyBtn" ${isOut ? 'disabled' : ''}>+</button>
                    </div>
                </div>

                <div class="action-buttons">
                    <button class="add-to-bag-btn" id="detailAddBtn" ${isOut ? 'disabled style="background-color: #ccc; cursor: not-allowed;"' : ''}>
                        ${isOut ? 'Out of Stock' : 'Add to cart'}
                    </button>
                    <button class="wishlist-btn" id="detailWishlistBtn">Add to Wishlist</button>
                </div>
            </div>
        `;

        document.getElementById("increaseQtyBtn").addEventListener("click", () => {
            increaseQty(toy.stock, toy.price);
        });

        document.getElementById("decreaseQtyBtn").addEventListener("click", () => {
            decreaseQty(toy.price);
        });

        // Connect Details Add to Cart -> POST /api/v1/cart
        document.getElementById("detailAddBtn").addEventListener("click", async () => {
            if (isOut) return;
            const qty = parseInt(document.getElementById("qtyInput").value, 10) || 1;
            await addToCartAPI(toy.id, qty);
        });

        // Connect Details Wishlist -> POST /api/v1/wishlist
        document.getElementById("detailWishlistBtn").addEventListener("click", async () => {
            await addToWishlistAPI(toy.id);
        });

    } catch (error) {
        console.error(error);
        container.classList.add("empty-shelf");
        container.innerHTML = `
            <img src="images/errornotoy.png" alt="No toys found!" class="empty-shelf-img">
            <h2>This shelf is empty!</h2>
            <p>Oops! Unable to retrieve the Toy details.</p>
            <a href='index.html' class='back-home-btn'>Back to Homepage</a>
        `;
    }
}

// Quantity Functions
function increaseQty(maxStock, basePrice) {
    const qtyInput = document.getElementById("qtyInput");
    const priceDisplay = document.querySelector(".price-value");
    let currentQty = parseInt(qtyInput.value);
    
    if (currentQty < maxStock) {
        currentQty++;
        qtyInput.value = currentQty;
        updateTotalPrice(basePrice, currentQty, priceDisplay);
    }
}

function decreaseQty(basePrice) {
    const qtyInput = document.getElementById("qtyInput");
    const priceDisplay = document.querySelector(".price-value");
    let currentQty = parseInt(qtyInput.value);
    
    if (currentQty > 1) {
        currentQty--;
        qtyInput.value = currentQty;
        updateTotalPrice(basePrice, currentQty, priceDisplay);
    }
}

// Helper function to calculate and display the updated total price
function updateTotalPrice(basePrice, quantity, displayElement) {
    let totalPrice = basePrice * quantity;
    displayElement.innerText = `₱${totalPrice.toFixed(2)}`;
}

// SEARCH TOYS
async function searchToys() {
    const searchInput = document.getElementById("searchInput");
    if (!searchInput) return;
    
    const query = searchInput.value.trim();
    
    // If user is on Details page, redirect back to index.html with the search query
    if (window.location.pathname.includes("details.html")) {
        window.location.href = `index.html?search=${encodeURIComponent(query)}`;
        return;
    }

    if (!query) {
        loadToys();
        return;
    }

    try {
        const response = await fetch(`${API_URL}/toys/search?q=${encodeURIComponent(query)}`, FETCH_OPTIONS);
        const data = await response.json();
        
        // Hide Carousel Images and show the "Show all Toys" button
        const banner = document.getElementById("carouselBanner");
        if (banner) banner.style.display = "none";
        
        const showAllBtn = document.getElementById("showAllBtn");
        if (showAllBtn) showAllBtn.style.display = "inline-block";
        
        const sectionTitle = document.getElementById("sectionTitle");
        if (sectionTitle) sectionTitle.innerText = `Products for "${query}"`;
        
        const resultsCount = document.getElementById("resultsCount");
        if (resultsCount) resultsCount.innerText = `Showing ${data.count} results`;

        displayToys(data.results);
    } catch (error) {
        console.error(error);
        alert("Search failed.");
    }
}

// ============================================================
// WISHLIST API & MODAL (GET, POST, DELETE /api/v1/wishlist)
// ============================================================
async function addToWishlistAPI(toyId) {
    const userId = requireCustomerId();
    if (!userId) return;

    try {
        const res = await fetch(`${API_URL}/wishlist`, {
            method: "POST",
            headers: getJsonHeaders(),
            body: JSON.stringify({
                user_id: userId,
                toy_id: Number(toyId)
            })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.detail || "Failed to add to wishlist.");
        }

        showCustomerSuccessModal(
            data.message || "Item added to your wishlist!",
            "Added to Wishlist"
        );

    } catch (err) {
        console.error(err);

        if (
            err.message &&
            err.message.toLowerCase().includes("already")
        ) {
            showCustomerWarningModal(
                err.message,
                "Already in Wishlist"
            );
        } else {
            showCustomerErrorModal(
                err.message,
                "Wishlist Error"
            );
        }
    }
}

async function openWishlistModal() {
    const userId = requireCustomerId();
    if (!userId) return;

    setActiveShopTab("tab-wishlist");
    const modal = document.getElementById("customer-shop-modal");
    const titleEl = document.getElementById("shop-modal-title");
    const bodyEl = document.getElementById("shop-modal-body");
    const totalEl = document.getElementById("shop-modal-total");
    const checkoutBtn = document.getElementById("checkout-btn");

    titleEl.textContent = "My Wishlist";
    bodyEl.innerHTML = `<p class="shop-loading">Loading wishlist...</p>`;
    totalEl.textContent = "";
    checkoutBtn.classList.add("hidden");
    modal.classList.remove("hidden");

    try {
        const res = await fetch(`${API_URL}/wishlist/${userId}`, FETCH_OPTIONS);
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Failed to load wishlist.");

        if (!data.items || data.items.length === 0) {
            bodyEl.innerHTML = `<p class="shop-empty">Your wishlist is currently empty.</p>`;
            return;
        }

        bodyEl.innerHTML = data.items.map(row => {
            const toy = row.toys || {};
            const isOut = Number(toy.stock || 0) === 0;
            return `
                <div class="shop-item-row">
                    <div class="shop-item-info">
                        <img src="${toy.image || 'images/errornotoy.png'}" alt="${toy.title || 'Toy'}" class="shop-item-thumb">
                        <div>
                            <h4>${toy.title || `Toy #${row.toy_id}`}</h4>
                            <p class="shop-item-meta">${toy.brand || ''} &bull; ₱${Number(toy.price || 0).toFixed(2)}</p>
                        </div>
                    </div>
                    <div class="shop-item-controls">
                        <button type="button" class="shop-mini-btn primary" ${isOut ? 'disabled' : ''} onclick="moveWishlistToCart(${row.toy_id})">
                            ${isOut ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                        <button type="button" class="shop-mini-btn danger" onclick="removeWishlistItem(${row.id})">
                            Remove
                        </button>
                    </div>
                </div>
            `;
        }).join("");
    } catch (err) {
        bodyEl.innerHTML = `<p class="shop-error">${err.message}</p>`;
    }
}

async function moveWishlistToCart(toyId) {
    await addToCartAPI(toyId, 1);
}

async function removeWishlistItem(wishlistItemId) {
    try {
        const res = await fetch(`${API_URL}/wishlist/${wishlistItemId}`, {
            method: "DELETE",
            headers: FETCH_OPTIONS.headers
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Failed to remove wishlist item.");
        openWishlistModal();
    } catch (err) {
        alert(err.message);
    }
}

// ============================================================
// CART API & MODAL (GET, POST, PUT, DELETE /api/v1/cart)
// ============================================================
async function addToCartAPI(toyId, quantity = 1) {
    const userId = requireCustomerId();
    if (!userId) return;

    try {
        const res = await fetch(`${API_URL}/cart`, {
            method: "POST",
            headers: getJsonHeaders(),
            body: JSON.stringify({
                user_id: userId,
                toy_id: Number(toyId),
                quantity: Number(quantity)
            })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.detail || "Failed to add to cart.");
        }

        showCustomerSuccessModal(
            data.message || "Item added to your cart!",
            "Added to Cart"
        );

    } catch (err) {
        console.error(err);

        showCustomerErrorModal(
            err.message,
            "Cart Error"
        );
    }
}

async function openCartModal() {
    const userId = requireCustomerId();
    if (!userId) return;

    setActiveShopTab("tab-cart");
    const modal = document.getElementById("customer-shop-modal");
    const titleEl = document.getElementById("shop-modal-title");
    const bodyEl = document.getElementById("shop-modal-body");
    const totalEl = document.getElementById("shop-modal-total");
    const checkoutBtn = document.getElementById("checkout-btn");

    titleEl.textContent = "Shopping Cart";
    bodyEl.innerHTML = `<p class="shop-loading">Loading cart...</p>`;
    totalEl.textContent = "";
    checkoutBtn.classList.add("hidden");
    modal.classList.remove("hidden");

    try {
        const res = await fetch(`${API_URL}/cart/${userId}`, FETCH_OPTIONS);
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Failed to load cart.");

        if (!data.items || data.items.length === 0) {
            bodyEl.innerHTML = `<p class="shop-empty">Your cart is empty. Browse toys to add items!</p>`;
            totalEl.textContent = "Subtotal: ₱0.00";
            return;
        }

        bodyEl.innerHTML = data.items.map(row => {
            const toy = row.toys || {};
            const price = Number(toy.price || 0);
            const qty = Number(row.quantity || 1);
            const lineTotal = price * qty;

            return `
                <div class="shop-item-row">
                    <div class="shop-item-info">
                        <img src="${toy.image || 'images/errornotoy.png'}" alt="${toy.title || 'Toy'}" class="shop-item-thumb">
                        <div>
                            <h4>${toy.title || `Toy #${row.toy_id}`}</h4>
                            <p class="shop-item-meta">₱${price.toFixed(2)} each &bull; Price: <strong>₱${lineTotal.toFixed(2)}</strong></p>
                        </div>
                    </div>
                    <div class="shop-item-controls">
                        <button type="button" class="shop-qty-btn" onclick="updateCartQty(${row.id}, ${qty - 1})">
                            <i class="fa-solid fa-minus"></i>
                        </button>

                        <span class="shop-qty-value">${qty}</span>

                        <button type="button" class="shop-qty-btn" onclick="updateCartQty(${row.id}, ${qty + 1})">
                            <i class="fa-solid fa-plus"></i>
                        </button>
                        <button type="button" class="shop-mini-btn danger" onclick="removeCartItem(${row.id})">Remove</button>
                    </div>
                </div>
            `;
        }).join("");

        totalEl.textContent = `Subtotal: ₱${Number(data.subtotal || 0).toFixed(2)}`;
        checkoutBtn.classList.remove("hidden");
    } catch (err) {
        bodyEl.innerHTML = `<p class="shop-error">${err.message}</p>`;
    }
}

async function updateCartQty(cartItemId, newQty) {
    if (newQty <= 0) {
        await removeCartItem(cartItemId);
        return;
    }

    try {
        const res = await fetch(`${API_URL}/cart/${cartItemId}`, {
            method: "PUT",
            headers: getJsonHeaders(),
            body: JSON.stringify({ quantity: Number(newQty) })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Failed to update quantity.");
        openCartModal();
    } catch (err) {
    console.error(err);

    showCustomerErrorModal(
        err.message,
        "Cart Error"
    );
}
}

async function removeCartItem(cartItemId) {
    try {
        const res = await fetch(`${API_URL}/cart/${cartItemId}`, {
            method: "DELETE",
            headers: FETCH_OPTIONS.headers
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Failed to remove cart item.");
        openCartModal();
    } catch (err) {
        alert(err.message);
    }
}

// ============================================================
// ORDERS API & MODAL (POST /orders, GET /orders/user/{id}, GET /orders/{id})
// ============================================================
async function checkoutCart() {
    const userId = requireCustomerId();
    if (!userId) return;

    try {
        const res = await fetch(`${API_URL}/orders`, {
            method: "POST",
            headers: getJsonHeaders(),
            body: JSON.stringify({
                user_id: userId
            })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(
                data.detail || "Failed to place order."
            );
        }

        showCustomerSuccessModal(
            `Order #${data.order.id} placed successfully! Total: ₱${Number(data.order.total_amount).toFixed(2)}`,
            "Order Placed"
        );

        if (document.getElementById("toyList")) {
            loadToys();
        }

        if (window.location.pathname.includes("details.html")) {
            fetchToyDetails();
        }

        openOrdersModal();

    } catch (err) {
        console.error(err);

        showCustomerErrorModal(
            err.message,
            "Checkout Error"
        );
    }
}

async function openOrdersModal() {
    const userId = requireCustomerId();
    if (!userId) return;

    setActiveShopTab("tab-orders");
    const modal = document.getElementById("customer-shop-modal");
    const titleEl = document.getElementById("shop-modal-title");
    const bodyEl = document.getElementById("shop-modal-body");
    const totalEl = document.getElementById("shop-modal-total");
    const checkoutBtn = document.getElementById("checkout-btn");

    titleEl.textContent = "My Orders";
    bodyEl.innerHTML = `<p class="shop-loading">Loading orders...</p>`;
    totalEl.textContent = "";
    checkoutBtn.classList.add("hidden");
    modal.classList.remove("hidden");

    try {
        const res = await fetch(`${API_URL}/orders/user/${userId}`, FETCH_OPTIONS);
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Failed to load orders.");

        if (!data.orders || data.orders.length === 0) {
            bodyEl.innerHTML = `<p class="shop-empty">You haven't placed any orders yet.</p>`;
            return;
        }

        bodyEl.innerHTML = data.orders.map(order => {
            const itemsList = (order.order_items || []).map(item => `
                <li>${item.toys?.title || `Toy #${item.toy_id}`} &times; ${item.quantity}</li>
            `).join("");

            return `
                <div class="order-history-card">
                    <div class="order-history-header">
                        <strong>Order #${order.id}</strong>
                        <span class="order-status-pill status-${order.status}">${order.status}</span>
                    </div>
                    <p class="order-history-total">Total: <strong>₱${Number(order.total_amount || 0).toFixed(2)}</strong></p>
                    <ul class="order-history-items">${itemsList}</ul>
                    <button type="button" class="shop-mini-btn primary" onclick="viewSingleOrder(${order.id})">
                        View Order Details
                    </button>
                </div>
            `;
        }).join("");
    } catch (err) {
        bodyEl.innerHTML = `<p class="shop-error">${err.message}</p>`;
    }
}

// GET /api/v1/orders/{order_id}
async function viewSingleOrder(orderId) {
    const bodyEl = document.getElementById("shop-modal-body");
    const titleEl = document.getElementById("shop-modal-title");

    titleEl.textContent = `Order #${orderId} Receipt`;
    bodyEl.innerHTML = `<p class="shop-loading">Loading order details...</p>`;

    try {
        const res = await fetch(`${API_URL}/orders/${orderId}`, FETCH_OPTIONS);
        const order = await res.json();
        if (!res.ok) throw new Error(order.detail || "Order not found.");

        const itemsHtml = (order.order_items || []).map(item => {
            const toy = item.toys || {};
            const unitPrice = Number(toy.price || 0);
            const lineSubtotal = unitPrice * Number(item.quantity || 1);
            return `
                <div class="shop-item-row">
                    <div class="shop-item-info">
                        <img src="${toy.image || 'images/errornotoy.png'}" alt="${toy.title || 'Toy'}" class="shop-item-thumb">
                        <div>
                            <h4>${toy.title || `Toy #${item.toy_id}`}</h4>
                            <p class="shop-item-meta">${toy.brand || ''} &bull; Qty: ${item.quantity} &times; ₱${unitPrice.toFixed(2)}</p>
                        </div>
                    </div>
                    <strong>₱${lineSubtotal.toFixed(2)}</strong>
                </div>
            `;
        }).join("");

        bodyEl.innerHTML = `
            <div class="order-receipt-box">
                <p><strong>Order ID:</strong> #${order.id}</p>
                <p><strong>Status:</strong> <span class="order-status-pill status-${order.status}">${order.status}</span></p>
                <p><strong>Order Total:</strong> ₱${Number(order.total_amount || 0).toFixed(2)}</p>
                <hr style="margin: 12px 0; border: 0; border-top: 1px solid #e5e7eb;">
                ${itemsHtml}
                <div style="margin-top: 14px;">
                    <button type="button" class="shop-secondary-btn" onclick="openOrdersModal()">
                        &larr; Back to My Orders
                    </button>
                </div>
            </div>
        `;
    } catch (err) {
        bodyEl.innerHTML = `<p class="shop-error">${err.message}</p>`;
    }
}

function closeShopModal() {
    document.getElementById("customer-shop-modal")?.classList.add("hidden");
}

function setActiveShopTab(activeTabId) {
    ["tab-cart", "tab-wishlist", "tab-orders"].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.classList.toggle("active", id === activeTabId);
        }
    });
}

// Expose functions globally for inline HTML onclick handlers
window.openCartModal = openCartModal;
window.openWishlistModal = openWishlistModal;
window.openOrdersModal = openOrdersModal;
window.closeShopModal = closeShopModal;
window.updateCartQty = updateCartQty;
window.removeCartItem = removeCartItem;
window.moveWishlistToCart = moveWishlistToCart;
window.removeWishlistItem = removeWishlistItem;
window.checkoutCart = checkoutCart;
window.viewSingleOrder = viewSingleOrder;

loadToys();

// CAROUSEL IMAGE 
const desktopSlides = [
    { image: "images/carousel1.png" },
    { image: "images/carousel2.png" },
    { image: "images/carousel3.png" }
];

const mobileSlides = [
    { image: "images/carousel1_responsive.png" }, 
    { image: "images/carousel2_responsive.png" },
    { image: "images/carousel3_responsive.png" }
];

let currentSlide = 0;

function changeSlide(index) {
    currentSlide = index;
    updateCarousel();
}

function updateCarousel() {
    const banner = document.getElementById("carouselBanner");
    const dots = document.querySelectorAll(".dot");

    const activeSlides = window.innerWidth <= 768 ? mobileSlides : desktopSlides;

    // Safety check so index doesn't break if arrays are different lengths
    if (currentSlide >= activeSlides.length) {
        currentSlide = 0;
    }

    banner.style.backgroundImage = `url('${activeSlides[currentSlide].image}')`;

    dots.forEach((dot, idx) => {
        if (idx === currentSlide) {
            dot.classList.add("active");
        } else {
            dot.classList.remove("active");
        }
    });
}

// AUTO-SWIPE
setInterval(() => {
    const activeSlides = window.innerWidth <= 768 ? mobileSlides : desktopSlides;
    currentSlide = (currentSlide + 1) % activeSlides.length;
    updateCarousel();
}, 5000);

// Re-render if someone resizes their browser window live
window.addEventListener("resize", () => {
    updateCarousel();
});

updateCarousel();

const urlParams = new URLSearchParams(window.location.search);
const searchQuery = urlParams.get("search");
if (searchQuery && document.getElementById("searchInput")) {
    document.getElementById("searchInput").value = searchQuery;
    searchToys();
}

// ============================================================
// CUSTOMER LOGIN STATE MANAGEMENT
// ============================================================

window.addEventListener("DOMContentLoaded", () => {

    const currentUser = localStorage.getItem("currentUser");
    const userRole = localStorage.getItem("userRole");
    const userId = localStorage.getItem("userId");
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

    /*
     * Explicitly target the Login / Signup button.
     * Do NOT use querySelector(".nav-right .nav-btn")
     * because the navbar contains multiple buttons.
     */
    const loginBtn = document.getElementById("navAuthBtn");

    if (!loginBtn) {
        return;
    }

    /*
     * A customer is considered properly logged in only when
     * all required customer session values exist.
     */
    const validCustomerSession =
        isLoggedIn &&
        userRole === "customer" &&
        currentUser &&
        userId;

    /*
     * Staff login
     */
    const validStaffSession =
        isLoggedIn &&
        userRole === "staff" &&
        currentUser;

   if (validCustomerSession) {

    loginBtn.innerHTML = `
        <i class="fa-solid fa-user"></i>
        ${currentUser}
    `;

    loginBtn.onclick = () => {
        openLogoutModal();

        const confirmLogoutBtn = document.getElementById("confirm-logout-btn");

        if (confirmLogoutBtn) {
            confirmLogoutBtn.onclick = () => {
                confirmCustomerLogout();
            };
        }
    };

} else if (validStaffSession) {

    loginBtn.innerHTML = `
        <i class="fa-solid fa-user"></i>
        ${currentUser} (staff)
    `;

    loginBtn.onclick = () => {
        openLogoutModal();

        const confirmLogoutBtn = document.getElementById("confirm-logout-btn");

        if (confirmLogoutBtn) {
            confirmLogoutBtn.onclick = () => {
                confirmCustomerLogout();
            };
        }
    };

} else {

    /*
     * No valid session.
     */
    loginBtn.innerHTML = `
        <i class="fa-solid fa-user"></i>
        Login / Signup
    `;

    loginBtn.onclick = () => {
        window.location.href = "login.html";
    };
}
});

// ============================================================
// CUSTOMER FEEDBACK MODAL
// ============================================================

function showCustomerFeedbackModal(
    type,
    title,
    message,
    icon = "fa-circle-check"
) {
    const modal = document.getElementById("customer-feedback-modal");

    if (!modal) {
        return;
    }

    const titleEl = document.getElementById("customer-feedback-title");
    const messageTitleEl = document.getElementById("customer-feedback-message-title");
    const messageEl = document.getElementById("customer-feedback-message");
    const iconEl = document.getElementById("customer-feedback-icon");

    titleEl.textContent = title;
    messageTitleEl.textContent = title;
    messageEl.textContent = message;

    iconEl.className =
    `fa-solid ${icon} customer-feedback-icon`;

modal.classList.remove(
    "feedback-success",
    "feedback-warning",
    "feedback-error"
);

modal.classList.add(`feedback-${type}`);

modal.classList.remove("hidden");
}

function closeCustomerFeedbackModal() {
    const modal = document.getElementById("customer-feedback-modal");

    if (modal) {
        modal.classList.add("hidden");
    }
}


// ADD THIS HERE
window.closeCustomerFeedbackModal = closeCustomerFeedbackModal;


// Success
function showCustomerSuccessModal(message, title = "Success!") {
    showCustomerFeedbackModal(
        "success",
        title,
        message,
        "fa-circle-check"
    );
}


// Error
function showCustomerErrorModal(message, title = "Something went wrong") {
    showCustomerFeedbackModal(
        "error",
        title,
        message,
        "fa-triangle-exclamation"
    );
}


// Warning / information
function showCustomerWarningModal(message, title = "Notice") {
    showCustomerFeedbackModal(
        "warning",
        title,
        message,
        "fa-circle-exclamation"
    );
}

// ============================================================
// LOGOUT CONFIRMATION MODAL
// ============================================================

function openLogoutModal() {
    const modal = document.getElementById("logout-confirm-modal");

    if (modal) {
        modal.classList.remove("hidden");
    }
}


function closeLogoutModal() {
    const modal = document.getElementById("logout-confirm-modal");

    if (modal) {
        modal.classList.add("hidden");
    }
}


function confirmCustomerLogout() {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");

    window.location.href = "index.html";
}


window.openLogoutModal = openLogoutModal;
window.closeLogoutModal = closeLogoutModal;