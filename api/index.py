from fastapi import FastAPI, HTTPException, Header, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional, Literal
from fastapi.responses import FileResponse
import os

# ============================================================
# CONFIGURATION
# ============================================================
API_KEY = "clyde-api-key-2606"
API_VERSION = "1.0"

app = FastAPI(
    title="Clyde's Toy Shop",
    description="The Clyde's Toy Shop utilizing FastAPI to provide a simple API for toy enthusiasts.",
    version=API_VERSION
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# DATA MODEL
# ============================================================
class Toy(BaseModel):
    id: int
    title: str = Field(min_length=1)
    brand: str = Field(min_length=1)
    year: int = Field(ge=1900, le=datetime.now().year)
    genre: Literal[
        "Building Blocks", 
        "Mecha Model Kits", 
        "Novelty Toys", 
        "Diecast Cars", 
        "Soft Toys", 
        "Action Figures", 
        "Board Games", 
        "RC Toys", 
        "Other", # Safety Net
    ]
    price: float = Field(gt=0)
    stock: int = Field(ge=0)
    image: str = Field(min_length=1)
    description: str = Field(min_length=1)
    rating: str = Field(min_length=1)
    age_range: str = Field(min_length=1)
    dimensions: str = Field(min_length=1)
    height: str = Field(min_length=1)
    weight: str = Field(min_length=1)

# ============================================================
# TOYS DATA
# ============================================================
toys = [

    {
        "id": 1,
        "title": "LEGO Creator Expert 10246 Detective's Office",
        "brand": "LEGO",
        "year": 2015,
        "genre": "Building Blocks",
        "price": 35000.00,
        "stock": 0,
        "image": "https://cc-assignment-kappa.vercel.app/api/v1/images/lego_detecivesoffice.jpg",
        "description": "A detailed modular building featuring a detective's office, pool hall, and hidden smuggling compartments.",
        "rating": "4.9",
        "age_range": "16+",
        "dimensions": "25 x 25 x 27 cm",
        "height": "27 cm",
        "weight": "1.5 kg"
    },
    {
        "id": 2,
        "title": "LEGO City 60409 Yellow Mobile Construction Crane",
        "brand": "LEGO",
        "year": 2024,
        "genre": "Building Blocks",
        "price": 7190.00,
        "stock": 10,
        "image": "https://cc-assignment-kappa.vercel.app/api/v1/images/lego_crane.jpg",
        "description": "A heavy-duty construction crane toy equipped with fold-out support legs and a working winch.",
        "rating": "4.8",
        "age_range": "9+",
        "dimensions": "48 x 28 x 6 cm",
        "height": "68 cm",
        "weight": "1.2 kg"
    },
    {
        "id": 3,
        "title": "LEGO City 60420 Construction Excavator",
        "brand": "LEGO",
        "year": 2024,
        "genre": "Building Blocks",
        "price": 4500.00,
        "stock": 15,
        "image": "https://cc-assignment-kappa.vercel.app/api/v1/images/lego_excavator.jpg",
        "description": "A realistic tracked excavator featuring a versatile pneumatic-style bucket and worker minifigure.",
        "rating": "4.7",
        "age_range": "8+",
        "dimensions": "38 x 26 x 7 cm",
        "height": "12 cm",
        "weight": "0.8 kg"
    },
    {
        "id": 4,
        "title": "LEGO City 60492 Passenger Jet",
        "brand": "LEGO",
        "year": 2026,
        "genre": "Building Blocks",
        "price": 2500.00,
        "stock": 20,
        "image": "https://cc-assignment-kappa.vercel.app/api/v1/images/lego_jet.jpg",
        "description": "A large commercial passenger airplane model complete with a terminal vehicle and travel accessories.",
        "rating": "4.6",
        "age_range": "6+",
        "dimensions": "35 x 20 x 7 cm",
        "height": "19 cm",
        "weight": "0.6 kg"
    },
    {
        "id": 5,
        "title": "LEGO Star Wars 75419 Death Star",
        "brand": "LEGO",
        "year": 2025,
        "genre": "Building Blocks",
        "price": 72999.00,
        "stock": 3,
        "image": "https://cc-assignment-kappa.vercel.app/api/v1/images/lego_deathstar.jpg",
        "description": "An ultimate galactic battle station playset featuring iconic rooms and classic Star Wars characters.",
        "rating": "5.0",
        "age_range": "18+",
        "dimensions": "50 x 50 x 40 cm",
        "height": "41 cm",
        "weight": "3.5 kg"
    },
    {
        "id": 6,
        "title": "PG Unleashed RX-78-2 Gundam",
        "brand": "Bandai",
        "year": 2020,
        "genre": "Mecha Model Kits",
        "price": 7500.00,
        "stock": 5,
        "image": "https://cc-assignment-kappa.vercel.app/api/v1/images/pg_unleashed.jpg",
        "description": "A masterpiece grade model kit featuring an intricate internal frame and metallic plating effects.",
        "rating": "4.9",
        "age_range": "15+",
        "dimensions": "40 x 30 x 15 cm",
        "height": "30 cm",
        "weight": "2.0 kg"
    },
    {
        "id": 7,
        "title": "PG Unicorn Gundam",
        "brand": "Bandai",
        "year": 2014,
        "genre": "Mecha Model Kits",
        "price": 6500.00,
        "stock": 6,
        "image": "https://cc-assignment-kappa.vercel.app/api/v1/images/pg_unicorn.jpg",
        "description": "A highly transformable Perfect Grade model kit with LED compatibility and psycho-frame panels.",
        "rating": "4.8",
        "age_range": "15+",
        "dimensions": "38 x 30 x 12 cm",
        "height": "30 cm",
        "weight": "1.8 kg"
    },
    {
        "id": 8,
        "title": "PG Zeta Gundam",
        "brand": "Bandai",
        "year": 2000,
        "genre": "Mecha Model Kits",
        "price": 6000.00,
        "stock": 4,
        "image": "https://cc-assignment-kappa.vercel.app/api/v1/images/pg_zeta.jpg",
        "description": "A classic Perfect Grade kit capable of transforming between mobile suit and wave rider modes.",
        "rating": "4.5",
        "age_range": "15+",
        "dimensions": "45 x 30 x 15 cm",
        "height": "31 cm",
        "weight": "1.6 kg"
    },
    {
        "id": 9,
        "title": "Tung Tung Sahur",
        "brand": "Brainrot Corporation",
        "year": 2024,
        "genre": "Novelty Toys",
        "price": 350.00,
        "stock": 30,
        "image": "https://cc-assignment-kappa.vercel.app/api/v1/images/tung_tung.jpg",
        "description": "A funny viral internet meme plush toy that plays loud wake-up sounds.",
        "rating": "1",
        "age_range": "8+",
        "dimensions": "15 x 10 x 20 cm",
        "height": "20 cm",
        "weight": "0.2 kg"
    },
    {
        "id": 10,
        "title": "Tomica Premium No. 10 Toyota Crown Police Car",
        "brand": "Takara Tomy",
        "year": 2024,
        "genre": "Diecast Cars",
        "price": 550.00,
        "stock": 25,
        "image": "https://cc-assignment-kappa.vercel.app/api/v1/images/tomica_crown.jpg",
        "description": "A highly detailed diecast model of a Japanese highway patrol cruiser.",
        "rating": "4",
        "age_range": "6+",
        "dimensions": "8 x 4 x 3 cm",
        "height": "3 cm",
        "weight": "0.05 kg"
    },
    {
        "id": 11,
        "title": "Tomica PREMIUM unlimited 01 INITIAL D AE86 (FUJIWARA TAKUMI)",
        "brand": "Takara Tomy",
        "year": 2021,
        "genre": "Diecast Cars",
        "price": 850.00,
        "stock": 12,
        "image": "https://cc-assignment-kappa.vercel.app/api/v1/images/tomica_ae86.jpg",
        "description": "A collectible diecast replica of the legendary street racing tofu delivery car from Initial D.",
        "rating": "4.9",
        "age_range": "6+",
        "dimensions": "8 x 4 x 3 cm",
        "height": "3 cm",
        "weight": "0.05 kg"
    },
    {
        "id": 12,
        "title": "Colers the Penguin",
        "brand": "Albay Corp.",
        "year": 2006,
        "genre": "Soft Toys",
        "price": 1721.00,
        "stock": 1,
        "image": "https://cc-assignment-kappa.vercel.app/api/v1/images/colers_penguin.jpg",
        "description": "A very cute plush penguin toy wearing a dinosaur jacket.",
        "rating": "5",
        "age_range": "3+",
        "dimensions": "20 x 15 x 25 cm",
        "height": "25 cm",
        "weight": "0.4 kg"
    },
    {
        "id": 13,
        "title": "LEGO IT/Computer Science Student Minifigure",
        "brand": "LEGO",
        "year": 2026,
        "genre": "Building Blocks",
        "price": 70000.00,
        "stock": 30,
        "image": "https://cc-assignment-kappa.vercel.app/api/v1/images/lego_student.jpg",
        "description": "A special edition university student minifigure equipped with a indestructible 10 year old Thinkpad laptop and deadlines in mind.",
        "rating": "3.0",
        "age_range": "6+",
        "dimensions": "5 x 3 x 10 cm",
        "height": "4 cm",
        "weight": "0.01 kg"
    },
    {
        "id": 14,
        "title": "Skibidi Toilet Deluxe Toilet RC",
        "brand": "Skibidi Toilet Corp.",
        "year": 2023,
        "genre": "Novelty Toys",
        "price": 2500.00,
        "stock": 5,
        "image": "https://cc-assignment-kappa.vercel.app/api/v1/images/skibidi.jpg",
        "description": "A remote-controlled novelty toy featuring sound effects and moving character parts.",
        "rating": "1.4",
        "age_range": "8+",
        "dimensions": "18 x 12 x 22 cm",
        "height": "22 cm",
        "weight": "0.5 kg"
    },
    {
        "id": 15,
        "title": "TOMICA No.79 Toyota HIMEDIC",
        "brand": "Takara Tomy",
        "year": 2020,
        "genre": "Diecast Cars",
        "price": 550.00,
        "stock": 20,
        "image": "https://cc-assignment-kappa.vercel.app/api/v1/images/tomica_ambulance.jpg",
        "description": "A realistic diecast model of a Japanese emergency medical service ambulance.",
        "rating": "3.5",
        "age_range": "6+",
        "dimensions": "8 x 4 x 3 cm",
        "height": "3 cm",
        "weight": "0.05 kg"
    },
    {
        "id": 16,
        "title": "LEGO Creator 31026: Bike Shop and Cafe",
        "brand": "Lego",
        "year": 2014,
        "genre": "Building Blocks",
        "price": 9000.00,
        "stock": 4,
        "image": "https://cc-assignment-kappa.vercel.app/api/v1/images/lego_bikeshop_cafe.jpg",
        "description": "A charming 3-in-1 modular street corner set featuring a cozy cafe and a bicycle store.",
        "rating": "4.8",
        "age_range": "9+",
        "dimensions": "38 x 26 x 7 cm",
        "height": "19 cm",
        "weight": "1.1 kg"
    },
    {
        "id": 17,
        "title": "LEGO City 4436 Patrol Car Forest Police",
        "brand": "Lego",
        "year": 2011,
        "genre": "Building Blocks",
        "price": 1200.00,
        "stock": 26,
        "image": "https://cc-assignment-kappa.vercel.app/api/v1/images/lego_forest_police.jpg",
        "description": "An off-road police vehicle set equipped for patrolling rugged mountain trails.",
        "rating": "4.5",
        "age_range": "5+",
        "dimensions": "15 x 14 x 6 cm",
        "height": "7 cm",
        "weight": "0.2 kg"
    },
    {
        "id": 18,
        "title": "LEGO City 7236 City Police Car",
        "brand": "Lego",
        "year": 2005,
        "genre": "Building Blocks",
        "price": 1000.00,
        "stock": 26,
        "image": "https://cc-assignment-kappa.vercel.app/api/v1/images/lego_city_police.jpg",
        "description": "A classic city patrol sedan set complete with an officer minifigure and speed camera accessory.",
        "rating": "4.4",
        "age_range": "5+",
        "dimensions": "14 x 6 x 6 cm",
        "height": "5 cm",
        "weight": "0.15 kg"
    },
    {
        "id": 19,
        "title": "LEGO Movie 70802 Bad Cop's Pursuit",
        "brand": "Lego",
        "year": 2014,
        "genre": "Building Blocks",
        "price": 2650.00,
        "stock": 26,
        "image": "https://cc-assignment-kappa.vercel.app/api/v1/images/lego_emmet.jpg",
        "description": "Get ready for high-speed action in the world of The LEGO Movie with the Bad Cop's Pursuit Building Set!",
        "rating": "4.7",
        "age_range": "7+",
        "dimensions": "26 x 19 x 6 cm",
        "height": "8 cm",
        "weight": "0.4 kg"
    },
    {
        "id": 20,
        "title": "LEGO City 60073 Service Truck",
        "brand": "Lego",
        "year": 2015,
        "genre": "Building Blocks",
        "price": 3200.00,
        "stock": 5,
        "image": "https://cc-assignment-kappa.vercel.app/api/v1/images/lego_service_truck.jpg",
        "description": "A city maintenance truck set equipped with a working crane arm and portable toilet.",
        "rating": "4.6",
        "age_range": "5+",
        "dimensions": "26 x 19 x 6 cm",
        "height": "9 cm",
        "weight": "0.35 kg"
    }
]

# Validate Starting Toy Dataset when the Application Launches
validated_Toys = [Toy(**toy).model_dump() for toy in toys]
toys = validated_Toys

# ============================================================
# API KEY AUTHENTICATION
# ============================================================
def verify_api_key(x_api_key: Optional[str] = Header(default=None)):
    if x_api_key != API_KEY:
        raise HTTPException(
            status_code=401,
            detail="Invalid or missing API key."
        )
    return True

# ============================================================
# HOME
# ============================================================
@app.get("/")
def home():

    return {
        "message": "Welcome to Clyde's Toy Shop API!",
        "endpoints": [
            "/toys",
            "/toys/{id}",
            "/toys/search"
        ]
    }

# ============================================================
# HEALTH CHECK (Public)
# ============================================================
@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "Clyde's Toy Shop API",
        "version": API_VERSION,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

# ============================================================
# GET TOY IMAGE (Protected)
# ============================================================
@app.get("/api/v1/images/{image_name}", dependencies=[Depends(verify_api_key)])
def get_toy_image(image_name: str):
    file_path = os.path.join("images", image_name)
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type="image/jpeg")
    raise HTTPException(status_code=404, detail="Image not found.")

# ============================================================
# GET ALL TOYS (Protected)
# ============================================================
@app.get("/api/v1/toys", dependencies=[Depends(verify_api_key)])
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

# ============================================================
# SEARCH TOYS (Protected)
# ============================================================
@app.get("/api/v1/toys/search", dependencies=[Depends(verify_api_key)])
def search_toys( q: str = Query(..., min_length=1)):
    q = q.lower()
    results = []

    for toy in toys:
        searchable_text = (
            f"{toy['title']} "
            f"{toy['brand']} "
            f"{toy['year']} "
            f"{toy['genre']} "
            f"{toy['price']} "
            f"{toy['description']} "
            f"{toy['rating']} "
            f"{toy['age_range']} "
        ).lower()

        if q in searchable_text:
            results.append(toy)

    return {
        "query": q,
        "count": len(results),
        "results": results
    }

# ============================================================
# GET ONE TOY (Protected)
# ============================================================
@app.get("/api/v1/toys/{toy_id}", dependencies=[Depends(verify_api_key)])
def get_toy(toy_id: int):

    for toy in toys:

        if toy["id"] == toy_id:
            return toy

    raise HTTPException(
        status_code=404,
        detail="Oops! That toy must be hiding in the toy box. Let's try another search!"
    )
