from fastapi import FastAPI, HTTPException, Header, Query, Depends, Response
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional, Literal
import os
from dotenv import load_dotenv
from supabase import create_client, Client

# ============================================================
# CONFIGURATION & ENVIRONMENT SETUP
# ============================================================
# Removed hardcoded API key and Supabase credentials for security reasons. Now utilizing environment variables.
# This function loads the environment variables from the "root .env file".
load_dotenv()

# Read allowed/valid API keys from environment variables.
raw_keys = os.getenv("ALLOWED_KEYS", "")
ALLOWED_KEYS = [key.strip() for key in raw_keys.split(",")]

# Initialize Supabase Client Connection.
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

API_VERSION = "1.1"

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
class StaffLogin(BaseModel):
    username: str
    password: str

class Toy(BaseModel):
    id: Optional[int] = None # Supabase will auto-generate it.
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

# Removed the "toys" list and replaced it with a Supabase query to fetch toys from the database.

# ============================================================
# API KEY AUTHENTICATION
# ============================================================
def verify_api_key(x_api_key: Optional[str] = Header(default=None)):
    if x_api_key not in ALLOWED_KEYS:
        raise HTTPException(
            status_code=401,
            detail="Invalid or missing API key."
        )
    return True

# ============================================================
# STAFF LOGIN ENDPOINT
# ============================================================
@app.post("/api/v1/auth/login")
def staff_login(credentials: StaffLogin):
    # Query or call Supabase to find the Staff Member in the database.
    response = supabase.table("staff_users").select("*").eq("username", credentials.username).execute()
    users = response.data #response.data is the list of users returned from the query.

    if not users or users[0]["password"] != credentials.password:
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password."
        )
    
    return {
        "message": "Login successful!",
        "username": users[0]["username"]
    }

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
# GET TOY IMAGE (Public)
# ============================================================
@app.get("/api/v1/images/{image_name}")
def get_toy_image(image_name: str):
    file_path = os.path.join("images", image_name)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Image not found.")
    
    with open(file_path, "rb") as f:
        image_bytes = f.read()

    return Response(content=image_bytes, media_type="image/jpeg")

# ============================================================
# GET ALL TOYS FROM SUPABASE (Protected)
# ============================================================
@app.get("/api/v1/toys", dependencies=[Depends(verify_api_key)])
def get_toys():
    response = supabase.table("toys").select("*").order("id", desc=False).execute()
    toys_data = response.data

    return {
        "count": len(toys_data),
        "toys": toys_data
    }

# ============================================================
# SEARCH TOYS FROM SUPABASE (Protected)
# ============================================================
@app.get("/api/v1/toys/search", dependencies=[Depends(verify_api_key)])
def search_toys(q: str = Query(..., min_length=1)):
    response = supabase.table("toys").select("*").execute()
    toys_data = response.data

    q = q.lower()
    results = []

    for toy in toys_data:
        searchable_text = (
            f"{toy.get('title', '')} "
            f"{toy.get('brand', '')} "
            f"{toy.get('year', '')} "
            f"{toy.get('genre', '')} "
            f"{toy.get('price', '')} "
            f"{toy.get('description', '')} "
            f"{toy.get('rating', '')} "
            f"{toy.get('age_range', '')} "
        ).lower()

        if q in searchable_text:
            results.append(toy)

    return {
        "query": q,
        "count": len(results),
        "results": results
    }

# ============================================================
# GET ONE TOY FROM SUPABASE (Protected)
# ============================================================
@app.get("/api/v1/toys/{toy_id}", dependencies=[Depends(verify_api_key)])
def get_toy(toy_id: int):
    response = supabase.table("toys").select("*").eq("id", toy_id).execute()
    toys_data = response.data

    if not toys_data:
        raise HTTPException(
            status_code=404,
            detail="Oops! That toy must be hiding in the toy box. Let's try another search!"
        )

    return toys_data[0]

# ============================================================
#                       STAFF FUNCTIONS
# ============================================================

# ============================================================
# CREATE TOY (Staff Only - Protected)
# ============================================================
@app.post("/api/v1/toys", dependencies=[Depends(verify_api_key)])
def create_toy(toy: Toy):
    toy_data = toy.dict(exclude_unset=True)
    if "id" in toy_data and toy_data["id"] is None:
        del toy_data["id"]
        
    response = supabase.table("toys").insert(toy_data).execute()
    
    return {
        "message": "Toy successfully added to the catalog!",
        "toy": response.data
    }

# ============================================================
# UPDATE TOY (Staff Only - Protected)
# ============================================================
@app.put("/api/v1/toys/{toy_id}", dependencies=[Depends(verify_api_key)])
def update_toy(toy_id: int, toy: Toy):
    toy_data = toy.dict()
    response = supabase.table("toys").update(toy_data).eq("id", toy_id).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Toy not found for update.")
        
    return {
        "message": f"Toy ID {toy_id} successfully updated!",
        "toy": response.data
    }

# ============================================================
# DELETE TOY (Staff Only - Protected)
# ============================================================
@app.delete("/api/v1/toys/{toy_id}", dependencies=[Depends(verify_api_key)])
def delete_toy(toy_id: int):
    check = supabase.table("toys").select("*").eq("id", toy_id).execute()
    if not check.data:
        raise HTTPException(status_code=404, detail="Toy not found for deletion.")
        
    supabase.table("toys").delete().eq("id", toy_id).execute()
    
    return {
        "message": f"Toy ID {toy_id} successfully deleted from the catalog."
    }