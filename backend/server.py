from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from fastapi.responses import JSONResponse, RedirectResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from authlib.integrations.starlette_client import OAuth
import razorpay

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 720  # 30 days

# Razorpay Config
RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID', 'rzp_test_dummy')
RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET', 'dummy_secret')
razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

# OAuth Setup
oauth = OAuth()
oauth.register(
    name='google',
    client_id=os.environ.get('GOOGLE_CLIENT_ID'),
    client_secret=os.environ.get('GOOGLE_CLIENT_SECRET'),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)

app = FastAPI()
api_router = APIRouter(prefix="/api")

app.add_middleware(SessionMiddleware, secret_key=JWT_SECRET)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============= Models =============

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    picture: Optional[str] = None
    role: str = "user"  # user, admin, professional
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Category(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    image: Optional[str] = None
    description: Optional[str] = None

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    price: int  # in paise
    duration: Optional[str] = None
    category_id: str
    type: str = "product"  # product or package
    image: Optional[str] = None

class Professional(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: Optional[str] = None
    status: str = "active"  # active, inactive
    user_id: Optional[str] = None

class Booking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    product_id: str
    professional_id: Optional[str] = None
    address: str
    status: str = "pending"  # pending, accepted, on_the_way, completed, cancelled
    payment_id: Optional[str] = None
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    amount: int  # in paise
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ============= Input Models =============

class LoginResponse(BaseModel):
    token: str
    user: User

class CreateOrderRequest(BaseModel):
    product_id: str
    address: str

class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    booking_id: str

class UpdateBookingStatusRequest(BaseModel):
    status: str

class CategoryCreate(BaseModel):
    name: str
    image: Optional[str] = None
    description: Optional[str] = None

class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: int
    duration: Optional[str] = None
    category_id: str
    type: str = "product"
    image: Optional[str] = None

# ============= Auth Helpers =============

def create_jwt_token(user_data: dict) -> str:
    payload = {
        'user_id': user_data['id'],
        'email': user_data['email'],
        'role': user_data['role'],
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_jwt_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(request: Request) -> dict:
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = auth_header.split(' ')[1]
    payload = verify_jwt_token(token)
    user = await db.users.find_one({'id': payload['user_id']}, {'_id': 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

async def require_professional(user: dict = Depends(get_current_user)) -> dict:
    if user['role'] not in ['professional', 'admin']:
        raise HTTPException(status_code=403, detail="Professional access required")
    return user

# ============= Auth Routes =============

@api_router.get("/auth/google")
async def google_login(request: Request):
    # REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    redirect_uri = request.url_for('google_callback')
    return await oauth.google.authorize_redirect(request, redirect_uri)

@api_router.get("/auth/google/callback")
async def google_callback(request: Request):
    try:
        token = await oauth.google.authorize_access_token(request)
        user_info = token.get('userinfo')
        
        if not user_info:
            raise HTTPException(status_code=400, detail="Failed to get user info")
        
        # Check if user exists
        existing_user = await db.users.find_one({'email': user_info['email']}, {'_id': 0})
        
        if existing_user:
            user_data = existing_user
        else:
            # Create new user
            user_data = {
                'id': str(uuid.uuid4()),
                'email': user_info['email'],
                'name': user_info.get('name', ''),
                'picture': user_info.get('picture'),
                'role': 'user',
                'created_at': datetime.now(timezone.utc).isoformat()
            }
            await db.users.insert_one(user_data)
        
        jwt_token = create_jwt_token(user_data)
        
        # Redirect to frontend with token
        frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
        return RedirectResponse(url=f"{frontend_url}?token={jwt_token}")
    
    except Exception as e:
        logger.error(f"OAuth error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return user

# ============= Category Routes =============

@api_router.get("/categories")
async def get_categories():
    categories = await db.categories.find({}, {'_id': 0}).to_list(100)
    return categories

@api_router.post("/categories", dependencies=[Depends(require_admin)])
async def create_category(category: CategoryCreate):
    cat_dict = category.model_dump()
    cat_obj = Category(**cat_dict)
    await db.categories.insert_one(cat_obj.model_dump())
    return cat_obj

# ============= Product Routes =============

@api_router.get("/products")
async def get_products(category_id: Optional[str] = None, type: Optional[str] = None):
    query = {}
    if category_id:
        query['category_id'] = category_id
    if type:
        query['type'] = type
    products = await db.products.find(query, {'_id': 0}).to_list(1000)
    return products

@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    product = await db.products.find_one({'id': product_id}, {'_id': 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@api_router.post("/products", dependencies=[Depends(require_admin)])
async def create_product(product: ProductCreate):
    prod_dict = product.model_dump()
    prod_obj = Product(**prod_dict)
    await db.products.insert_one(prod_obj.model_dump())
    return prod_obj

# ============= Payment & Booking Routes =============

@api_router.post("/orders/create")
async def create_order(req: CreateOrderRequest, user: dict = Depends(get_current_user)):
    # Get product
    product = await db.products.find_one({'id': req.product_id}, {'_id': 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Create Razorpay order
    razorpay_order = razorpay_client.order.create({
        'amount': product['price'],
        'currency': 'INR',
        'payment_capture': 1
    })
    
    # Create booking
    booking = Booking(
        user_id=user['id'],
        product_id=req.product_id,
        address=req.address,
        amount=product['price'],
        razorpay_order_id=razorpay_order['id'],
        status='pending'
    )
    
    booking_dict = booking.model_dump()
    booking_dict['created_at'] = booking_dict['created_at'].isoformat()
    await db.bookings.insert_one(booking_dict)
    
    return {
        'booking_id': booking.id,
        'razorpay_order_id': razorpay_order['id'],
        'amount': product['price'],
        'key_id': RAZORPAY_KEY_ID
    }

@api_router.post("/orders/verify")
async def verify_payment(req: VerifyPaymentRequest, user: dict = Depends(get_current_user)):
    # Verify signature
    params_dict = {
        'razorpay_order_id': req.razorpay_order_id,
        'razorpay_payment_id': req.razorpay_payment_id,
        'razorpay_signature': req.razorpay_signature
    }
    
    try:
        razorpay_client.utility.verify_payment_signature(params_dict)
    except:
        raise HTTPException(status_code=400, detail="Payment verification failed")
    
    # Update booking
    booking = await db.bookings.find_one({'id': req.booking_id}, {'_id': 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Auto-assign professional
    professionals = await db.professionals.find({'status': 'active'}, {'_id': 0}).to_list(100)
    professional_id = professionals[0]['id'] if professionals else None
    
    await db.bookings.update_one(
        {'id': req.booking_id},
        {'$set': {
            'razorpay_payment_id': req.razorpay_payment_id,
            'payment_id': req.razorpay_payment_id,
            'status': 'accepted',
            'professional_id': professional_id
        }}
    )
    
    return {'success': True, 'booking_id': req.booking_id}

# ============= Booking Routes =============

@api_router.get("/bookings")
async def get_bookings(user: dict = Depends(get_current_user)):
    query = {}
    if user['role'] == 'user':
        query['user_id'] = user['id']
    elif user['role'] == 'professional':
        professional = await db.professionals.find_one({'user_id': user['id']}, {'_id': 0})
        if professional:
            query['professional_id'] = professional['id']
    
    bookings = await db.bookings.find(query, {'_id': 0}).sort('created_at', -1).to_list(1000)
    
    # Populate product and user details
    for booking in bookings:
        product = await db.products.find_one({'id': booking['product_id']}, {'_id': 0})
        booking['product'] = product
        
        user_data = await db.users.find_one({'id': booking['user_id']}, {'_id': 0})
        booking['user'] = user_data
    
    return bookings

@api_router.get("/bookings/{booking_id}")
async def get_booking(booking_id: str, user: dict = Depends(get_current_user)):
    booking = await db.bookings.find_one({'id': booking_id}, {'_id': 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Populate details
    product = await db.products.find_one({'id': booking['product_id']}, {'_id': 0})
    booking['product'] = product
    
    user_data = await db.users.find_one({'id': booking['user_id']}, {'_id': 0})
    booking['user'] = user_data
    
    return booking

@api_router.patch("/bookings/{booking_id}/status")
async def update_booking_status(
    booking_id: str,
    req: UpdateBookingStatusRequest,
    user: dict = Depends(require_professional)
):
    booking = await db.bookings.find_one({'id': booking_id}, {'_id': 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    await db.bookings.update_one(
        {'id': booking_id},
        {'$set': {'status': req.status}}
    )
    
    return {'success': True}

# ============= Professional Routes =============

@api_router.get("/professionals")
async def get_professionals():
    professionals = await db.professionals.find({}, {'_id': 0}).to_list(100)
    return professionals

# ============= Admin Stats =============

@api_router.get("/admin/stats", dependencies=[Depends(require_admin)])
async def get_admin_stats():
    total_bookings = await db.bookings.count_documents({})
    total_users = await db.users.count_documents({'role': 'user'})
    total_revenue = await db.bookings.aggregate([
        {'$match': {'status': {'$in': ['accepted', 'on_the_way', 'completed']}}},
        {'$group': {'_id': None, 'total': {'$sum': '$amount'}}}
    ]).to_list(1)
    
    revenue = total_revenue[0]['total'] if total_revenue else 0
    
    return {
        'total_bookings': total_bookings,
        'total_users': total_users,
        'total_revenue': revenue
    }

@api_router.get("/")
async def root():
    return {"message": "Intowns API"}

app.include_router(api_router)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
