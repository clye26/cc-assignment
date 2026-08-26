const API_URL = "https://cc-assignment-kappa.vercel.app"; 

// https://cc-assignment-kappa.vercel.app - vercel deployment for github
// http://127.0.0.1:8000 - localhost


// GET ALL TOYS
async function loadToys() {
    try {
        const response = await fetch(`${API_URL}/toys`);
        const data = await response.json();
        
        // Show Carousel Images when "Show All Toys"/Home
        document.getElementById("carouselBanner").style.display = "flex";
        document.getElementById("showAllBtn").style.display = "none";
        
        document.getElementById("sectionTitle").innerText = "All Toys";
        document.getElementById("resultsCount").innerText = `Showing ${data.toys.length} results`;
        
        displayToys(data.toys);
    } catch (error) {
        console.error(error);
        document.getElementById("toyList").innerHTML = "Oops! Unable to connect to the Toy API Train Station.";
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
                <img src="images/errorsearch.png" alt="No toys found!" style="height: 200px; width: 390px; margin-bottom: 2px;">
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
        <p class="toy-price">₱${toy.price.toFixed(2)}</p>
        <button class="add-to-bag-btn" ${isOut ? 'disabled style="background-color: #ccc; cursor: not-allowed;"' : ''}>
            ${isOut ? 'Out of Stock' : 'Add to Cart'}
        </button>
    `;

    // Clicking the card body goes to details
    card.addEventListener("click", () => {
        viewToy(toy.id);
    });

    // Clicking the Add to Cart button prevents card redirection
    const addBtn = card.querySelector(".add-to-bag-btn");
    addBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        
        // Don't add to cart if out of stock
        if (isOut) return; 
            alert(`Added ${toy.title} to cart!`);
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

    if (!toyId) {
        container.innerHTML = "<p>No toy selected. <a href='index.html'>Back to Home</a></p>";
        return;
    }

    try {
        const response = await fetch(`${API_URL}/toys/${toyId}`);
        if (!response.ok) throw new Error("Toy not found");

        const toy = await response.json();
        const isOut = toy.stock === 0; // Check if out of stock

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
                        <span class="stock-value${isOut ? 'out-of-stock' : ''}">${isOut ? 'Out of Stock' : `${toy.stock} available`}</span> 
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

        // Event Listeners for Quantity and Action Buttons
        document.getElementById("increaseQtyBtn").addEventListener("click", () => {
            increaseQty(toy.stock);
        });

        document.getElementById("decreaseQtyBtn").addEventListener("click", () => {
            decreaseQty();
        });

        // Event Listeners for catching apostrophes/special characters title errors
        document.getElementById("detailAddBtn").addEventListener("click", () => {
            const qty = document.getElementById("qtyInput").value;
            alert("Added " + qty + " x " + toy.title + " to cart!");
        });

        document.getElementById("detailWishlistBtn").addEventListener("click", () => {
            alert("Added " + toy.title + " to Wishlist!");
        });

    } catch (error) {
        console.error(error);
        container.innerHTML = "<p>Oops! Unable to retrieve the Toy details. <a href='index.html'>Back to Home</a></p>";
    }
}

// Quantity Functions
function increaseQty(maxStock) {
    const qtyInput = document.getElementById("qtyInput");
    let currentQty = parseInt(qtyInput.value);
    if (currentQty < maxStock) {
        qtyInput.value = currentQty + 1;
    }
}

function decreaseQty() {
    const qtyInput = document.getElementById("qtyInput");
    let currentQty = parseInt(qtyInput.value);
    if (currentQty > 1) {
        qtyInput.value = currentQty - 1;
    }
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
        const response = await fetch(`${API_URL}/toys/search?q=${encodeURIComponent(query)}`);
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

loadToys();

// CAROUSEL IMAGE 
const slides = [
    { image: "images/carousel1.png" },
    { image: "images/carousel2.png" },
    { image: "images/carousel3.png" }
];

let currentSlide = 0;

function changeSlide(index) {
    currentSlide = index;
    updateCarousel();
}

function updateCarousel() {
    const banner = document.getElementById("carouselBanner");
    const dots = document.querySelectorAll(".dot");

    banner.style.backgroundImage = `url('${slides[currentSlide].image}')`;

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
    currentSlide = (currentSlide + 1) % slides.length;
    updateCarousel();
}, 5000);

updateCarousel();

const urlParams = new URLSearchParams(window.location.search);
const searchQuery = urlParams.get("search");
if (searchQuery && document.getElementById("searchInput")) {
    document.getElementById("searchInput").value = searchQuery;
    searchToys();
}