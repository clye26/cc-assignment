**How the "Clyde's Toy Shop Website" website works:**

1. **API Configuration & Authentication**
    - The application first connects to the shared backend endpoint that is hosted in Vercel, which is (`https://cc-assignment-kappa.vercel.app/api/v1/toys`). This is where the main website backend is hosted, wherein it can manage Toy inventory, search queries, retrieve Toy details such as title, year, image, description, and etc.
    - It authenticates requests by passing a unique security key (`clyde-api-key-2606`) inside the request headers via `x-api-key`.

2. **The `loadToys()` & `fetchToyDetails()` Workflow**
    - Upon landing on the homepage, JS automatically triggers the `loadToys()` function. Which sends a network request "fetch" to Vercel's servers. Since the created API requires authentication, JS passes a `x-api-key` (`clyde-api-key-2606`, which is an accepted or allowed API key from the API array) inside the request headers. This then gives the `go signal` to FastAPI code that **Clyde's Toy Shop Website** is allowed to retrieve and fetch data from the hosted backend API.
    - If the API key is unauthorized or the server encounters an error, a custom error is thrown, capturing the response status.
    - Once the JSON response is received, the `loadToys()` function extracts the JSON and retrieves  `data.toys`, this is the array containing the complete collection of the Toy data.
    - It then passes this Toy list directly into the `displayToys()` function, which loops through each item in the array to dynamically build and render the product cards onto the frontend grid.

3. **Data Processing & UI Features**
    - Once the frontend receives the JSON response containing `data.toys`, the application loops through the array to dynamically build responsive 4-item product cards. Each product card is complete with title, genre, star rating, price, and interactive add to cart button.
    - The search bar captures user queries, sends a request to the `/toys/search` API endpoint, and dynamically updates the interface to display the matching products according to what the user searched for. The search function filters by title, brand, year, genre, price, description, rating, age range.
    - When a user clicks on a product card, they are redirected to `details.html?id={id}` or `details.html` page. It extracts the unique `Toy ID` from the `URL parameters`, requests that specific Toy item attributes from the `/toys/{id}` endpoint, and renders a detailed layout featuring full specifications of the Toy item, along with an interactive quantity selector.

4. **Error Handling**
    - If the connection fails or an authentication is rejected (eg., wrong x-api-key header) the website throws a `HTTP 401 error` and the `catch` block intercepts the error.
    - It replaces the main screen interface with a custom error message displaying the warning icon and the precise error message.



