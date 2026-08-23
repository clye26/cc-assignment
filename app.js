const API_URL = "https://cc-assignment-kappa.vercel.app"; 

// https://cc-assignment-kappa.vercel.app - vercel deployment for github
// http://127.0.0.1:8000 - localhost


// GET ALL TOYS
async function loadToys() {
    try {
        const response = await fetch(`${API_URL}/toys`);
        const data = await response.json();
        displayToys(data.toys);
    }

    catch (error) {
        console.error(error);
        document.getElementById("toyList").innerHTML = "Unable to connect to the API.";
    }
}


// DISPLAY TOYS
function displayToys(toys) {
    const toyList = document.getElementById("toyList");
    toyList.innerHTML = "";

    // Check if the Toy list is empty, if the toy does not exit, an error message will be displayed to the user.
    if (!toys || toys.length === 0) {
        toyList.innerHTML = `
            <div class="no-toys-message" style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #666;">
                <h3>Oops! That toy must be hiding in the toy box. Let's try another search!</h3>
            </div>
        `;
        return;
    }

    toys.forEach(toy => {
        const card = document.createElement("div");
        card.className = "toy-card"; 
        card.innerHTML = `
            <!-- Added Image Tag Here -->
            <img src="${toy.image}" alt="${toy.title}" class="toy-thumbnail" style="width:100%; height:150px; object-fit:cover; border-radius:4px; margin-bottom:10px;">
            
            <div class="car-year">${toy.year} - ${toy.genre}</div>
            <h3>${toy.title}</h3>
            <p class="car-engine">${toy.brand} | Stock: ${toy.stock}</p>
            <p>₱${toy.price.toFixed(2)}</p>
            <button onclick="viewToy(${toy.id})">View Details</button>
        `;

        toyList.appendChild(card);
    });
}

// GET ONE TOY
async function viewToy(id) {
    try {
        const response = await fetch(`${API_URL}/toys/${id}`);
        const toy = await response.json();

        alert(`
            ${toy.title} (${toy.year})
            Brand: ${toy.brand}
            Genre: ${toy.genre}
            Price: ₱${toy.price.toFixed(2)}
            Stock Remaining: ${toy.stock}
        `);
    }
    catch (error) {
        console.error(error);
        alert("Unable to retrieve Toy.");
    }
}

// SEARCH
async function searchToys() {

    const query = document.getElementById("searchInput").value;
    if (!query) {
        loadToys();
        return;
    }
    try {
        const response =
            await fetch(`${API_URL}/toys/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        displayToys(data.results);
    }

    catch (error) {
        console.error(error);
        alert("Search failed.");
    }
}

loadToys();