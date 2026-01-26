# Complete Environment Configuration Guide

This guide covers all `.env` files needed for Intowns application.

---

## 📁 Files Overview

| File | Location | Purpose | Status |
|------|----------|---------|--------|
| `.env` (Backend) | `/var/www/intowns/backend/.env` | API server config | **CRITICAL** |
| `.env` (Frontend) | `/var/www/intowns/frontend/.env` | React app config | **CRITICAL** |
| `.env.local` (Frontend) | `/var/www/intowns/frontend/.env.local` | Local overrides | Optional |

---

## 1️⃣ BACKEND .env CONFIGURATION

**Location:** `/var/www/intowns/backend/.env`

**How to create:**
```bash
cd /var/www/intowns/backend
nano .env
```

**Complete template:**

```env
# ============================================
# INTOWNS BACKEND - PRODUCTION CONFIGURATION
# ============================================

# SERVER CONFIGURATION
HOST=0.0.0.0
PORT=8000
DEBUG=false
ENVIRONMENT=production

# MONGODB CONFIGURATION
MONGO_URL=mongodb://intowns_admin:your_secure_password@127.0.0.1:27017/intowns_db?authSource=admin&retryWrites=true&w=majority

# CORS CONFIGURATION (Very Important!)
CORS_ORIGINS=https://intowns.in,https://www.intowns.in,http://localhost:3000

# JWT CONFIGURATION
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# GOOGLE OAUTH CONFIGURATION
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# RAZORPAY PAYMENT CONFIGURATION
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret_key
RAZORPAY_ENABLED=true

# PAYMENT FALLBACK (COD - Cash on Delivery)
COD_ENABLED=true

# WOMEN-ONLY SERVICE
WOMEN_ONLY_ENABLED=true

# WHATSAPP CONFIGURATION
WHATSAPP_NUMBER=919876543210
WHATSAPP_MESSAGE=Hello! I'm interested in booking a service from Intowns.

# EMAIL CONFIGURATION (Optional)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@intowns.in

# LOGGING
LOG_LEVEL=INFO

# SECURITY
ALLOWED_HOSTS=api.intowns.in,intowns.in,www.intowns.in
MAX_UPLOAD_SIZE=10485760  # 10MB in bytes

# CACHE CONFIGURATION (Optional)
CACHE_TTL=3600

# API RATE LIMITING (Optional)
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60
```

**Required vs Optional:**

| Variable | Required | Example |
|----------|----------|---------|
| `MONGO_URL` | ✅ YES | `mongodb://user:pass@localhost:27017/db` |
| `JWT_SECRET` | ✅ YES | Any random 32+ character string |
| `GOOGLE_CLIENT_ID` | ✅ YES | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | ✅ YES | From Google Cloud Console |
| `RAZORPAY_KEY_ID` | ✅ YES | From Razorpay dashboard |
| `RAZORPAY_KEY_SECRET` | ✅ YES | From Razorpay dashboard |
| `CORS_ORIGINS` | ✅ YES | `https://intowns.in,http://localhost:3000` |
| `SMTP_*` | ❌ NO | Optional for email |
| `WHATSAPP_NUMBER` | ⚠️ SEMI | Recommended for support |

**How to get values:**

### MONGO_URL
```bash
# After MongoDB setup:
# Default: mongodb://intowns_admin:PASSWORD@127.0.0.1:27017/intowns_db?authSource=admin

# Replace PASSWORD with your actual password
```

### JWT_SECRET
```bash
# Generate random secret:
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Output: kNj7mP9lQ2vX4yZ8wA1bC3dE5fG7hI9j
```

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Copy Client ID and Secret
4. Add authorized redirect URI: `https://api.intowns.in/api/auth/google/callback`

### Razorpay Keys
1. Login to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Go to Settings → API Keys
3. Copy Key ID and Key Secret

**Verify configuration:**
```bash
# Check if all required values are set
grep -E "MONGO_URL|JWT_SECRET|GOOGLE_CLIENT|RAZORPAY" /var/www/intowns/backend/.env

# Should show all 5 lines with values (not empty)
```

---

## 2️⃣ FRONTEND .env CONFIGURATION

**Location:** `/var/www/intowns/frontend/.env`

**How to create:**
```bash
cd /var/www/intowns/frontend
nano .env
```

**Complete template:**

```env
# ============================================
# INTOWNS FRONTEND - PRODUCTION CONFIGURATION
# ============================================

# BACKEND API CONFIGURATION (MOST IMPORTANT!)
REACT_APP_BACKEND_URL=https://api.intowns.in

# GOOGLE OAUTH (Same as backend)
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# RAZORPAY CONFIGURATION
REACT_APP_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx

# WHATSAPP CONFIGURATION
REACT_APP_WHATSAPP_NUMBER=919876543210

# APP CONFIGURATION
REACT_APP_APP_NAME=Intowns
REACT_APP_ENVIRONMENT=production

# FEATURE FLAGS
REACT_APP_ENABLE_PWA=true
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_RAZORPAY=true
REACT_APP_ENABLE_COD=true
REACT_APP_ENABLE_WOMEN_ONLY=true

# LOGGING
REACT_APP_LOG_LEVEL=warn
```

**Critical Variables:**

| Variable | Value | Impact |
|----------|-------|--------|
| `REACT_APP_BACKEND_URL` | `https://api.intowns.in` | **Backend connectivity - REQUIRED** |
| `REACT_APP_RAZORPAY_KEY_ID` | Your key | Payment display |
| `REACT_APP_GOOGLE_CLIENT_ID` | Your ID | Google login |

⚠️ **MOST COMMON MISTAKE:** Wrong `REACT_APP_BACKEND_URL`

```bash
# ❌ WRONG:
REACT_APP_BACKEND_URL=intowns.in
REACT_APP_BACKEND_URL=api.intowns.in
REACT_APP_BACKEND_URL=https://intowns.in

# ✅ CORRECT:
REACT_APP_BACKEND_URL=https://api.intowns.in
```

**After changing .env, MUST rebuild:**
```bash
cd /var/www/intowns/frontend
npm run build

# Rebuild takes 2-5 minutes
# Then reload Nginx:
systemctl reload nginx
```

---

## 3️⃣ FRONTEND .env.local (OPTIONAL)

**For local development only** - Not used in production

**Location:** `/var/www/intowns/frontend/.env.local`

```env
# For development/testing
REACT_APP_BACKEND_URL=http://localhost:8000
REACT_APP_LOG_LEVEL=debug
```

---

## 4️⃣ ENVIRONMENT VALIDATION

### Check Backend .env
```bash
# Verify all required variables are set
cd /var/www/intowns/backend

# Show all variables
cat .env

# Count variables
cat .env | grep -v "^#" | grep "=" | wc -l

# Test MongoDB connection
source venv/bin/activate
python3 -c "
import os
from dotenv import load_dotenv
load_dotenv()
print('MONGO_URL:', os.getenv('MONGO_URL'))
print('JWT_SECRET length:', len(os.getenv('JWT_SECRET', '')))
print('RAZORPAY_ENABLED:', os.getenv('RAZORPAY_ENABLED'))
"
```

### Check Frontend .env
```bash
# Verify backend URL is correct
grep REACT_APP_BACKEND_URL /var/www/intowns/frontend/.env

# Should output:
# REACT_APP_BACKEND_URL=https://api.intowns.in

# Test if API is reachable
curl -I https://api.intowns.in/api/categories

# Should show: HTTP/2 200
```

### Validate Configuration Files
```bash
#!/bin/bash

echo "=== BACKEND CONFIGURATION ==="
echo -n "MONGO_URL: "
[ -z "$(grep MONGO_URL /var/www/intowns/backend/.env)" ] && echo "❌ MISSING" || echo "✅ SET"

echo -n "JWT_SECRET: "
[ -z "$(grep JWT_SECRET /var/www/intowns/backend/.env)" ] && echo "❌ MISSING" || echo "✅ SET"

echo -n "CORS_ORIGINS: "
grep CORS_ORIGINS /var/www/intowns/backend/.env | grep -q intowns.in && echo "✅ CORRECT" || echo "❌ WRONG"

echo ""
echo "=== FRONTEND CONFIGURATION ==="
echo -n "REACT_APP_BACKEND_URL: "
grep REACT_APP_BACKEND_URL /var/www/intowns/frontend/.env | grep -q "https://api.intowns.in" && echo "✅ CORRECT" || echo "❌ WRONG"
```

---

## 5️⃣ CHANGING CONFIGURATION

### How to Update Backend Config
```bash
# 1. Edit the file
nano /var/www/intowns/backend/.env

# 2. Make changes
# 3. Save (Ctrl+X, Y, Enter)

# 4. Restart backend service
systemctl restart intowns-backend

# 5. Wait 2 seconds
sleep 2

# 6. Verify
systemctl status intowns-backend
```

### How to Update Frontend Config
```bash
# 1. Edit the file
nano /var/www/intowns/frontend/.env

# 2. Make changes (e.g., REACT_APP_BACKEND_URL)
# 3. Save (Ctrl+X, Y, Enter)

# 4. Rebuild (IMPORTANT!)
cd /var/www/intowns/frontend
npm run build

# 5. Reload web server
systemctl reload nginx

# 6. Clear browser cache (Ctrl+Shift+Delete) and refresh
```

---

## 6️⃣ SECRETS MANAGEMENT

### Security Best Practices

**Never:**
- Commit `.env` to Git
- Share secrets in logs or messages
- Use weak JWT secrets
- Hardcode API keys in code

**Do:**
- Store `.env` outside version control
- Use strong random secrets
- Rotate secrets quarterly
- Use `.env.example` for template

### Generate Secure Secrets

```bash
# JWT Secret (32+ characters)
openssl rand -base64 32

# Example output: K7mP9lQ2vX4yZ8wA1bC3dE5fG7hI9jKl

# Or use Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Backup Sensitive Data

```bash
# Backup .env files (keep secure!)
tar -czf intowns-env-backup.tar.gz \
    /var/www/intowns/backend/.env \
    /var/www/intowns/frontend/.env

# Encrypt backup
gpg -c intowns-env-backup.tar.gz

# Store in secure location
# Never commit to Git!
```

---

## 7️⃣ TROUBLESHOOTING CONFIGURATION

### Issue: Backend won't start
```bash
# Check .env syntax
cat /var/www/intowns/backend/.env | grep -E "^[^=]+=.+$" | wc -l

# Check specific error
journalctl -u intowns-backend -n 20 | grep -i error

# Common: MONGO_URL wrong
# Fix: Verify MongoDB is running and password is correct
```

### Issue: Frontend doesn't connect to backend
```bash
# Verify backend URL
grep REACT_APP_BACKEND_URL /var/www/intowns/frontend/.env

# Must be exactly: REACT_APP_BACKEND_URL=https://api.intowns.in

# If changed, MUST rebuild:
cd /var/www/intowns/frontend && npm run build

# Clear browser cache:
# Press Ctrl+Shift+Delete → Clear all
```

### Issue: Google OAuth not working
```bash
# Verify credentials match backend and frontend
echo "Backend:"
grep GOOGLE_CLIENT /var/www/intowns/backend/.env

echo ""
echo "Frontend:"
grep REACT_APP_GOOGLE_CLIENT /var/www/intowns/frontend/.env

# Should match!

# Also verify redirect URI in Google Cloud Console:
# https://api.intowns.in/api/auth/google/callback
```

### Issue: Razorpay not appearing
```bash
# Check backend setting
grep RAZORPAY_ENABLED /var/www/intowns/backend/.env

# Check frontend
grep REACT_APP_ENABLE_RAZORPAY /var/www/intowns/frontend/.env

# Both should be "true"

# Verify keys
grep "RAZORPAY_KEY" /var/www/intowns/backend/.env

# Should show both KEY_ID and KEY_SECRET
```

---

## ✅ CONFIGURATION CHECKLIST

Before deploying, verify:

- [ ] Backend `.env` exists at `/var/www/intowns/backend/.env`
- [ ] Frontend `.env` exists at `/var/www/intowns/frontend/.env`
- [ ] `MONGO_URL` is correct and MongoDB is running
- [ ] `JWT_SECRET` is long (32+ characters) and unique
- [ ] `CORS_ORIGINS` includes your domain
- [ ] `REACT_APP_BACKEND_URL=https://api.intowns.in` (exactly)
- [ ] All API keys (Google, Razorpay) are correct
- [ ] Frontend has been rebuilt after `.env` changes
- [ ] No secrets in Git repository
- [ ] Backup of `.env` files stored securely

---

## 📞 QUICK REFERENCE

```bash
# View backend config
cat /var/www/intowns/backend/.env

# View frontend config  
cat /var/www/intowns/frontend/.env

# Restart backend after .env change
systemctl restart intowns-backend

# Rebuild frontend after .env change
cd /var/www/intowns/frontend && npm run build

# Test backend configuration
curl https://api.intowns.in/api/categories

# Check if rebuild is needed
tail -f /var/log/nginx/intowns.in_access.log
```
