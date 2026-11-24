**How the "Clyde's Toy Shop Gachapon Machine" website works and fetches data from "Clyde's Toy Shop Website" (Main Website):**

1. **API Configuration & Authentication**
    - The application first connects to the shared backend endpoint that is hosted in Vercel, which is (`https://cc-assignment-kappa.vercel.app/api/v1/toys`). This is where the main website backend is hosted.
    - It authenticates requests by passing a unique security key (`clyde-api-key-gashapon`) inside the request headers via `x-api-key`.

2. **The `fetchMasterToys()` Fetch Workflow**
    - When the application loads, JS automatically triggers the `fetchMasterToys()` function.
    - It sends a network request "fetch" to Vercel's servers. Since the created API requires authentication, JS passes a `x-api-key` (`clyde-api-key-gashapon`, which is an accepted or allowed API key from the API array) inside the request headers. This then gives the `go signal` to FastAPI code that **Clyde's Toy Shop Gachapon Machine** is allowed to retrieve and fetch data from **Clyde's Toy Ship Website**.
    - If the API key is unauthorized or the server encounters an error, a custom error is thrown, capturing the response status.
    - Once the request is approved, it retrieves the Toy List Data from the JSON response and stores to the variable `masterToyList`.

3. **Data Processing & Gameplay**
    - When the user cranks the machine, it triggers the `pullGacha()` function. It checks if the `masterToyList` is empty, if its empty trigger a backup response.
    - Play the following crank animation, sound effect, and randomly choose a Toy (via math function) from the `masterToyList`.
    - If a Toy has been chosen, push to `userInventory` list, save to `sessionStorage`, and display the Toy won to the User's screen.

4. **Error Handling**
    - If the connection fails or an authentication is rejected (eg., wrong x-api-key header) the website throws a `HTTP 401 error` and the `catch` block intercepts the error.
    - It replaces the main screen interface with a custom error message displaying the warning icon and the precise error message.



