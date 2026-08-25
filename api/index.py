from fastapi import FastAPI, HTTPException, Header, Query
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Clyde's Toy Corner",
    description="The Clyde's Toy Corner Store utilizing FastAPI to provide a simple API for toy enthusiasts.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# TOYS DATA
toys = [

    {

	    "id": 1,
	    "title": "LEGO Creator Expert 10246 Detective's Office",
	    "brand": "LEGO",
	    "year": 2015,
	    "genre": "Building Blocks",
	    "price": 35000.00,
	    "stock": 2,
	    "image": "images/lego_detecivesoffice.jpg" 
    },
    {
        "id": 2,
        "title": "LEGO City 60409 Yellow Mobile Construction Crane",
        "brand": "LEGO",
        "year": 2024,
        "genre": "Building Blocks",
        "price": 7190.00,
        "stock": 10,
        "image": "images/lego_crane.jpg"
    },
    {
        "id": 3,
        "title": "LEGO City 60420 Construction Excavator",
        "brand": "LEGO",
        "year": 2024,
        "genre": "Building Blocks",
        "price": 4500.00,
        "stock": 15,
        "image": "images/lego_excavator.jpg"
    },
    {
        "id": 4,
        "title": "LEGO City 60492 Passenger Jet",
        "brand": "LEGO",
        "year": 2026,
        "genre": "Building Blocks",
        "price": 2500.00,
        "stock": 20,
        "image": "images/lego_jet.jpg"
    },
    {
        "id": 5,
        "title": "Lego Star Wars 75419 Death Star",
        "brand": "LEGO",
        "year": 2025,
        "genre": "Building Blocks",
        "price": 72999.00,
        "stock": 3,
        "image": "images/lego_deathstar.jpg"
    },
    {
        "id": 6,
        "title": "PG Unleashed RX-78-2 Gundam",
        "brand": "Bandai",
        "year": 2020,
        "genre": "Mecha Model Kits",
        "price": 7500.00,
        "stock": 5,
        "image": "images/pg_unleashed.jpg"
    },
    {
        "id": 7,
        "title": "PG Unicorn Gundam",
        "brand": "Bandai",
        "year": 2014,
        "genre": "Mecha Model Kits",
        "price": 6500.00,
        "stock": 6,
        "image": "images/pg_unicorn.jpg"
    },
    {
        "id": 8,
        "title": "PG Zeta Gundam",
        "brand": "Bandai",
        "year": 2000,
        "genre": "Mecha Model Kits",
        "price": 6000.00,
        "stock": 4,
        "image": "images/pg_zeta.jpg"
    },
    {
        "id": 9,
        "title": "Tung Tung Sahur",
        "brand": "Brainrot Corporation",
        "year": 2024,
        "genre": "Novelty Toys",
        "price": 350.00,
        "stock": 30,
        "image": "images/tung_tung.jpg"
    },
    {
        "id": 10,
        "title": "Tomica Premium No. 10 Toyota Crown Police Car",
        "brand": "Takara Tomy",
        "year": 2024,
        "genre": "Diecast Cars",
        "price": 550.00,
        "stock": 25,
        "image": "images/tomica_crown.jpg"
    },
    {
        "id": 11,
        "title": "Tomica PREMIUM unlimited 01 INITIAL D AE86 (FUJIWARA TAKUMI)",
        "brand": "Takara Tomy",
        "year": 2021,
        "genre": "Diecast Cars",
        "price": 850.00,
        "stock": 12,
        "image": "images/tomica_ae86.jpg"
    },
    {
        "id": 12,
        "title": "Colers the Penguin",
        "brand": "Albay Corp.",
        "year": 2006,
        "genre": "Soft Toys",
        "price": 1721.00,
        "stock": 1,
        "image": "images/colers_penguin.jpg"
    },
    {
        "id": 13,
        "title": "Lego IT/Computer Science Student Minifigure",
        "brand": "LEGO",
        "year": 2026,
        "genre": "Building Blocks",
        "price": 70000.00,
        "stock": 30,
        "image": "images/lego_student.jpg"
	},
    {
        "id": 13,
        "title": "LEGO IT/Computer Science Student Minifigure",
        "brand": "LEGO",
        "year": 2026,
        "genre": "Building Blocks",
        "price": 70000.00,
        "stock": 30,
        "image": "images/lego_student.jpg"
    },
    {
        "id": 14,
        "title": "Skibidi Toilet Deluxe Toilet RC",
        "brand": "Skibidi Toilet Corp.",
        "year": 2023,
        "genre": "Novelty Toys",
        "price": 2500.00,
        "stock": 5,
        "image": "images/skibidi.jpg"
    },
    {
        "id": 15,
        "title": "TOMICA No.79 Toyota HIMEDIC",
        "brand": "Takara Tomy",
        "year": 20,
        "genre": "Diecast Cars",
        "price": 550.00,
        "stock": 20,
        "image": "images/tomica_ambulance.jpg"
    },
    {
        "id": 16,
        "title": "LEGO Creator 31026: Bike Shop and Cafe",
        "brand": "Lego",
        "year": 2014,
        "genre": "Building Blocks",
        "price": 9000.00,
        "stock": 4,
        "image": "images/lego_bikeshop_cafe.jpg"
    },
    {
        "id": 17,
        "title": "LEGO City 4436 Patrol Car Forest Police",
        "brand": "Lego",
        "year": 2011,
        "genre": "Building Blocks",
        "price": 1200.00,
        "stock": 26,
        "image": "images/lego_forest_police.jpg"
    },
    {
        "id": 18,
        "title": "LEGO City 7236 City Police Car",
        "brand": "Lego",
        "year": 2005,
        "genre": "Building Blocks",
        "price": 1000.00,
        "stock": 26,
        "image": "images/lego_city_police.jpg"
    },
    {
        "id": 19,
        "title": "LEGO Movie 70802 Bad Cop's Pursuit",
        "brand": "Lego",
        "year": 2014,
        "genre": "Building Blocks",
        "price": 2650.00,
        "stock": 26,
        "image": "images/lego_emmet.jpg"
    },
    {
        "id": 20,
        "title": "LEGO City 60073 Service Truck",
        "brand": "Lego",
        "year": 2015,
        "genre": "Building Blocks",
        "price": 3200.00,
        "stock": 5,
        "image": "images/lego_service_truck.jpg"
    }
]

# HOME
@app.get("/")
def home():

    return {
        "message": "Welcome to Clyde's Toy Corner API!",
        "endpoints": [
            "/toys",
            "/toys/{id}",
            "/toys/search"
        ]
    }


# GET ALL TOYS
@app.get("/toys")
def get_toys():

    return {
        "count": len(toys),
        "toys": toys
    }

"""
August 22, 2026 | 3:22PM

- If Car ID is the first rule, it will take everything even a string like "search" and treat it as a "int" (car ID).
- If Search is the first rule, it checks first if its a "search query" then moves on the Car ID rule to check if its a "int" (car ID) thus displaying the correct result.
    - If the user automatically types "/cars/1/" in the URL with respect to Search first rule, it skips the search entirely and proceeds to the Car ID rule.

August 23, 2026 | 9:42PM:

- Changed the overall theme to "Toys".
    
"""

# SEARCH TOYS
@app.get("/toys/search")
def search_toys( q: str = Query(..., min_length=1)):
    q = q.lower()
    results = []
    for toy in toys:
        searchable_text = (
            f"{toy['title']} "
            f"{toy['brand']} "
            f"{toy['year']} "
            f"{toy['genre']}"
        ).lower()

        if q in searchable_text:
            results.append(toy)

    return {
        "query": q,
        "count": len(results),
        "results": results
    }

# GET ONE TOY
@app.get("/toys/{toy_id}")
def get_toy(toy_id: int):

    for toy in toys:

        if toy["id"] == toy_id:
            return toy

    raise HTTPException(
        status_code=404,
        detail="Oops! That toy must be hiding in the toy box. Let's try another search!"
    )
