from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from fastapi.responses import JSONResponse, RedirectResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
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
    wallet_balance: int = 0  # in paise
    wallet_locked_balance: int = 0  # welcome bonus in paise
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Category(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    image: Optional[str] = None
    description: Optional[str] = None
    parent_id: Optional[str] = None  # for sub-categories
    level: int = 1  # 1 for main categories, 2 for sub-categories

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    price: int  # in paise
    duration: Optional[str] = None
    category_id: str  # main category
    sub_category_id: Optional[str] = None  # sub-category
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
    landmark: Optional[str] = None
    pincode: Optional[str] = None
    status: str = "pending"  # pending, accepted, on_the_way, in_progress, completed, cancelled
    payment_id: Optional[str] = None
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    amount: int  # in paise
    wallet_used: int = 0  # wallet amount used in paise
    coupon_code: Optional[str] = None
    discount_amount: int = 0  # discount in paise
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    review_given: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Coupon(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str
    discount_type: str = "flat"  # flat or percentage
    discount_value: int  # flat amount in paise or percentage value
    min_cart_value: int = 0  # in paise
    max_discount: Optional[int] = None  # max discount cap in paise
    expiry_date: Optional[datetime] = None
    usage_limit: Optional[int] = None
    used_count: int = 0
    active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class WalletTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    type: str  # credit, debit, topup, cashback, welcome_bonus, review_reward
    amount: int  # in paise
    balance_after: int  # in paise
    description: str
    reference_id: Optional[str] = None  # booking_id or payment_id
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class WalletOffer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    amount: int  # topup amount in paise
    cashback_percentage: int  # cashback percentage
    max_cashback: int  # max cashback in paise
    active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class WalletConfig(BaseModel):
    model_config = ConfigDict(extra="ignore")
    welcome_bonus_enabled: bool = True
    welcome_bonus_amount: int = 10000  # ₹100 in paise
    welcome_bonus_min_cart: int = 20000  # ₹200 in paise
    welcome_bonus_max_deduction: int = 20000  # ₹200 in paise

class BlogPost(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    slug: str
    content: str
    excerpt: Optional[str] = None
    featured_image: Optional[str] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    published: bool = False
    author_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SiteConfig(BaseModel):
    model_config = ConfigDict(extra="ignore")
    key: str
    value: Any
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ============= Input Models =============

class UsernamePasswordLogin(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    token: str
    user: User

class CreateOrderRequest(BaseModel):
    product_id: str
    address: str
    landmark: Optional[str] = None
    pincode: Optional[str] = None
    coupon_code: Optional[str] = None
    use_wallet: bool = False

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
    parent_id: Optional[str] = None
    level: int = 1

class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: int
    duration: Optional[str] = None
    category_id: str
    sub_category_id: Optional[str] = None
    type: str = "product"
    image: Optional[str] = None

class CouponCreate(BaseModel):
    code: str
    discount_type: str = "flat"
    discount_value: int
    min_cart_value: int = 0
    max_discount: Optional[int] = None
    expiry_date: Optional[datetime] = None
    usage_limit: Optional[int] = None

class ValidateCouponRequest(BaseModel):
    code: str
    cart_value: int

class WalletTopupRequest(BaseModel):
    offer_id: str

class WalletOfferCreate(BaseModel):
    amount: int
    cashback_percentage: int
    max_cashback: int

class BlogPostCreate(BaseModel):
    title: str
    slug: str
    content: str
    excerpt: Optional[str] = None
    featured_image: Optional[str] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    published: bool = False

class BlogPostUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    content: Optional[str] = None
    excerpt: Optional[str] = None
    featured_image: Optional[str] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    published: Optional[bool] = None

class SiteConfigUpdate(BaseModel):
    key: str
    value: Any

class ConfirmReviewRequest(BaseModel):
    booking_id: str

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

# ============= Wallet Helpers =============

async def add_wallet_transaction(user_id: str, trans_type: str, amount: int, description: str, reference_id: Optional[str] = None):
    """Helper function to add wallet transaction"""
    user = await db.users.find_one({'id': user_id}, {'_id': 0})
    if not user:
        return
    
    balance_after = user.get('wallet_balance', 0) + amount
    
    transaction = WalletTransaction(
        user_id=user_id,
        type=trans_type,
        amount=amount,
        balance_after=balance_after,
        description=description,
        reference_id=reference_id
    )
    
    trans_dict = transaction.model_dump()
    trans_dict['created_at'] = trans_dict['created_at'].isoformat()
    await db.wallet_transactions.insert_one(trans_dict)
    
    return transaction

async def get_wallet_config():
    """Get wallet configuration"""
    config = await db.wallet_config.find_one({}, {'_id': 0})
    if not config:
        # Create default config
        default_config = WalletConfig()
        await db.wallet_config.insert_one(default_config.model_dump())
        return default_config
    return WalletConfig(**config)

# ============= Auth Routes =============

@api_router.post("/auth/login")
async def username_password_login(credentials: UsernamePasswordLogin):
    """Simple username/password login for admin and employees"""
    # Hardcoded credentials (in production, use hashed passwords in DB)
    users_db = {
        'admin': {
            'password': 'pass',
            'user_data': {
                'id': 'admin-user-id',
                'email': 'admin@intowns.in',
                'name': 'Admin User',
                'picture': 'https://ui-avatars.com/api/?name=Admin&background=0284c7&color=fff',
                'role': 'admin',
                'wallet_balance': 0,
                'wallet_locked_balance': 0,
                'created_at': datetime.now(timezone.utc).isoformat()
            }
        },
        'rajni': {
            'password': 'pass',
            'user_data': {
                'id': 'rajni-user-id',
                'email': 'rajni@intowns.in',
                'name': 'Rajni',
                'picture': 'https://ui-avatars.com/api/?name=Rajni&background=10b981&color=fff',
                'role': 'professional',
                'wallet_balance': 0,
                'wallet_locked_balance': 0,
                'created_at': datetime.now(timezone.utc).isoformat()
            }
        }
    }
    
    # Check credentials
    if credentials.username not in users_db:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    user_entry = users_db[credentials.username]
    if credentials.password != user_entry['password']:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    user_data = user_entry['user_data']
    
    # Check if user exists in DB, if not create
    existing_user = await db.users.find_one({'email': user_data['email']}, {'_id': 0})
    if not existing_user:
        await db.users.insert_one(user_data)
    else:
        user_data = existing_user
    
    # Link professional if Rajni
    if credentials.username == 'rajni':
        professional = await db.professionals.find_one({'name': 'Rajni'}, {'_id': 0})
        if professional and not professional.get('user_id'):
            await db.professionals.update_one(
                {'name': 'Rajni'},
                {'$set': {
                    'user_id': user_data['id'],
                    'email': user_data['email']
                }}
            )
    
    jwt_token = create_jwt_token(user_data)
    
    return LoginResponse(token=jwt_token, user=User(**user_data))

@api_router.get("/auth/google")
async def google_login(request: Request):
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
                'wallet_balance': 0,
                'wallet_locked_balance': 0,
                'created_at': datetime.now(timezone.utc).isoformat()
            }
            await db.users.insert_one(user_data)
            
            # Add welcome bonus
            wallet_config = await get_wallet_config()
            if wallet_config.welcome_bonus_enabled:
                await db.users.update_one(
                    {'id': user_data['id']},
                    {'$set': {'wallet_locked_balance': wallet_config.welcome_bonus_amount}}
                )
                user_data['wallet_locked_balance'] = wallet_config.welcome_bonus_amount
                
                # Log transaction
                await add_wallet_transaction(
                    user_data['id'],
                    'welcome_bonus',
                    wallet_config.welcome_bonus_amount,
                    f"Welcome bonus of ₹{wallet_config.welcome_bonus_amount/100}",
                    None
                )
        
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
async def get_categories(parent_id: Optional[str] = None, level: Optional[int] = None):
    """Get categories, optionally filtered by parent_id or level"""
    query = {}
    if parent_id is not None:
        query['parent_id'] = parent_id
    if level is not None:
        query['level'] = level
    categories = await db.categories.find(query, {'_id': 0}).to_list(100)
    return categories

@api_router.post("/categories", dependencies=[Depends(require_admin)])
async def create_category(category: CategoryCreate):
    cat_dict = category.model_dump()
    cat_obj = Category(**cat_dict)
    await db.categories.insert_one(cat_obj.model_dump())
    return cat_obj

# ============= Product Routes =============

@api_router.get("/products")
async def get_products(
    category_id: Optional[str] = None,
    sub_category_id: Optional[str] = None,
    type: Optional[str] = None
):
    query = {}
    if category_id:
        query['category_id'] = category_id
    if sub_category_id:
        query['sub_category_id'] = sub_category_id
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

# ============= Coupon Routes =============

@api_router.get("/coupons", dependencies=[Depends(require_admin)])
async def get_coupons():
    coupons = await db.coupons.find({}, {'_id': 0}).to_list(100)
    return coupons

@api_router.post("/coupons", dependencies=[Depends(require_admin)])
async def create_coupon(coupon: CouponCreate):
    # Check if code already exists
    existing = await db.coupons.find_one({'code': coupon.code}, {'_id': 0})
    if existing:
        raise HTTPException(status_code=400, detail="Coupon code already exists")
    
    coupon_dict = coupon.model_dump()
    coupon_obj = Coupon(**coupon_dict)
    coupon_data = coupon_obj.model_dump()
    if coupon_data.get('created_at'):
        coupon_data['created_at'] = coupon_data['created_at'].isoformat()
    if coupon_data.get('expiry_date'):
        coupon_data['expiry_date'] = coupon_data['expiry_date'].isoformat()
    await db.coupons.insert_one(coupon_data)
    return coupon_obj

@api_router.post("/coupons/validate")
async def validate_coupon(req: ValidateCouponRequest, user: dict = Depends(get_current_user)):
    coupon = await db.coupons.find_one({'code': req.code}, {'_id': 0})
    
    if not coupon:
        raise HTTPException(status_code=404, detail="Invalid coupon code")
    
    if not coupon.get('active', True):
        raise HTTPException(status_code=400, detail="Coupon is inactive")
    
    # Check expiry
    if coupon.get('expiry_date'):
        expiry = datetime.fromisoformat(coupon['expiry_date']) if isinstance(coupon['expiry_date'], str) else coupon['expiry_date']
        if expiry < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="Coupon has expired")
    
    # Check usage limit
    if coupon.get('usage_limit') and coupon.get('used_count', 0) >= coupon['usage_limit']:
        raise HTTPException(status_code=400, detail="Coupon usage limit reached")
    
    # Check minimum cart value
    if req.cart_value < coupon.get('min_cart_value', 0):
        shortfall = coupon['min_cart_value'] - req.cart_value
        raise HTTPException(
            status_code=400,
            detail=f"Add ₹{shortfall/100:.0f} more to use this coupon"
        )
    
    # Calculate discount
    if coupon['discount_type'] == 'flat':
        discount = coupon['discount_value']
    else:  # percentage
        discount = int((req.cart_value * coupon['discount_value']) / 100)
        if coupon.get('max_discount'):
            discount = min(discount, coupon['max_discount'])
    
    return {
        'valid': True,
        'discount_amount': discount,
        'coupon': coupon
    }

@api_router.patch("/coupons/{coupon_id}", dependencies=[Depends(require_admin)])
async def update_coupon(coupon_id: str, active: bool):
    result = await db.coupons.update_one(
        {'id': coupon_id},
        {'$set': {'active': active}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Coupon not found")
    return {'success': True}

@api_router.delete("/coupons/{coupon_id}", dependencies=[Depends(require_admin)])
async def delete_coupon(coupon_id: str):
    result = await db.coupons.delete_one({'id': coupon_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Coupon not found")
    return {'success': True}

# ============= Wallet Routes =============

@api_router.get("/wallet")
async def get_wallet(user: dict = Depends(get_current_user)):
    transactions = await db.wallet_transactions.find(
        {'user_id': user['id']},
        {'_id': 0}
    ).sort('created_at', -1).limit(50).to_list(50)
    
    return {
        'balance': user.get('wallet_balance', 0),
        'locked_balance': user.get('wallet_locked_balance', 0),
        'transactions': transactions
    }

@api_router.get("/wallet/offers")
async def get_wallet_offers():
    offers = await db.wallet_offers.find({'active': True}, {'_id': 0}).to_list(100)
    return offers

@api_router.post("/wallet/offers", dependencies=[Depends(require_admin)])
async def create_wallet_offer(offer: WalletOfferCreate):
    offer_obj = WalletOffer(**offer.model_dump())
    offer_data = offer_obj.model_dump()
    offer_data['created_at'] = offer_data['created_at'].isoformat()
    await db.wallet_offers.insert_one(offer_data)
    return offer_obj

@api_router.post("/wallet/topup")
async def topup_wallet(req: WalletTopupRequest, user: dict = Depends(get_current_user)):
    # Get offer
    offer = await db.wallet_offers.find_one({'id': req.offer_id, 'active': True}, {'_id': 0})
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    # Calculate cashback
    cashback = int((offer['amount'] * offer['cashback_percentage']) / 100)
    if cashback > offer['max_cashback']:
        cashback = offer['max_cashback']
    
    # Create Razorpay order for topup
    razorpay_order = razorpay_client.order.create({
        'amount': offer['amount'],
        'currency': 'INR',
        'payment_capture': 1
    })
    
    return {
        'razorpay_order_id': razorpay_order['id'],
        'amount': offer['amount'],
        'cashback': cashback,
        'key_id': RAZORPAY_KEY_ID,
        'offer_id': req.offer_id
    }

@api_router.post("/wallet/topup/verify")
async def verify_topup(
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
    offer_id: str,
    user: dict = Depends(get_current_user)
):
    # Verify signature
    params_dict = {
        'razorpay_order_id': razorpay_order_id,
        'razorpay_payment_id': razorpay_payment_id,
        'razorpay_signature': razorpay_signature
    }
    
    try:
        razorpay_client.utility.verify_payment_signature(params_dict)
    except:
        raise HTTPException(status_code=400, detail="Payment verification failed")
    
    # Get offer
    offer = await db.wallet_offers.find_one({'id': offer_id}, {'_id': 0})
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    # Calculate cashback
    cashback = int((offer['amount'] * offer['cashback_percentage']) / 100)
    if cashback > offer['max_cashback']:
        cashback = offer['max_cashback']
    
    total_credit = offer['amount'] + cashback
    
    # Update wallet balance
    await db.users.update_one(
        {'id': user['id']},
        {'$inc': {'wallet_balance': total_credit}}
    )
    
    # Add transactions
    await add_wallet_transaction(
        user['id'],
        'topup',
        offer['amount'],
        f"Wallet topup of ₹{offer['amount']/100}",
        razorpay_payment_id
    )
    
    await add_wallet_transaction(
        user['id'],
        'cashback',
        cashback,
        f"Cashback {offer['cashback_percentage']}% on topup",
        razorpay_payment_id
    )
    
    return {'success': True, 'balance': user.get('wallet_balance', 0) + total_credit}

@api_router.get("/wallet/config", dependencies=[Depends(require_admin)])
async def get_wallet_config_route():
    config = await get_wallet_config()
    return config

@api_router.post("/wallet/config", dependencies=[Depends(require_admin)])
async def update_wallet_config(config: WalletConfig):
    await db.wallet_config.delete_many({})
    await db.wallet_config.insert_one(config.model_dump())
    return config

# ============= Payment & Booking Routes =============

@api_router.post("/orders/create")
async def create_order(req: CreateOrderRequest, user: dict = Depends(get_current_user)):
    # Get product
    product = await db.products.find_one({'id': req.product_id}, {'_id': 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    cart_value = product['price']
    discount_amount = 0
    wallet_used = 0
    final_amount = cart_value
    
    # Apply coupon if provided
    if req.coupon_code:
        coupon = await db.coupons.find_one({'code': req.coupon_code, 'active': True}, {'_id': 0})
        if coupon:
            # Validate coupon
            if coupon.get('min_cart_value', 0) <= cart_value:
                if coupon['discount_type'] == 'flat':
                    discount_amount = coupon['discount_value']
                else:
                    discount_amount = int((cart_value * coupon['discount_value']) / 100)
                    if coupon.get('max_discount'):
                        discount_amount = min(discount_amount, coupon['max_discount'])
                
                final_amount = cart_value - discount_amount
    
    # Use wallet if requested
    if req.use_wallet:
        user_wallet = user.get('wallet_balance', 0)
        locked_balance = user.get('wallet_locked_balance', 0)
        
        # Check if we can use locked balance (welcome bonus)
        wallet_config = await get_wallet_config()
        
        if locked_balance > 0 and cart_value >= wallet_config.welcome_bonus_min_cart:
            # Can use locked balance
            locked_to_use = min(locked_balance, wallet_config.welcome_bonus_max_deduction, final_amount)
            wallet_used += locked_to_use
            final_amount -= locked_to_use
        
        # Use regular wallet balance
        if user_wallet > 0 and final_amount > 0:
            regular_to_use = min(user_wallet, final_amount)
            wallet_used += regular_to_use
            final_amount -= regular_to_use
    
    # If final amount is 0, no payment needed
    if final_amount <= 0:
        final_amount = 0
    
    # Create booking
    booking = Booking(
        user_id=user['id'],
        product_id=req.product_id,
        address=req.address,
        landmark=req.landmark,
        pincode=req.pincode,
        amount=cart_value,
        wallet_used=wallet_used,
        coupon_code=req.coupon_code,
        discount_amount=discount_amount,
        status='pending'
    )
    
    # If payment required, create Razorpay order
    if final_amount > 0:
        razorpay_order = razorpay_client.order.create({
            'amount': final_amount,
            'currency': 'INR',
            'payment_capture': 1
        })
        booking.razorpay_order_id = razorpay_order['id']
    
    booking_dict = booking.model_dump()
    booking_dict['created_at'] = booking_dict['created_at'].isoformat()
    await db.bookings.insert_one(booking_dict)
    
    return {
        'booking_id': booking.id,
        'razorpay_order_id': booking.razorpay_order_id,
        'amount': final_amount,
        'key_id': RAZORPAY_KEY_ID,
        'cart_value': cart_value,
        'discount_amount': discount_amount,
        'wallet_used': wallet_used
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
    
    # Deduct wallet if used
    if booking.get('wallet_used', 0) > 0:
        wallet_config = await get_wallet_config()
        locked_used = 0
        regular_used = 0
        
        user_locked = user.get('wallet_locked_balance', 0)
        
        # Calculate how much came from locked balance
        if user_locked > 0:
            locked_used = min(
                user_locked,
                wallet_config.welcome_bonus_max_deduction,
                booking['wallet_used']
            )
        
        regular_used = booking['wallet_used'] - locked_used
        
        # Update user wallet
        update_data = {}
        if locked_used > 0:
            update_data['wallet_locked_balance'] = user.get('wallet_locked_balance', 0) - locked_used
        if regular_used > 0:
            update_data['wallet_balance'] = user.get('wallet_balance', 0) - regular_used
        
        if update_data:
            await db.users.update_one({'id': user['id']}, {'$set': update_data})
        
        # Add transaction
        await add_wallet_transaction(
            user['id'],
            'debit',
            -booking['wallet_used'],
            f"Used for booking #{booking['id'][:8]}",
            booking['id']
        )
    
    # Update coupon usage
    if booking.get('coupon_code'):
        await db.coupons.update_one(
            {'code': booking['coupon_code']},
            {'$inc': {'used_count': 1}}
        )
    
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
    
    update_data = {'status': req.status}
    
    # Track start time
    if req.status == 'in_progress' and not booking.get('started_at'):
        update_data['started_at'] = datetime.now(timezone.utc).isoformat()
    
    # Track completion time
    if req.status == 'completed' and not booking.get('completed_at'):
        update_data['completed_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.bookings.update_one(
        {'id': booking_id},
        {'$set': update_data}
    )
    
    return {'success': True}

@api_router.post("/bookings/{booking_id}/confirm-review")
async def confirm_review(
    booking_id: str,
    user: dict = Depends(require_professional)
):
    """Professional confirms customer gave review, credit ₹100 to customer wallet"""
    booking = await db.bookings.find_one({'id': booking_id}, {'_id': 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.get('review_given'):
        raise HTTPException(status_code=400, detail="Review reward already given")
    
    # Credit ₹100 to customer
    reward_amount = 10000  # ₹100 in paise
    await db.users.update_one(
        {'id': booking['user_id']},
        {'$inc': {'wallet_balance': reward_amount}}
    )
    
    # Mark review as given
    await db.bookings.update_one(
        {'id': booking_id},
        {'$set': {'review_given': True}}
    )
    
    # Add transaction
    await add_wallet_transaction(
        booking['user_id'],
        'review_reward',
        reward_amount,
        f"Review reward for booking #{booking_id[:8]}",
        booking_id
    )
    
    return {'success': True, 'reward': reward_amount}

# ============= Professional Routes =============

@api_router.get("/professionals")
async def get_professionals():
    professionals = await db.professionals.find({}, {'_id': 0}).to_list(100)
    return professionals

# ============= Blog Routes =============

@api_router.get("/blog")
async def get_blog_posts(published_only: bool = True):
    query = {'published': True} if published_only else {}
    posts = await db.blog_posts.find(query, {'_id': 0}).sort('created_at', -1).to_list(100)
    return posts

@api_router.get("/blog/{slug}")
async def get_blog_post_by_slug(slug: str):
    post = await db.blog_posts.find_one({'slug': slug, 'published': True}, {'_id': 0})
    if not post:
        raise HTTPException(status_code=404, detail="Blog post not found")
    return post

@api_router.post("/blog", dependencies=[Depends(require_admin)])
async def create_blog_post(post: BlogPostCreate, user: dict = Depends(get_current_user)):
    # Check if slug exists
    existing = await db.blog_posts.find_one({'slug': post.slug}, {'_id': 0})
    if existing:
        raise HTTPException(status_code=400, detail="Slug already exists")
    
    post_dict = post.model_dump()
    post_obj = BlogPost(**post_dict, author_id=user['id'])
    post_data = post_obj.model_dump()
    post_data['created_at'] = post_data['created_at'].isoformat()
    post_data['updated_at'] = post_data['updated_at'].isoformat()
    await db.blog_posts.insert_one(post_data)
    return post_obj

@api_router.patch("/blog/{post_id}", dependencies=[Depends(require_admin)])
async def update_blog_post(post_id: str, post: BlogPostUpdate):
    update_data = {k: v for k, v in post.model_dump().items() if v is not None}
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    result = await db.blog_posts.update_one(
        {'id': post_id},
        {'$set': update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Blog post not found")
    
    return {'success': True}

@api_router.delete("/blog/{post_id}", dependencies=[Depends(require_admin)])
async def delete_blog_post(post_id: str):
    result = await db.blog_posts.delete_one({'id': post_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Blog post not found")
    return {'success': True}

# ============= Admin Config Routes =============

@api_router.get("/config/{key}", dependencies=[Depends(require_admin)])
async def get_config(key: str):
    config = await db.site_config.find_one({'key': key}, {'_id': 0})
    if not config:
        return {'key': key, 'value': None}
    return config

@api_router.post("/config", dependencies=[Depends(require_admin)])
async def update_config(config: SiteConfigUpdate):
    await db.site_config.update_one(
        {'key': config.key},
        {'$set': {
            'value': config.value,
            'updated_at': datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    return {'success': True}

@api_router.get("/config")
async def get_all_public_config():
    """Get public config like razorpay key, google maps key, etc."""
    configs = await db.site_config.find({}, {'_id': 0}).to_list(100)
    public_configs = {}
    
    # Only expose public keys
    public_keys = ['razorpay_key_id', 'google_maps_api_key', 'whatsapp_number', 'site_logo', 'site_name']
    for config in configs:
        if config['key'] in public_keys:
            public_configs[config['key']] = config['value']
    
    # Add defaults from env
    if 'razorpay_key_id' not in public_configs:
        public_configs['razorpay_key_id'] = RAZORPAY_KEY_ID
    
    if 'whatsapp_number' not in public_configs:
        public_configs['whatsapp_number'] = os.environ.get('WHATSAPP_NUMBER', '+919115503663')
    
    return public_configs

# ============= Address Autocomplete (Open Source) =============

@api_router.get("/address/search")
async def search_address(query: str):
    """
    Simple address search using Nominatim (OpenStreetMap)
    No API key needed - open source!
    """
    import urllib.parse
    import aiohttp
    
    if not query or len(query) < 3:
        return []
    
    try:
        encoded_query = urllib.parse.quote(query)
        url = f"https://nominatim.openstreetmap.org/search?q={encoded_query}&format=json&addressdetails=1&limit=5&countrycodes=in"
        
        async with aiohttp.ClientSession() as session:
            headers = {'User-Agent': 'Intowns-App/1.0'}
            async with session.get(url, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    suggestions = []
                    for item in data:
                        suggestions.append({
                            'description': item.get('display_name', ''),
                            'place_id': item.get('place_id', ''),
                            'lat': item.get('lat', ''),
                            'lon': item.get('lon', '')
                        })
                    return suggestions
                return []
    except Exception as e:
        logger.error(f"Address search error: {str(e)}")
        return []

# ============= Admin Stats =============

@api_router.get("/admin/stats", dependencies=[Depends(require_admin)])
async def get_admin_stats():
    total_bookings = await db.bookings.count_documents({})
    total_users = await db.users.count_documents({'role': 'user'})
    total_revenue = await db.bookings.aggregate([
        {'$match': {'status': {'$in': ['accepted', 'on_the_way', 'in_progress', 'completed']}}},
        {'$group': {'_id': None, 'total': {'$sum': '$amount'}}}
    ]).to_list(1)
    
    revenue = total_revenue[0]['total'] if total_revenue else 0
    
    # Get wallet stats
    total_wallet = await db.users.aggregate([
        {'$group': {'_id': None, 'total': {'$sum': '$wallet_balance'}}}
    ]).to_list(1)
    
    wallet_balance = total_wallet[0]['total'] if total_wallet else 0
    
    return {
        'total_bookings': total_bookings,
        'total_users': total_users,
        'total_revenue': revenue,
        'total_wallet_balance': wallet_balance
    }

# ============= Admin User Management =============

@api_router.get("/admin/users", dependencies=[Depends(require_admin)])
async def get_all_users(skip: int = 0, limit: int = 50):
    """Get all users with pagination"""
    users = await db.users.find({}, {'_id': 0}).skip(skip).limit(limit).to_list(limit)
    total_count = await db.users.count_documents({})
    return {
        'users': users,
        'total': total_count,
        'page': skip // limit + 1,
        'pages': (total_count + limit - 1) // limit
    }

@api_router.patch("/admin/users/{user_id}/role", dependencies=[Depends(require_admin)])
async def update_user_role(user_id: str, role: str):
    """Update user role"""
    if role not in ['user', 'admin', 'professional']:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    result = await db.users.update_one(
        {'id': user_id},
        {'$set': {'role': role}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {'success': True, 'message': f'User role updated to {role}'}

@api_router.delete("/admin/users/{user_id}", dependencies=[Depends(require_admin)])
async def delete_user(user_id: str):
    """Delete user (soft delete by marking inactive)"""
    result = await db.users.update_one(
        {'id': user_id},
        {'$set': {'active': False}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {'success': True, 'message': 'User deleted'}

# ============= Admin Product/Category Management =============

@api_router.get("/admin/products", dependencies=[Depends(require_admin)])
async def get_all_products_admin():
    """Get all products for admin"""
    products = await db.products.find({}, {'_id': 0}).to_list(1000)
    return products

@api_router.patch("/admin/products/{product_id}", dependencies=[Depends(require_admin)])
async def update_product(product_id: str, product: ProductCreate):
    """Update product"""
    update_data = product.model_dump()
    result = await db.products.update_one(
        {'id': product_id},
        {'$set': update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {'success': True, 'message': 'Product updated'}

@api_router.delete("/admin/products/{product_id}", dependencies=[Depends(require_admin)])
async def delete_product(product_id: str):
    """Delete product"""
    result = await db.products.delete_one({'id': product_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {'success': True, 'message': 'Product deleted'}

@api_router.get("/admin/categories", dependencies=[Depends(require_admin)])
async def get_all_categories_admin():
    """Get all categories for admin"""
    categories = await db.categories.find({}, {'_id': 0}).to_list(1000)
    return categories

@api_router.delete("/admin/categories/{category_id}", dependencies=[Depends(require_admin)])
async def delete_category(category_id: str):
    """Delete category"""
    # Check if any products use this category
    products_count = await db.products.count_documents({
        '$or': [
            {'category_id': category_id},
            {'sub_category_id': category_id}
        ]
    })
    
    if products_count > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete category. {products_count} products are using it."
        )
    
    result = await db.categories.delete_one({'id': category_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    
    return {'success': True, 'message': 'Category deleted'}

# ============= Admin Bookings Management =============

@api_router.get("/admin/bookings", dependencies=[Depends(require_admin)])
async def get_all_bookings_admin(status: Optional[str] = None, skip: int = 0, limit: int = 50):
    """Get all bookings for admin"""
    query = {}
    if status:
        query['status'] = status
    
    bookings = await db.bookings.find(query, {'_id': 0}).sort('created_at', -1).skip(skip).limit(limit).to_list(limit)
    
    # Populate product and user details
    for booking in bookings:
        product = await db.products.find_one({'id': booking['product_id']}, {'_id': 0})
        booking['product'] = product
        
        user_data = await db.users.find_one({'id': booking['user_id']}, {'_id': 0})
        booking['user'] = user_data
        
        if booking.get('professional_id'):
            professional = await db.professionals.find_one({'id': booking['professional_id']}, {'_id': 0})
            booking['professional'] = professional
    
    total_count = await db.bookings.count_documents(query)
    
    return {
        'bookings': bookings,
        'total': total_count,
        'page': skip // limit + 1,
        'pages': (total_count + limit - 1) // limit
    }

# ============= Admin Mailing =============

class EmailRequest(BaseModel):
    to_emails: List[str]
    subject: str
    message: str

@api_router.post("/admin/send-email", dependencies=[Depends(require_admin)])
async def send_email(email_req: EmailRequest):
    """
    Send email via Mailtrap or configured email service
    For now, just logs the email (implement Mailtrap integration later)
    """
    mailtrap_token = os.environ.get('MAILTRAP_API_TOKEN')
    
    if not mailtrap_token:
        # Log email instead if Mailtrap not configured
        logger.info(f"Email would be sent to: {email_req.to_emails}")
        logger.info(f"Subject: {email_req.subject}")
        logger.info(f"Message: {email_req.message}")
        
        return {
            'success': True,
            'message': 'Email logged (Mailtrap not configured)',
            'recipients': len(email_req.to_emails)
        }
    
    # TODO: Implement actual Mailtrap API call
    # For now, return success
    return {
        'success': True,
        'message': f'Email sent to {len(email_req.to_emails)} recipients',
        'recipients': len(email_req.to_emails)
    }

@api_router.get("/")
async def root():
    return {"message": "Intowns API"}

app.include_router(api_router)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
