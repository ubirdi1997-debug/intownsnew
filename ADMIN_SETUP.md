# Admin Panel Setup Guide

## How to Access Admin Panel

### Step 1: First Login with Google

1. Go to the homepage: `http://localhost:3000` (or your domain)
2. Click "Login with Google" button
3. Complete the Google OAuth flow
4. You'll be logged in as a regular user

### Step 2: Convert Your User to Admin

**Method 1: Using MongoDB Shell**

```bash
# Connect to MongoDB
mongosh mongodb://localhost:27017/intowns_db

# Replace YOUR_EMAIL with your actual Google email
db.users.updateOne(
  { email: "YOUR_EMAIL@gmail.com" },
  { $set: { role: "admin" } }
)

# Verify the update
db.users.findOne({ email: "YOUR_EMAIL@gmail.com" })
```

**Method 2: Using MongoDB Compass (GUI)**

1. Open MongoDB Compass
2. Connect to `mongodb://localhost:27017`
3. Select database: `intowns_db`
4. Select collection: `users`
5. Find your user by email
6. Click Edit Document
7. Change `role` from `"user"` to `"admin"`
8. Save

### Step 3: Access Admin Panel

1. Refresh your browser (or logout and login again)
2. You'll now see an "Admin" button in the header
3. Click "Admin" to access `/admin` dashboard

---

## Admin Panel Features

### Dashboard Overview
- Total Users
- Total Bookings
- Total Revenue
- Wallet Balance

### 1. Coupons Tab
**Create Coupons:**
- Coupon Code (e.g., SAVE100)
- Discount Type: Flat (₹) or Percentage (%)
- Discount Value
- Minimum Cart Value
- Max Discount Cap
- Expiry Date
- Usage Limit

**Manage Coupons:**
- Toggle Active/Inactive
- View usage stats
- Delete coupons

### 2. Wallet Tab
**Wallet Configuration:**
- Enable/Disable Welcome Bonus
- Set Welcome Bonus Amount (default: ₹100)
- Set Minimum Cart Value (default: ₹200)
- Set Maximum Deduction (default: ₹200)

**Wallet Offers:**
- Create topup offers with cashback
- Set topup amount, cashback %, max cashback
- View all active offers

**Default Offers:**
- ₹500 → 20% cashback
- ₹700 → 30% cashback
- ₹1000 → 40% cashback
- ₹10,000 → 100% cashback (max ₹3000)

### 3. Blog Tab
**Create Blog Posts:**
- Title & Slug
- Content (HTML/Markdown)
- Excerpt
- Featured Image URL
- SEO Meta Title & Description
- Publish/Draft status

**Manage Posts:**
- View all posts
- Edit/Delete posts
- Toggle published status

### 4. Config Tab
**Razorpay Settings:**
- Razorpay Key ID
- Razorpay Key Secret

**Google Maps:**
- Google Maps API Key

**Mailtrap (Email Service):**
- Mailtrap API Token
- Sender Email

**Site Settings:**
- Site Logo URL
- WhatsApp Support Number (default: +919115503663)

### 5. Mailing Tab
- Configure Mailtrap credentials
- System emails are sent automatically:
  - Welcome email (on signup)
  - Order success (to user)
  - New order (to admin & professional)
  - Wallet topup confirmation

---

## Creating Additional Admins

To create more admin users:

```javascript
// In MongoDB shell
db.users.updateOne(
  { email: "another_admin@gmail.com" },
  { $set: { role: "admin" } }
)
```

---

## Creating Professional Users

To give a user professional access:

```javascript
// In MongoDB shell
db.users.updateOne(
  { email: "professional@gmail.com" },
  { $set: { role: "professional" } }
)

// Then link to professional profile
db.professionals.findOne({ name: "Rajni" }) // Get the professional ID
db.professionals.updateOne(
  { name: "Rajni" },
  { $set: { user_id: "USER_ID_HERE", email: "professional@gmail.com" } }
)
```

---

## Testing Admin Features

### Test Coupon Creation
1. Go to Admin → Coupons tab
2. Click "Create Coupon"
3. Enter code: `TEST100`
4. Discount Type: Flat
5. Discount Value: 100 (₹100)
6. Min Cart: 200 (₹200)
7. Click "Create Coupon"
8. Try using it on a booking

### Test Wallet Configuration
1. Go to Admin → Wallet tab
2. Modify welcome bonus settings
3. Save configuration
4. Create a new user and check if bonus is applied

### Test Blog Post
1. Go to Admin → Blog tab
2. Click "Create Post"
3. Enter title, content, etc.
4. Publish immediately
5. Visit `/blog` to see the post

### Test Config Updates
1. Go to Admin → Config tab
2. Update any setting (e.g., WhatsApp number)
3. Refresh frontend to see changes

---

## Common Issues

**Issue: "Admin access required" error**
- Solution: Verify your user role is set to "admin" in MongoDB
- Refresh browser or re-login after changing role

**Issue: Can't see Admin button in header**
- Solution: Logout and login again after role change
- Clear browser cache

**Issue: Coupon not applying**
- Solution: Check coupon is active and cart meets minimum value
- Verify expiry date hasn't passed

**Issue: Wallet topup failing**
- Solution: Check Razorpay credentials in Config tab
- Use test mode keys for testing

---

## Security Notes

⚠️ **Important:**
- Never share admin credentials
- Use strong passwords for database access
- Keep Razorpay keys secure
- Regularly backup database
- Monitor admin activity logs

---

## Next Steps

After setting up admin access:

1. ✅ Configure Razorpay with your actual keys
2. ✅ Set up Mailtrap for email notifications
3. ✅ Create coupons for marketing campaigns
4. ✅ Configure wallet offers
5. ✅ Add blog content for SEO
6. ✅ Update site settings (logo, social links)
7. ✅ Create additional admin/professional users

---

## Support

For issues or questions:
- Email: admin@intowns.in
- WhatsApp: +91 91155 03663
