**How the "Clyde's Toy Shop Quiz" website works and fetches data from "Clyde's Toy Shop Website" (Main Website):**

1. **API Configuration & Authentication**
    - The application first connects to the shared backend endpoint that is hosted in Vercel, which is (`https://cc-assignment-kappa.vercel.app/api/v1/toys`). This is where the main website backend is hosted.
    - It authenticates requests by passing a unique security key (`clyde-api-key-quiz`) inside the request headers via `x-api-key`.

2. **The `startGame()` Fetch Workflow**
    - When the user clicks **Play Game** button on the frontend, it triggers the `startGame()` function on JS. It sends a network request "fetch" to Vercel's servers. Since the created API requires authentication, JS passes a `x-api-key` (`clyde-api-key-quiz`, which is an accepted or allowed API key from the API array) inside the request headers. This then gives the `go signal` to FastAPI code that **Clyde's Toy Ship Quiz Website** is allowed to retrieve and fetch data from **Clyde's Toy Ship Website**.
    - If the API key is unauthorized or the server encounters an error, a custom error is thrown, capturing the response status.

3. **Data Processing & Gameplay**
    - Upon a successful response, the backend returns a JSON Format of the Toy Array `data.toys` and stored in a list variable named `allToys`.
    - The application verifies that there must be more than `5 toys` in the array if the array does not meet the condition it throws an error. If the array has 5 or more toys it proceeds to shuffle the array randomly using `Math.random()`, and slices it to create a 10-round game session stored in `gameToys`.
    - Each round dynamically displays a toy image, title, and four price choices (3 fake prices and 1 real price) for the user to choose from. Thus successfully implementing the toy quiz gameplay.

4. **Error Handling**
    - If the connection fails or an authentication is rejected (eg., wrong x-api-key header) the website throws a `HTTP 401 error` and the `catch` block intercepts the error.
    - It replaces the main screen interface with a custom error message displaying the warning icon and the precise error message.



