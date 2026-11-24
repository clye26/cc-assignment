// API CONFIGURATION
const QUIZ_API_URL = QUIZ_CONFIG.QUIZ_API_URL;
const QUIZ_API_KEY = QUIZ_CONFIG.QUIZ_API_KEY;

let allToys = [];
let gameToys = [];
let currentRound = 0;
let score = 0;
let correctAnswer = 0;

// TRIPLE T JUMPSCARE CONFIGURATION
let currentDistance = 250;
const scareSound = new Audio("audio/sound.mov"); 
scareSound.volume = 1.0;

// BUTTON SOUND EFFECTS CONFIGURATION
const correctSound = new Audio("audio/correct.mp3"); 
const wrongSound = new Audio("audio/wrong.mp3");   
correctSound.volume = 0.8;
wrongSound.volume = 0.8;

async function startGame() {
    try {
        /* 
        - Send network request "fetch" to Vercel's servers.
        - Since the API requires authentication, JS passes the x-api-key inside the request headers 
        so Vercel knows that cc-api1 website is allowed to see data.
        - Fetch toy data from cc-assignment website (main website with API) using the Header.
        */

        const response = await fetch(QUIZ_API_URL, {
        headers: { "x-api-key": QUIZ_API_KEY }
        });
        
        if (!response.ok) {
            throw new Error(`Server returned status ${response.status}: Unauthorized or Invalid Key`);
        }
        
        /*
        - "data.toys" - Is the list of Toys in JSON Format.
        - "allToys" - Store the list of Toys in an Array (Original List).
        */

        const data = await response.json();
        allToys = data.toys;

        if (allToys.length < 4) {
            alert("You need at least 4 toys in your backend API to play!");
            return;
        }

        /*
        - Create a duplicate copy of the Array "allToys", named "gameToys". 
        - The sort function typically sorts it numerically or alphabetically, however with the 
        use of a trick function (0.5 - Math.random()) JS will generate a random positive or negative 
        number for each item which will cause the Toy items to randomly swap places dynamically.
        - Once the entire Toys list is fully shuffed, slice everything after the first 10 Toy items (.slice(0, 10)).
        */
        gameToys = [...allToys].sort(() => 0.5 - Math.random()).slice(0, 10);
        
        currentRound = 0;
        score = 0;
        document.getElementById("score").innerText = score;

        // Switch screens (using flex to match fixed-size game card layout)
        document.getElementById("start-screen").style.display = "none";
        document.getElementById("quiz-screen").style.display = "flex";

        loadNextRound();

    } catch (error) {
        console.error("Error connecting to API:", error);

        // Prevent stacking multiple error boxes if one is already open
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

function loadNextRound() {
    if (currentRound >= gameToys.length || currentRound >= 10) {
        endGame();
        return;
    }

    document.getElementById("round").innerText = currentRound + 1;
    document.getElementById("feedback").innerText = "";

    // Pull Toy image from the API, hide it temporarily and show loading icon.
    const spinner = document.getElementById("loading-spinner");
    const toyImg = document.getElementById("toy-image");
    
    spinner.style.display = "flex";
    toyImg.style.display = "none";

    // Disable buttons while loading icon.
    for (let i = 0; i < 4; i++) {
        document.getElementById(`btn-${i}`).disabled = true;
    }

    const toy = gameToys[currentRound];

    // Pull Toy title from the API and inject on HTML heading.
    document.getElementById("toy-title").innerText = toy.title;

    // Pull Toy price from the API and store in a variable.
    correctAnswer = toy.price;

    // Generate 3 fake Toy prices and 1 real Toy price, then shuffle them.
    let choices = [correctAnswer];
    while (choices.length < 4) {
        let randomVariation = (Math.random() * 30 - 15).toFixed(2);
        let fakePrice = parseFloat((correctAnswer + parseFloat(randomVariation)).toFixed(2));
        if (fakePrice > 0 && !choices.includes(fakePrice)) {
            choices.push(fakePrice);
        }
    }
    choices.sort(() => 0.5 - Math.random());

    // Preload the Toy image.
    toyImg.src = toy.image;

    // Delay reveal for 500ms.
    setTimeout(() => {
        spinner.style.display = "none";
        toyImg.style.display = "block";

        // Assign to the 4 buttons.
        for (let i = 0; i < 4; i++) {
            let btn = document.getElementById(`btn-${i}`);
            let textSpan = btn.querySelector('.btn-text');
            
            textSpan.innerText = `$${choices[i].toFixed(2)}`;
            btn.value = choices[i];
            btn.disabled = false;
        }
    }, 500);

    // Trigger card fade animation.
    let quizCard = document.getElementById("quiz-screen");
    quizCard.classList.remove("fade-in");
    void quizCard.offsetWidth; 
    quizCard.classList.add("fade-in");
}

function checkAnswer(buttonIndex) {
    let selectedBtn = document.getElementById(`btn-${buttonIndex}`);
    let selectedValue = parseFloat(selectedBtn.value);
    let feedback = document.getElementById("feedback");
    
    // Get the current toy object
    const currentToy = gameToys[currentRound];

    // Disable buttons temporarily
    for (let i = 0; i < 4; i++) {
        document.getElementById(`btn-${i}`).disabled = true;
    }

    if (selectedValue === correctAnswer) {
        score += 10;
        document.getElementById("score").innerText = score;
        feedback.innerHTML = '<div class="feedback-content"><i class="fa-solid fa-circle-check"></i><span>Correct!</span></div>';
        feedback.className = "correct";

        // PLAY CORRECT SOUND EFFECT
        correctSound.currentTime = 0;
        correctSound.play().catch(e => console.log("Audio play failed:", e));

        currentRound++;
        setTimeout(loadNextRound, 1500);
    } else {
        feedback.innerHTML = `<div class="feedback-content"><i class="fa-solid fa-circle-xmark"></i><span>Wrong! The correct price was $${correctAnswer.toFixed(2)}</span></div>`;
        feedback.className = "wrong";

        // PLAY WRONG SOUND EFFECT
        wrongSound.currentTime = 0;
        wrongSound.play().catch(e => console.log("Audio play failed:", e));
        
        // TRIPLE T JUMPSCARE
        const toyTitle = currentToy && currentToy.title ? currentToy.title.toLowerCase() : "";

        if (toyTitle.includes("tung tung")) {
            triggerTTTJumpscare();
        } else {
            currentRound++;
            setTimeout(loadNextRound, 1500);
        }
    }
}

function triggerTTTJumpscare() {
    const overlay = document.getElementById("ttt-overlay");
    const warningText = document.getElementById("ttt-warning-text");

    const jumpscareVideo = document.getElementById("ttt-jumpscare-video");
    if (jumpscareVideo) {
        jumpscareVideo.currentTime = 0;
        jumpscareVideo.play();
    }

    // Play preloaded audio safely
    try {
        scareSound.currentTime = 0;
        let playPromise = scareSound.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log("Audio blocked by browser policy:", error);
            });
        }
    } catch (e) {
        console.log("Audio error:", e);
    }

    // Save Starting Distance before reduction
    let startDistance = currentDistance;

    // Reduce Distance randomly
    if (currentDistance > 0) {
        let reduction = Math.floor(Math.random() * (currentDistance / 2)) + 1000;
        currentDistance = Math.max(0, currentDistance - reduction);
    }

    let targetDistance = currentDistance;

    // Show overlay immediately
    overlay.style.display = "flex";

    // Real-time countdown animation effect
    let steps = 40; // Number of visual steps in the countdown
    let stepCount = 0;
    let totalAnimationTime = 2000; // Takes 2 seconds to tick down
    let intervalTime = totalAnimationTime / steps;
    let distanceDifference = startDistance - targetDistance;

    let countdownInterval = setInterval(() => {
        stepCount++;
        let currentDisplayDistance;

        if (stepCount >= steps) {
            currentDisplayDistance = targetDistance;
            clearInterval(countdownInterval); // Stop the ticker when it reaches the target
        } else {
            // Distance down
            let progress = stepCount / steps;
            currentDisplayDistance = Math.round(startDistance - (distanceDifference * progress));
        }

        // Update the text in real-time
        warningText.innerText = `TRIPLE T IS ${currentDisplayDistance.toLocaleString()} METERS AWAY FROM YOU.`;
    }, intervalTime);

    // Automatically hide overlay after 8 seconds and load next round
    setTimeout(() => {
        overlay.style.display = "none";
        
        currentRound++;
        loadNextRound();
    }, 8000);
}

function endGame() {
    let scoreClass = score < 50 ? "score-low" : "score-high";

    document.getElementById("quiz-screen").innerHTML = `
        <h2>Game Over!</h2>
        <div class="score-container">
            <p>Your Final Score</p>
            <strong class="${scoreClass}">${score} / 100</strong>
        </div>
        <button onclick="location.reload()">Play Again</button>
    `;
}