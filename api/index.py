from fastapi import FastAPI, HTTPException, Header, Query, Depends, Response
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional, Literal
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from fastapi.staticfiles import StaticFiles
import bcrypt

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

class WishlistCreate(BaseModel):
    user_id: int
    toy_id: int

class CartItemCreate(BaseModel):
    user_id: int
    toy_id: int
    quantity: int = Field(default=1, gt=0)

class CartItemUpdate(BaseModel):
    quantity: int = Field(gt=0)

class OrderItemInput(BaseModel):
    toy_id: int
    quantity: int = Field(gt=0)

class OrderCreate(BaseModel):
    user_id: int
    items: Optional[list[OrderItemInput]] = None 

class OrderStatusUpdate(BaseModel):
    status: Literal["pending", "paid", "shipped", "completed", "cancelled"]

class SuperAdminCreateUser(BaseModel):
    role: Literal["customer", "staff"]
    email: str = Field(min_length=3, max_length=100)
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=6, max_length=255)
    is_active: bool = True

class SuperAdminResetPassword(BaseModel):
    new_password: str = Field(min_length=6, max_length=255)

class SuperAdminToggleStatus(BaseModel):
    is_active: bool

def hash_password(plain_password: str) -> str:
    return bcrypt.hashpw(plain_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

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
@app.post("/api/v1/auth/login", tags=["Authentication"], dependencies=[Depends(verify_api_key)])
def centralized_login(credentials: StaffLogin):
    def _verify_password(plain_pw: str, hashed_pw: Optional[str]) -> bool:
        if not hashed_pw:
            return False
        try:
            return bcrypt.checkpw(plain_pw.encode("utf-8"), hashed_pw.encode("utf-8"))
        except ValueError:
            return False

    # Check if user exists in staff_users table
    staff_res = supabase.table("staff_users").select("*").eq("username", credentials.username).execute()
    if staff_res.data: # Return list of Staff Users if found, else return empty list.[cite: 3]
        user = staff_res.data[0]
        if user.get("is_active") is False:
            raise HTTPException(status_code=403, detail="This account has been deactivated.")
        if _verify_password(credentials.password, user.get("password")):
            return {
                "message": "Login successful!",
                "user_id": user["id"],
                "username": user["username"],
                "role": "staff"
            }

    # Check if user exists in customer_users table
    cust_res = supabase.table("customer_users").select("*").eq("username", credentials.username).execute()
    if cust_res.data: # Return list of Customer Users if found, else return empty list.
        user = cust_res.data[0]
        if user.get("is_active") is False:
            raise HTTPException(status_code=403, detail="This account has been deactivated.")
        if _verify_password(credentials.password, user.get("password")):
            return {
                "message": "Login successful!",
                "user_id": user["id"],
                "username": user["username"],
                "role": "customer"
            }

    # Check if user exists in super_admin table
    sa_res = supabase.table("super_admin").select("*").eq("username", credentials.username).execute()
    if sa_res.data:
        user = sa_res.data[0]
        if user.get("is_active") is False:
            raise HTTPException(status_code=403, detail="This account has been deactivated.")
        if _verify_password(credentials.password, user.get("password")):
            return {
                "message": "Login successful!",
                "user_id": user["id"],
                "username": user["username"],
                "role": "super_admin"
            }

    raise HTTPException(
        status_code=401,
        detail="Invalid username or password."
    )

# ============================================================
# HOME
# ============================================================
@app.get("/", tags=["Other"],)
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
@app.get("/health", tags=["Toys & Catalog"])
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
@app.get("/api/v1/images/{image_name}", tags=["Toys & Catalog"])
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
@app.get("/api/v1/toys", tags=["Toys & Catalog"], dependencies=[Depends(verify_api_key)])
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
@app.get("/api/v1/toys/search", tags=["Toys & Catalog"], dependencies=[Depends(verify_api_key)])
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
@app.get("/api/v1/toys/{toy_id}", tags=["Toys & Catalog"], dependencies=[Depends(verify_api_key)])
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
# WISHLIST ENDPOINTS (Protected)
# ============================================================
@app.get("/api/v1/wishlist/{user_id}", tags=["Customer Endpoints"], dependencies=[Depends(verify_api_key)])
def get_wishlist(user_id: int):
    res = (
        supabase.table("wishlist_items")
        .select("id, user_id, toy_id, toys(*)")
        .eq("user_id", user_id)
        .order("id", desc=False)
        .execute()
    )
    return {
        "user_id": user_id,
        "count": len(res.data),
        "items": res.data
    }

@app.post("/api/v1/wishlist", tags=["Customer Endpoints"], dependencies=[Depends(verify_api_key)])
def add_to_wishlist(item: WishlistCreate):
    # Verify customer and toy exist
    if not supabase.table("customer_users").select("id").eq("id", item.user_id).execute().data:
        raise HTTPException(status_code=404, detail="Customer not found.")
    if not supabase.table("toys").select("id").eq("id", item.toy_id).execute().data:
        raise HTTPException(status_code=404, detail="Toy not found.")

    # Avoid duplicate entry if already wishlisted
    existing = (
        supabase.table("wishlist_items")
        .select("*")
        .eq("user_id", item.user_id)
        .eq("toy_id", item.toy_id)
        .execute()
    )
    if existing.data:
        return {
            "message": "Toy is already in wishlist.",
            "item": existing.data[0]
        }

    inserted = (
        supabase.table("wishlist_items")
        .insert({"user_id": item.user_id, "toy_id": item.toy_id})
        .execute()
    )
    return {
        "message": "Added to wishlist!",
        "item": inserted.data[0] if inserted.data else None
    }

@app.delete("/api/v1/wishlist/{wishlist_item_id}", tags=["Customer Endpoints"], dependencies=[Depends(verify_api_key)])
def remove_from_wishlist(wishlist_item_id: int):
    check = supabase.table("wishlist_items").select("id").eq("id", wishlist_item_id).execute()
    if not check.data:
        raise HTTPException(status_code=404, detail="Wishlist item not found.")

    supabase.table("wishlist_items").delete().eq("id", wishlist_item_id).execute()
    return {"message": f"Wishlist item {wishlist_item_id} removed."}

# ============================================================
# CART ENDPOINTS (Protected)
# ============================================================
@app.get("/api/v1/cart/{user_id}", tags=["Customer Endpoints"], dependencies=[Depends(verify_api_key)])
def get_cart(user_id: int):
    res = (
        supabase.table("cart_item")
        .select("id, user_id, toy_id, quantity, toys(*)")
        .eq("user_id", user_id)
        .order("id", desc=False)
        .execute()
    )
    subtotal = 0.0
    for row in res.data:
        toy_info = row.get("toys") or {}
        subtotal += float(toy_info.get("price", 0)) * int(row.get("quantity", 0))

    return {
        "user_id": user_id,
        "count": len(res.data),
        "subtotal": round(subtotal, 2),
        "items": res.data
    }

@app.post("/api/v1/cart", tags=["Customer Endpoints"], dependencies=[Depends(verify_api_key)])
def add_to_cart(item: CartItemCreate):
    if not supabase.table("customer_users").select("id").eq("id", item.user_id).execute().data:
        raise HTTPException(status_code=404, detail="Customer not found.")

    toy_res = supabase.table("toys").select("id, stock").eq("id", item.toy_id).execute()
    if not toy_res.data:
        raise HTTPException(status_code=404, detail="Toy not found.")

    existing = (
        supabase.table("cart_item")
        .select("*")
        .eq("user_id", item.user_id)
        .eq("toy_id", item.toy_id)
        .execute()
    )

    if existing.data:
        current = existing.data[0]
        new_qty = int(current["quantity"]) + item.quantity
        if new_qty > int(toy_res.data[0]["stock"]):
            raise HTTPException(status_code=400, detail="Requested quantity exceeds available stock.")

        updated = (
            supabase.table("cart_item")
            .update({"quantity": new_qty})
            .eq("id", current["id"])
            .execute()
        )
        return {
            "message": "Cart quantity updated!",
            "item": updated.data[0] if updated.data else None
        }

    if item.quantity > int(toy_res.data[0]["stock"]):
        raise HTTPException(status_code=400, detail="Requested quantity exceeds available stock.")

    inserted = (
        supabase.table("cart_item")
        .insert({
            "user_id": item.user_id,
            "toy_id": item.toy_id,
            "quantity": item.quantity
        })
        .execute()
    )
    return {
        "message": "Added to cart!",
        "item": inserted.data[0] if inserted.data else None
    }

@app.put("/api/v1/cart/{cart_item_id}", tags=["Customer Endpoints"], dependencies=[Depends(verify_api_key)])
def update_cart_item(cart_item_id: int, payload: CartItemUpdate):
    existing = supabase.table("cart_item").select("*").eq("id", cart_item_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Cart item not found.")

    toy_id = existing.data[0]["toy_id"]
    toy_res = supabase.table("toys").select("stock").eq("id", toy_id).execute()
    if toy_res.data and payload.quantity > int(toy_res.data[0]["stock"]):
        raise HTTPException(status_code=400, detail="Requested quantity exceeds available stock.")

    updated = (
        supabase.table("cart_item")
        .update({"quantity": payload.quantity})
        .eq("id", cart_item_id)
        .execute()
    )
    return {
        "message": "Cart item updated!",
        "item": updated.data[0] if updated.data else None
    }

@app.delete("/api/v1/cart/{cart_item_id}", tags=["Customer Endpoints"], dependencies=[Depends(verify_api_key)])
def remove_cart_item(cart_item_id: int):
    check = supabase.table("cart_item").select("id").eq("id", cart_item_id).execute()
    if not check.data:
        raise HTTPException(status_code=404, detail="Cart item not found.")

    supabase.table("cart_item").delete().eq("id", cart_item_id).execute()
    return {"message": f"Cart item {cart_item_id} removed."}

# ============================================================
# ORDERS ENDPOINTS (Protected)
# ============================================================
@app.post("/api/v1/orders", tags=["Customer Endpoints"], dependencies=[Depends(verify_api_key)])
def create_order(payload: OrderCreate):
    if not supabase.table("customer_users").select("id").eq("id", payload.user_id).execute().data:
        raise HTTPException(status_code=404, detail="Customer not found.")

    # Use explicit items if provided, otherwise pull from customer's cart_item table
    line_items = []
    from_cart = False

    if payload.items and len(payload.items) > 0:
        line_items = [{"toy_id": i.toy_id, "quantity": i.quantity} for i in payload.items]
    else:
        cart_res = supabase.table("cart_item").select("toy_id, quantity").eq("user_id", payload.user_id).execute()
        if not cart_res.data:
            raise HTTPException(status_code=400, detail="Cannot place order: cart is empty.")
        line_items = [{"toy_id": row["toy_id"], "quantity": int(row["quantity"])} for row in cart_res.data]
        from_cart = True

    total_amount = 0.0
    prepared_order_items = []
    stock_updates = []

    for entry in line_items:
        toy_res = supabase.table("toys").select("id, title, price, stock").eq("id", entry["toy_id"]).execute()
        if not toy_res.data:
            raise HTTPException(status_code=404, detail=f"Toy ID {entry['toy_id']} not found.")

        toy = toy_res.data[0]
        qty = entry["quantity"]
        stock = int(toy["stock"])

        if qty <= 0:
            raise HTTPException(status_code=400, detail="Quantity must be greater than 0.")
        if qty > stock:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for '{toy['title']}'.")

        total_amount += float(toy["price"]) * qty
        prepared_order_items.append({"toy_id": toy["id"], "quantity": qty})
        stock_updates.append({"toy_id": toy["id"], "new_stock": stock - qty})

    # 1. Insert order
    order_res = (
        supabase.table("orders")
        .insert({
            "user_id": payload.user_id,
            "total_amount": round(total_amount, 2),
            "status": "pending"
        })
        .execute()
    )
    created_order = order_res.data[0]
    order_id = created_order["id"]

    # 2. Insert order_items linked to order_id
    items_to_insert = [
        {"order_id": order_id, "toy_id": item["toy_id"], "quantity": item["quantity"]}
        for item in prepared_order_items
    ]
    inserted_items = supabase.table("order_items").insert(items_to_insert).execute()

    # 3. Decrement toy stock
    for upd in stock_updates:
        supabase.table("toys").update({"stock": upd["new_stock"]}).eq("id", upd["toy_id"]).execute()

    # 4. Clear customer's cart if order came from cart
    if from_cart:
        supabase.table("cart_item").delete().eq("user_id", payload.user_id).execute()

    return {
        "message": "Order placed successfully!",
        "order": created_order,
        "items": inserted_items.data
    }

@app.get("/api/v1/orders/user/{user_id}", tags=["Customer Endpoints"], dependencies=[Depends(verify_api_key)])
def get_user_orders(user_id: int):
    orders_res = (
        supabase.table("orders")
        .select("*, order_items(*, toys(title, price, image))")
        .eq("user_id", user_id)
        .order("id", desc=True)
        .execute()
    )
    return {
        "user_id": user_id,
        "count": len(orders_res.data),
        "orders": orders_res.data
    }

@app.get("/api/v1/orders/{order_id}", tags=["Customer Endpoints"], dependencies=[Depends(verify_api_key)])
def get_order_by_id(order_id: int):
    res = (
        supabase.table("orders")
        .select("*, order_items(*, toys(title, brand, price, image))")
        .eq("id", order_id)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Order not found.")
    return res.data[0]

# ============================================================
#                       STAFF FUNCTIONS
# ============================================================

# ============================================================
# UPDATE ORDER STATUS (Staff Only - Protected)
# ============================================================
@app.patch(
    "/api/v1/orders/{order_id}/status",
    tags=["Staff Endpoints"],
    dependencies=[Depends(verify_api_key)],
)
def update_order_status(order_id: int, payload: OrderStatusUpdate):
    check = supabase.table("orders").select("id, status").eq("id", order_id).execute()
    if not check.data:
        raise HTTPException(status_code=404, detail="Order not found.")

    updated = (
        supabase.table("orders")
        .update({"status": payload.status})
        .eq("id", order_id)
        .execute()
    )
    return {
        "message": "Order status updated!",
        "order": updated.data[0] if updated.data else None,
    }

# ============================================================
# CREATE TOY (Staff Only - Protected)
# ============================================================
@app.post("/api/v1/toys", tags=["Staff Endpoints"], dependencies=[Depends(verify_api_key)])
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
@app.put("/api/v1/toys/{toy_id}", tags=["Staff Endpoints"], dependencies=[Depends(verify_api_key)])
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
@app.delete("/api/v1/toys/{toy_id}", tags=["Staff Endpoints"], dependencies=[Depends(verify_api_key)])
def delete_toy(toy_id: int):
    check = supabase.table("toys").select("*").eq("id", toy_id).execute()
    if not check.data:
        raise HTTPException(status_code=404, detail="Toy not found for deletion.")
        
    supabase.table("toys").delete().eq("id", toy_id).execute()
    
    return {
        "message": f"Toy ID {toy_id} successfully deleted from the catalog."
    }

# ============================================================
# SUPER ADMIN USER MANAGEMENT (Super Admin Only - Protected)
# ============================================================

def _role_table_name(role: str) -> str:
    if role == "customer":
        return "customer_users"
    if role == "staff":
        return "staff_users"
    raise HTTPException(status_code=400, detail="Invalid account role.")

@app.get("/api/v1/super-admin/customers", tags=["Super Admin"], dependencies=[Depends(verify_api_key)])
def list_customer_accounts():
    res = (
        supabase.table("customer_users")
        .select("id, email, username, is_active")
        .order("id", desc=False)
        .execute()
    )
    return {"count": len(res.data), "users": res.data}

@app.get("/api/v1/super-admin/staff", tags=["Super Admin"], dependencies=[Depends(verify_api_key)])
def list_staff_accounts():
    res = (
        supabase.table("staff_users")
        .select("id, email, username, is_active")
        .order("id", desc=False)
        .execute()
    )
    return {"count": len(res.data), "users": res.data}

@app.post("/api/v1/super-admin/users", tags=["Super Admin"], dependencies=[Depends(verify_api_key)])
def create_account_as_super_admin(payload: SuperAdminCreateUser):
    table_name = _role_table_name(payload.role)

    existing_user = supabase.table(table_name).select("id").eq("username", payload.username).execute()
    if existing_user.data:
        raise HTTPException(status_code=400, detail=f"Username '{payload.username}' already exists in {table_name}.")

    existing_email = supabase.table(table_name).select("id").eq("email", payload.email).execute()
    if existing_email.data:
        raise HTTPException(status_code=400, detail=f"Email '{payload.email}' already exists in {table_name}.")

    inserted = (
        supabase.table(table_name)
        .insert({
            "email": payload.email.strip(),
            "username": payload.username.strip(),
            "password": hash_password(payload.password),
            "is_active": payload.is_active,
        })
        .execute()
    )

    created = inserted.data[0] if inserted.data else {}
    created.pop("password", None)
    return {
        "message": f"{payload.role.capitalize()} account created successfully.",
        "user": created,
    }

@app.patch(
    "/api/v1/super-admin/users/{role}/{user_id}/password",
    tags=["Super Admin"],
    dependencies=[Depends(verify_api_key)],
)
def reset_user_password(role: Literal["customer", "staff"], user_id: int, payload: SuperAdminResetPassword):
    table_name = _role_table_name(role)
    check = supabase.table(table_name).select("id").eq("id", user_id).execute()
    if not check.data:
        raise HTTPException(status_code=404, detail=f"{role.capitalize()} account not found.")

    supabase.table(table_name).update({"password": hash_password(payload.new_password)}).eq("id", user_id).execute()
    return {"message": f"Password updated for {role} ID {user_id}."}

@app.patch(
    "/api/v1/super-admin/users/{role}/{user_id}/status",
    tags=["Super Admin"],
    dependencies=[Depends(verify_api_key)],
)
def toggle_account_status(role: Literal["customer", "staff"], user_id: int, payload: SuperAdminToggleStatus):
    table_name = _role_table_name(role)
    check = supabase.table(table_name).select("id").eq("id", user_id).execute()
    if not check.data:
        raise HTTPException(status_code=404, detail=f"{role.capitalize()} account not found.")

    supabase.table(table_name).update({"is_active": payload.is_active}).eq("id", user_id).execute()
    state_label = "activated" if payload.is_active else "deactivated"
    return {"message": f"{role.capitalize()} account ID {user_id} {state_label}."}

# ============================================================
#                WARNING: STATIC FILES BELOW
# ============================================================

# ============================================================
# ALWAYS KEEP THIS AT THE BOTTOM OF THE FILE, ALL NEW ROUTES SHOULD BE ABOVE THIS LINE.
# ============================================================
app.mount("/", StaticFiles(directory=".", html=True), name="static")