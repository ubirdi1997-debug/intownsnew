# Google OAuth Setup for intowns.in

## For Production Domain: intowns.in

### **Step 1: Google Cloud Console Setup**

1. Go to: https://console.cloud.google.com/
2. Select your project (or create new one)
3. Go to **APIs & Services** → **Credentials**
4. Click **+ CREATE CREDENTIALS** → **OAuth 2.0 Client ID**

### **Step 2: Configure OAuth Client**

**Application Type:** Web application

**Name:** Intowns Production

**Authorized JavaScript origins:**
```
https://intowns.in
https://www.intowns.in
```

**Authorized redirect URIs:**
```
https://intowns.in/api/auth/google/callback
https://www.intowns.in/api/auth/google/callback
```

### **Step 3: Update Environment Variables**

After creating OAuth client, update your backend `.env`:

```env
GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-actual-client-secret
FRONTEND_URL=https://intowns.in
```

### **Step 4: Frontend Environment**

Update frontend `.env`:

```env
REACT_APP_BACKEND_URL=https://intowns.in
```

---

## Important Notes

### **Why These Redirect URIs?**

Your backend FastAPI handles OAuth callback at:
```
/api/auth/google/callback
```

So the full redirect URI is:
```
https://intowns.in/api/auth/google/callback
```

### **Backend Route Configuration**

In `server.py`, the OAuth callback route is:
```python
@api_router.get("/auth/google/callback")
async def google_callback(request: Request):
    # Handles Google OAuth redirect
    # Returns JWT token
    # Redirects to frontend with token
```

### **How OAuth Flow Works**

1. User clicks "Login with Google" on frontend
2. Frontend calls: `https://intowns.in/api/auth/google`
3. Backend redirects to Google login page
4. User logs in with Google
5. **Google redirects back to:** `https://intowns.in/api/auth/google/callback`
6. Backend verifies and creates JWT token
7. Backend redirects to: `https://intowns.in?token={jwt_token}`
8. Frontend saves token and refreshes

---

## For Development/Testing

### **Local Development (localhost:3000)**

**Authorized JavaScript origins:**
```
http://localhost:3000
```

**Authorized redirect URIs:**
```
http://localhost:3000/api/auth/google/callback
```

**Environment Variables:**
```env
# Backend .env
FRONTEND_URL=http://localhost:3000

# Frontend .env
REACT_APP_BACKEND_URL=http://localhost:3000
```

---

## Troubleshooting OAuth Errors

### **Error: "redirect_uri_mismatch"**

**Solution:**
1. Go to Google Cloud Console
2. Check **Authorized redirect URIs** exactly match:
   - `https://intowns.in/api/auth/google/callback`
3. Make sure no trailing slashes
4. Wait 5 minutes for changes to propagate

### **Error: "origin_mismatch"**

**Solution:**
1. Check **Authorized JavaScript origins** include:
   - `https://intowns.in`
   - `https://www.intowns.in`
2. No trailing slashes
3. Must be HTTPS for production

---

## Current OAuth Credentials

You provided these credentials:
```
Client ID: 860163349495-dft8tg560fa5jmvs3kr255cn0g1gso70.apps.googleusercontent.com
Client Secret: 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
```

### **To Update for intowns.in:**

1. Go to: https://console.cloud.google.com/apis/credentials
2. Find OAuth client ID: `860163349495...`
3. Click **Edit**
4. Add new Authorized redirect URIs:
   ```
   https://intowns.in/api/auth/google/callback
   https://www.intowns.in/api/auth/google/callback
   ```
5. Add Authorized JavaScript origins:
   ```
   https://intowns.in
   https://www.intowns.in
   ```
6. Click **Save**
7. Wait 5 minutes for changes to apply

---

## Admin/Staff Login (No OAuth Needed)

Remember, admin and staff use username/password:
- **Admin Login URL:** `https://intowns.in/admin-login`
- **Credentials:** `admin` / `pass` or `rajni` / `pass`
- **No OAuth configuration needed for admin access**

Only regular customers use Google OAuth for booking services.

---

## Production Deployment Checklist

- [ ] Update Google OAuth redirect URIs to `https://intowns.in/api/auth/google/callback`
- [ ] Update backend `FRONTEND_URL=https://intowns.in`
- [ ] Update frontend `REACT_APP_BACKEND_URL=https://intowns.in`
- [ ] Test OAuth flow on production
- [ ] Verify admin login works (no OAuth)
- [ ] Update Razorpay keys to live mode
- [ ] Configure Mailtrap for production emails
- [ ] Set up SSL certificate for HTTPS

---

## Summary

**For intowns.in domain:**
- **Redirect URI:** `https://intowns.in/api/auth/google/callback`
- **JavaScript Origin:** `https://intowns.in`
- **Frontend URL:** `https://intowns.in`
- **Backend API:** `https://intowns.in/api`

**Update these 3 places:**
1. Google Cloud Console (OAuth settings)
2. Backend `.env` file (FRONTEND_URL)
3. Frontend `.env` file (REACT_APP_BACKEND_URL)

Then OAuth will work perfectly on your production domain! 🚀
