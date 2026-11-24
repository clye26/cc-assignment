// API CONFIGURATION
const API_URL = GACHAPON_CONFIG.API_URL;
const API_KEY = GACHAPON_CONFIG.API_KEY;

// BUTTON SOUND EFFECTS CONFIGURATION
const crankSound = new Audio("audio/crank.mp3"); 
const winSound = new Audio("audio/win.mp3");   
crankSound.volume = 0.8;
winSound.volume = 0.8;

// Main Toy List
let masterToyList = [];

// Load inventory from sessionStorage (persists during session, keeps duplicates)
let userInventory = JSON.parse(sessionStorage.getItem("gacha_inventory")) || [];
updateInventoryCount();

let isPulling = false;

// Fetch Toy List Data from API on page load
async function fetchMasterToys() {
    try {
        /* 
        - Send network request "fetch" to Vercel's servers.
        - Since the API requires authentication, JS passes the x-api-key inside the request headers 
        so Vercel knows that cc-api2 website is allowed to see data.
        - Fetch toy data from cc-assignment website (main website with API) using the Header.
        */

        const response = await fetch(API_URL, {
            headers: { "x-api-key": API_KEY }
        });
        
        /*
        - The "fetch()" function still considers the server thrown errors "401" and "404" as successful 
        connection. 
        - This code snippet manually detect and intercept those bad status errors and 
        displays it to the user.
        */
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error(`Server returned status 401: Unauthorized or Invalid Key`);
            }
            throw new Error(`Server returned status ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        /* When the website receives the JSON response, check whether the toys are stored as 
        an array or wrapped inside an object, and store it to the variable "masterToyList".
        */
        masterToyList = Array.isArray(data) ? data : (data.toys || data.data || []);
        
        // If it successfully loaded, remove any Error UI overlays from the User's screen.
        const existingError = document.querySelector('.error-modal-overlay');
        if (existingError) existingError.remove();


        // If a problem is encountered, overlay the Error UI on the User's screen.
        } catch (error) {
            console.error("Error connecting to API:", error);
            if (document.querySelector('.error-modal-overlay')) return;

            const errorOverlay = document.createElement('div');
            errorOverlay.className = 'error-modal-overlay';
            errorOverlay.innerHTML = `
                <div class="error-card-box">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <h2>Whoops! The toy box won't open, please try again later!</h2>
                    <p>Toy Error: ${error.message}</p>
                </div>
            `;
            document.body.appendChild(errorOverlay);
        }
    }

// Call fetch on load
fetchMasterToys();

async function pullGacha() {
    if (isPulling) return;
    
    /*
    - Check if Toy List is empty.
    - When the crank button is triggered, download the Toy List again.
    - If the fetch failed and the Toy List is still empty, stop the function from 
    running further to avoid crashes.
    */
    if (masterToyList.length === 0) {
        await fetchMasterToys();
        if (masterToyList.length === 0) return;
    }

    isPulling = true;

    // PLAY CRANK SOUND EFFECT
    crankSound.currentTime = 0;
    crankSound.play().catch(e => console.log("Audio play failed:", e));

    // SPIN CRANK ANIMATION
    const crank = document.getElementById("crank");
    crank.classList.add("spin");

    setTimeout(() => {
        crank.classList.remove("spin");
        
        /*
        - This function picks a random Toy Item from the Toy List.
        - It first checks how long or how many items are in the Toy List.
        - Using the "Math.random()" function it will generate a random decimal number between 0 and 1
        (excluding 1) such as 0.456, 0.262. 
        - Since array positions require whole numbers (no decimal points) to be indexed, the "Math.floor"
        function "rounds down" to the nearest whole integer of the value made by "Math.floor(Math.random
        () * masterToyList.length)".
        - After the value is now down to the nearest whole integer, use that value to locate that 
        specific index position inside the Toy List array. Retrieve that Toy object and store it in the 
        "wonToy" variable that will be pushed to the "userInventory" list. 
        */

        const wonToy = masterToyList[Math.floor(Math.random() * masterToyList.length)];

        /* 
        - Push to "userInventory" (Toy Inventory Array) and save.
        - The Toy Inventory Array is also stored in "sessionStorage" meaning it will only be lost
        if the tab is closed.
        */ 
        userInventory.push(wonToy);
        sessionStorage.setItem("gacha_inventory", JSON.stringify(userInventory));
        updateInventoryCount();

        // DISPLAY TOY WON
        showReward(wonToy);
            isPulling = false;
    }, 600); 
}


    // DISPLAY TOY WON INFORMATION TO "reward-modal" IN HTML.
    function showReward(toy) {
        document.getElementById("reward-img").src = toy.image;
        document.getElementById("reward-title").innerText = toy.title;
        document.getElementById("reward-rarity").innerText = toy.genre || "Other";

        winSound.currentTime = 0;
        winSound.play().catch(e => console.log("Audio play failed:", e));

        document.getElementById("reward-modal").classList.add("active");
    }

    function closeModal() {
        document.getElementById("reward-modal").classList.remove("active");
    }

    function updateInventoryCount() {
        document.getElementById("inv-count").innerText = userInventory.length;
    }

    /*
    - If user clicks the "Inventory" button on the upper right side of the navigation bar, trigger
    the "openInventory()" function.
    - Loops through all collected toys inside the "userInventory" list and build card elements.
    */
    function openInventory() {
        const grid = document.getElementById("inventory-grid");
        grid.innerHTML = "";

        if (userInventory.length === 0) {
            grid.innerHTML = "<p style='grid-column: span 3; color: #a0aec0;'>Your inventory is empty!</p>";
        } else {
        userInventory.forEach(toy => {
            let itemDiv = document.createElement("div");
                itemDiv.className = "inv-item";
                itemDiv.innerHTML = `
                    <img src="${toy.image}" alt="${toy.title}">
                    <h3>${toy.title}</h3>
                    <p>${toy.genre}</p>
                `;
                grid.appendChild(itemDiv);
            });
        }

    // Trigger smooth fade & pop-in animation
    document.getElementById("inventory-modal").classList.add("active");
}

function closeInventory() {
    // Hide inventory modal
    document.getElementById("inventory-modal").classList.remove("active");
}