# Intowns.in - Home Spa & Massage Booking Platform

## Overview
Full-stack PWA web application for booking home spa and massage services in India.

## Tech Stack
- **Backend**: FastAPI (Python) + MongoDB
- **Frontend**: React 19 + Shadcn UI + Tailwind CSS
- **Payment**: Razorpay
- **Authentication**: Google OAuth
- **Database**: MongoDB

## Database Structure

### Collections

#### users
- `id` (UUID): User unique identifier
- `email` (string): User email from Google OAuth
- `name` (string): User full name
- `picture` (string): Profile picture URL
- `role` (string): user | admin | professional
- `wallet_balance` (int): Available wallet balance in paise
- `wallet_locked_balance` (int): Locked balance (welcome bonus) in paise
- `created_at` (datetime): Account creation timestamp

#### categories
- `id` (UUID): Category unique identifier
- `name` (string): Category name
- `image` (string): Category image URL
- `description` (string): Category description
- `parent_id` (UUID | null): Parent category ID (null for level 1)
- `level` (int): 1 for main categories, 2 for sub-categories

**Level 1 Categories (Main - 4 tiles):**
1. Massage
2. Spa
3. Packages
4. Therapy

**Level 2 Categories (Sub-categories):**
- Massage: Head Massage, Full Body Massage, Back & Shoulder, Foot Reflexology, Deep Tissue, Relaxation
- Spa: Aromatherapy, Swedish, Thai, Balinese, Hot Stone, Luxury Spa
- Packages: Relaxation Packages, Stress Relief Packages, Couple Packages, Monthly Packages, Premium Packages
- Therapy: Pain Relief, Sports Therapy, Senior Therapy, Recovery Therapy

#### products
- `id` (UUID): Product unique identifier
- `name` (string): Product name
- `description` (string): Product description
- `price` (int): Price in paise (₹1 = 100 paise)
- `duration` (string): Service duration (e.g., "60 min")
- `category_id` (UUID): Main category ID
- `sub_category_id` (UUID): Sub-category ID
- `type` (string): product | package
- `image` (string): Product image URL

#### bookings
- `id` (UUID): Booking unique identifier
- `user_id` (UUID): Customer user ID
- `product_id` (UUID): Booked product ID
- `professional_id` (UUID): Assigned professional ID
- `address` (string): Customer address
- `landmark` (string): Address landmark
- `pincode` (string): Pincode
- `status` (string): pending | accepted | on_the_way | in_progress | completed | cancelled
- `payment_id` (string): Razorpay payment ID
- `razorpay_order_id` (string): Razorpay order ID
- `razorpay_payment_id` (string): Razorpay payment ID after verification
- `amount` (int): Total booking amount in paise
- `wallet_used` (int): Wallet amount used in paise
- `coupon_code` (string): Applied coupon code
- `discount_amount` (int): Discount amount in paise
- `started_at` (datetime): Service start timestamp
- `completed_at` (datetime): Service completion timestamp
- `review_given` (bool): Whether customer gave Google review
- `created_at` (datetime): Booking creation timestamp

#### professionals
- `id` (UUID): Professional unique identifier
- `name` (string): Professional name
- `email` (string): Professional email
- `status` (string): active | inactive
- `user_id` (UUID): Linked user account ID

**Default Professional:** Rajni (auto-created during seed)

#### coupons
- `id` (UUID): Coupon unique identifier
- `code` (string): Coupon code (unique)
- `discount_type` (string): flat | percentage
- `discount_value` (int): Discount value (paise for flat, percentage for percentage)
- `min_cart_value` (int): Minimum cart value required in paise
- `max_discount` (int): Maximum discount cap in paise
- `expiry_date` (datetime): Coupon expiry date
- `usage_limit` (int): Maximum usage count
- `used_count` (int): Current usage count
- `active` (bool): Whether coupon is active
- `created_at` (datetime): Creation timestamp

#### wallet_transactions
- `id` (UUID): Transaction unique identifier
- `user_id` (UUID): User ID
- `type` (string): credit | debit | topup | cashback | welcome_bonus | review_reward
- `amount` (int): Transaction amount in paise
- `balance_after` (int): Wallet balance after transaction in paise
- `description` (string): Transaction description
- `reference_id` (UUID): Related booking or payment ID
- `created_at` (datetime): Transaction timestamp

#### wallet_offers
- `id` (UUID): Offer unique identifier
- `amount` (int): Topup amount in paise
- `cashback_percentage` (int): Cashback percentage
- `max_cashback` (int): Maximum cashback amount in paise
- `active` (bool): Whether offer is active
- `created_at` (datetime): Creation timestamp

**Default Offers:**
- ₹500 → 20% cashback
- ₹700 → 30% cashback
- ₹1000 → 40% cashback
- ₹10,000 → 100% cashback (max ₹3000)

#### wallet_config
- `welcome_bonus_enabled` (bool): Whether welcome bonus is enabled
- `welcome_bonus_amount` (int): Welcome bonus amount in paise (default ₹100)
- `welcome_bonus_min_cart` (int): Minimum cart value to use bonus in paise (default ₹200)
- `welcome_bonus_max_deduction` (int): Maximum deductible bonus in paise (default ₹200)

#### blog_posts
- `id` (UUID): Post unique identifier
- `title` (string): Post title
- `slug` (string): URL slug (unique)
- `content` (string): Post content (HTML/Markdown)
- `excerpt` (string): Short excerpt
- `featured_image` (string): Featured image URL
- `meta_title` (string): SEO meta title
- `meta_description` (string): SEO meta description
- `published` (bool): Whether post is published
- `author_id` (UUID): Author user ID
- `created_at` (datetime): Creation timestamp
- `updated_at` (datetime): Last update timestamp

#### site_config
- `key` (string): Config key (unique)
- `value` (any): Config value (JSON)
- `updated_at` (datetime): Last update timestamp

**Config Keys:**
- `razorpay_key_id`: Razorpay public key
- `razorpay_key_secret`: Razorpay secret key
- `google_client_id`: Google OAuth client ID
- `google_client_secret`: Google OAuth client secret
- `google_maps_api_key`: Google Maps API key
- `mailtrap_api_token`: Mailtrap API token
- `mailtrap_sender_email`: Mailtrap sender email
- `whatsapp_number`: WhatsApp support number
- `site_logo`: Site logo URL
- `site_name`: Site name
- `social_media_links`: Social media links (JSON)

## API Endpoints

### Authentication
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - OAuth callback
- `GET /api/auth/me` - Get current user

### Categories
- `GET /api/categories?level=1` - Get main categories (4 tiles)
- `GET /api/categories?parent_id={id}` - Get sub-categories
- `POST /api/categories` - Create category (admin only)

### Products
- `GET /api/products?sub_category_id={id}` - Get products by sub-category
- `GET /api/products/{id}` - Get single product
- `POST /api/products` - Create product (admin only)

### Booking & Payment
- `POST /api/orders/create` - Create order and Razorpay order
- `POST /api/orders/verify` - Verify Razorpay payment
- `GET /api/bookings` - Get user bookings
- `GET /api/bookings/{id}` - Get booking details
- `PATCH /api/bookings/{id}/status` - Update booking status (professional)
- `POST /api/bookings/{id}/confirm-review` - Confirm review and credit ₹100 (professional)

### Coupons
- `GET /api/coupons` - Get all coupons (admin)
- `POST /api/coupons` - Create coupon (admin)
- `POST /api/coupons/validate` - Validate coupon code
- `PATCH /api/coupons/{id}` - Update coupon (admin)
- `DELETE /api/coupons/{id}` - Delete coupon (admin)

### Wallet
- `GET /api/wallet` - Get wallet balance and transactions
- `GET /api/wallet/offers` - Get wallet topup offers
- `POST /api/wallet/offers` - Create offer (admin)
- `POST /api/wallet/topup` - Initiate wallet topup
- `POST /api/wallet/topup/verify` - Verify topup payment
- `GET /api/wallet/config` - Get wallet config (admin)
- `POST /api/wallet/config` - Update wallet config (admin)

### Blog
- `GET /api/blog` - Get all published blog posts
- `GET /api/blog/{slug}` - Get single blog post by slug
- `POST /api/blog` - Create blog post (admin)
- `PATCH /api/blog/{id}` - Update blog post (admin)
- `DELETE /api/blog/{id}` - Delete blog post (admin)

### Admin
- `GET /api/admin/stats` - Get dashboard stats
- `GET /api/config/{key}` - Get config value (admin)
- `POST /api/config` - Update config value (admin)
- `GET /api/config` - Get public config

### Professionals
- `GET /api/professionals` - Get all professionals

## UI Flow (Strict)

### Step 1: Home Page (4 Main Tiles)
- Display exactly 4 equal tiles
- Tiles: Massage | Spa | Packages | Therapy
- Icon-based and clickable

### Step 2: Sub-Category Page (Tiles)
- After clicking main tile, show sub-categories in tile format
- Each sub-category is a tile
- Clicking tile goes to Step 3

### Step 3: Product List Page (List Format)
- Show products in list view
- Each item: thumbnail, name, duration, price
- Top filters: All | Products | Packages

### Booking Flow
1. User selects product
2. Login via Google OAuth (if not logged in)
3. Enter address (address, landmark, pincode)
4. Apply coupon (optional)
5. Use wallet (optional)
6. Pay via Razorpay
7. Auto-proceed on successful payment
8. Show booking confirmation

## Module Features

### Module 1: Wallet & Credits
- Wallet balance (usable anytime)
- Locked balance (welcome bonus ₹100)
- Welcome bonus conditions:
  - Credited on first signup
  - Usable only if cart ≥ ₹200
  - Max deduction ₹200
  - Alert if cart < ₹200
- Admin controls for bonus settings
- Confirmation modal before using bonus

### Module 2: Coupon System
- Admin creates coupons (flat/percentage)
- Minimum cart value validation
- Max discount cap
- Expiry date and usage limits
- Frontend coupon input field
- Alert if cart doesn't meet minimum

### Module 3: Wallet Top-up & Cashback
- Preset recharge amounts with cashback
- Custom amount option
- Cashback credited after payment
- Admin can create/edit offers

### Module 4: Mailing System (Mailtrap)
- Admin adds Mailtrap credentials
- Bulk and individual emails
- Track sent/failed analytics
- System emails:
  - Welcome email
  - Wallet topup confirmation
  - Order success (user)
  - New order (employee + admin)
- Admin emails: admin@intowns.in (To), admin@usafe.in (CC)

### Module 5: Employee Panel
- View upcoming/completed orders
- Order details: customer, services, duration, total, address
- "Open in Google Maps" button
- Start order → start timer
- Mark completed
- Show QR code for Google Review
- Confirm review → credit ₹100 to customer wallet

### Module 6: Admin Config Menus
- Payment Gateway (Razorpay key/secret)
- OAuth (Client ID/Secret, Redirect URIs)
- Google Maps API key
- Site Settings (logo, SEO meta, analytics, social links)

### Module 7: Blog (SEO Only)
- Admin: WordPress-like editor
- SEO-friendly fields
- Frontend: Desktop menu only
- Mobile: No menu, direct links work

### Module 8: UX / Misc
- Cookie/cache consent banner
- Push notification permission flow
- Light animations
- WhatsApp support:
  - Logged-in users: Floating button (+9115503663)
  - Non-logged: Show after 2 minutes with "Need help?" prompt

## PWA Configuration

### Mobile
- Show install prompt
- Behaves like native app when installed
- Full PWA functionality

### Desktop
- Responsive website layout
- NOT a stretched mobile app
- Separate UI optimized for desktop

## Environment Variables

### Backend (.env)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=intowns_db
CORS_ORIGINS=*
JWT_SECRET=secret-key
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
FRONTEND_URL=http://localhost:3000
RAZORPAY_KEY_ID=rzp_test_key
RAZORPAY_KEY_SECRET=secret
MAILTRAP_API_TOKEN=token
MAILTRAP_SENDER_EMAIL=admin@intowns.in
GOOGLE_MAPS_API_KEY=key
WHATSAPP_NUMBER=+919115503663
```

### Frontend (.env)
```
REACT_APP_BACKEND_URL=backend-url
```

## Setup Instructions

### 1. Install Dependencies
```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd frontend
yarn install
```

### 2. Seed Database
```bash
cd backend
python seed_data.py
```

### 3. Run Services
```bash
# Using supervisor (production)
sudo supervisorctl restart all

# Manual (development)
# Backend: uvicorn server:app --reload --host 0.0.0.0 --port 8001
# Frontend: yarn start
```

## Default Credentials

### Admin Access
- Create admin user manually in MongoDB:
  ```javascript
  db.users.updateOne(
    {email: "your@email.com"},
    {$set: {role: "admin"}}
  )
  ```

### Default Professional
- Name: Rajni
- Status: Active
- Auto-assigned to all bookings

## Notes

- All amounts stored in **paise** (₹1 = 100 paise)
- Use UUID for all IDs (no MongoDB ObjectID)
- All backend routes prefixed with `/api`
- Frontend uses `process.env.REACT_APP_BACKEND_URL`
- Hot reload enabled for both frontend and backend
- Only restart servers when installing new dependencies

## Future Enhancements

- Multiple professional assignment algorithm
- Professional availability calendar
- Customer review system
- Rating and feedback
- Notification system (email + push)
- Advanced analytics dashboard
- Mobile app (React Native)
