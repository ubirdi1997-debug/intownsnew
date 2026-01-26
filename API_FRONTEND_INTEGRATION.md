# API & Frontend Integration Troubleshooting Guide

Guide to fix issues where categories and products don't show up on the frontend.

---

## 🔍 Root Causes & Solutions

### Problem 1: Frontend Not Connecting to Backend API

#### Symptom
- Frontend loads but shows empty categories
- Network tab shows failed requests to `/api/categories`
- Console shows CORS errors

#### Quick Diagnosis

```bash
# From your server, test the API directly
curl -H "Accept: application/json" https://api.intowns.in/api/categories

# Should return JSON like:
# [{"id":"...", "name":"Massage", ...}, ...]
```

#### Solution

**Step 1: Verify Frontend Environment Variable**

```bash
# Check what URL the frontend is using
cat /var/www/intowns/frontend/.env

# MUST contain:
# REACT_APP_BACKEND_URL=https://api.intowns.in
```

If incorrect, fix it:

```bash
nano /var/www/intowns/frontend/.env

# Change to:
REACT_APP_BACKEND_URL=https://api.intowns.in
```

**Step 2: Rebuild Frontend**

```bash
cd /var/www/intowns/frontend
npm run build
systemctl reload nginx
```

**Step 3: Clear Browser Cache**

- Hard refresh: `Ctrl + Shift + R` (or `Cmd + Shift + R` on Mac)
- Clear all cookies for intowns.in
- Or open in private/incognito window

---

### Problem 2: Reverse Proxy Not Working

#### Symptom
- API requests timeout or return 502/504 errors
- Nginx error log shows "upstream timed out"

#### Solution

**Step 1: Verify Backend Service is Running**

```bash
# Check if backend is running
ps aux | grep "python.*server.py"

# Start if not running
systemctl start intowns-backend

# Check status
systemctl status intowns-backend
```

**Step 2: Test Direct Backend Connection**

```bash
# Test backend directly on localhost:8000
curl http://127.0.0.1:8000/api/categories

# Should return JSON (not HTML error)
```

**Step 3: Verify Nginx Configuration**

```bash
# Test Nginx config syntax
nginx -t

# Check if api.intowns.in config exists
ls -la /etc/nginx/sites-enabled/

# Reload Nginx
systemctl reload nginx
```

**Step 4: Check Nginx Reverse Proxy Config**

```bash
# View the configuration
cat /etc/nginx/sites-available/api.intowns.in.conf
```

Should contain proper upstream block:

```nginx
upstream backend {
    server 127.0.0.1:8000;
    keepalive 32;
}

location / {
    proxy_pass http://backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

---

### Problem 3: Database Has No Categories/Products

#### Symptom
- API returns empty array `[]`
- Categories don't exist in MongoDB

#### Solution

**Step 1: Check Database State**

```bash
# Connect to MongoDB
mongosh --username intowns_admin --password --authenticationDatabase admin

# In mongosh shell:
> use intowns_db
> db.categories.countDocuments()
# Should return a number > 0

# See if collections exist
> show collections
```

**Step 2: Seed Database**

```bash
cd /var/www/intowns/backend
source venv/bin/activate

# Run seed script
python seed_data.py

# Expected output:
# Seeding intowns.in data...
# Created 4 main categories
# Created 40 sub-categories
# Created 400 products
# Seed completed successfully!
```

**Step 3: Verify Data Was Inserted**

```bash
# Check again
mongosh --username intowns_admin --password --authenticationDatabase admin

> use intowns_db
> db.categories.countDocuments()
# Should now show 44 (4 main + 40 sub)

> db.categories.find({level: 1}).pretty()
# Should show Massage, Therapy, Bridal Makeup, Packages
```

---

### Problem 4: CORS Errors

#### Symptom
- Browser console shows: "Access to XMLHttpRequest... blocked by CORS policy"
- Frontend can't reach backend

#### Solution

**Step 1: Check Backend CORS Configuration**

```bash
# Verify .env file has correct CORS origins
cat /var/www/intowns/backend/.env | grep CORS_ORIGINS

# Should be:
# CORS_ORIGINS=https://intowns.in,https://www.intowns.in,http://localhost:3000
```

**Step 2: Restart Backend**

```bash
systemctl restart intowns-backend

# Wait 5 seconds
sleep 5

# Verify it started
systemctl status intowns-backend
```

**Step 3: Test CORS Headers**

```bash
# Check CORS headers in response
curl -H "Origin: https://intowns.in" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS https://api.intowns.in/api/categories -v

# Should show:
# access-control-allow-origin: https://intowns.in
```

---

### Problem 5: Products Show But No Images

#### Symptom
- Categories load, products appear but images are broken
- Image URLs point to Unsplash

#### Solution

**This is normal!** Unsplash images require internet connection.

If images don't load:
1. Check internet connectivity
2. Check Unsplash URL is valid: Open in browser directly
3. Use local images instead (upload to your server)

---

## 📋 Complete Verification Checklist

Run this checklist to verify everything is working:

```bash
#!/bin/bash

echo "=== INTOWNS SYSTEM VERIFICATION ==="

# 1. Backend Service
echo ""
echo "✓ Checking Backend Service..."
if systemctl is-active --quiet intowns-backend; then
    echo "  ✅ Backend service is RUNNING"
else
    echo "  ❌ Backend service is STOPPED"
fi

# 2. MongoDB
echo ""
echo "✓ Checking MongoDB..."
if systemctl is-active --quiet mongod; then
    echo "  ✅ MongoDB is RUNNING"
else
    echo "  ❌ MongoDB is STOPPED"
fi

# 3. Nginx
echo ""
echo "✓ Checking Nginx..."
if systemctl is-active --quiet nginx; then
    echo "  ✅ Nginx is RUNNING"
else
    echo "  ❌ Nginx is STOPPED"
fi

# 4. Nginx Syntax
echo ""
echo "✓ Testing Nginx Configuration..."
if nginx -t 2>/dev/null; then
    echo "  ✅ Nginx config is VALID"
else
    echo "  ❌ Nginx config has ERRORS"
fi

# 5. Backend Connectivity
echo ""
echo "✓ Testing Backend API..."
if curl -s http://127.0.0.1:8000/api/categories | grep -q "Massage"; then
    echo "  ✅ Backend API is RESPONDING with data"
else
    echo "  ❌ Backend API is not responding correctly"
fi

# 6. Reverse Proxy
echo ""
echo "✓ Testing Reverse Proxy..."
if curl -s https://api.intowns.in/api/categories 2>/dev/null | grep -q "Massage"; then
    echo "  ✅ Reverse proxy is WORKING"
else
    echo "  ❌ Reverse proxy connection FAILED"
fi

# 7. Database
echo ""
echo "✓ Checking Database..."
CATEGORY_COUNT=$(mongosh --username intowns_admin --password=your-password --authenticationDatabase admin --quiet --eval "db.intowns_db.categories.countDocuments()" 2>/dev/null)
echo "  Database has $CATEGORY_COUNT categories"

echo ""
echo "=== VERIFICATION COMPLETE ==="
```

Save as `verify.sh` and run:
```bash
bash verify.sh
```

---

## 🔧 Common Quick Fixes

### Categories Won't Load

```bash
# 1. Check backend
systemctl restart intowns-backend

# 2. Check Nginx
systemctl reload nginx

# 3. Rebuild frontend
cd /var/www/intowns/frontend
npm run build

# 4. Clear browser cache (Ctrl+Shift+R)
```

### API Returns 500 Error

```bash
# Check backend logs
journalctl -u intowns-backend -n 100

# Check for Python errors
cd /var/www/intowns/backend
source venv/bin/activate
python server.py  # Run directly to see errors
```

### Database Connection Failed

```bash
# Check MongoDB status
systemctl status mongod

# Verify credentials in .env
cat /var/www/intowns/backend/.env | grep MONGO

# Test connection
mongosh --username intowns_admin --password --authenticationDatabase admin
```

### 502 Bad Gateway

```bash
# Backend not responding
systemctl restart intowns-backend

# Check if port 8000 is listening
netstat -tlnp | grep 8000

# Should show: python... LISTEN :::8000
```

---

## 📊 Detailed Debugging Steps

### Enable Debug Logs

**Step 1: Backend Debug Mode**

```bash
# Edit backend .env
nano /var/www/intowns/backend/.env

# Add:
DEBUG=true
LOG_LEVEL=DEBUG

# Restart
systemctl restart intowns-backend
```

**Step 2: View Detailed Logs**

```bash
# Real-time backend logs
journalctl -u intowns-backend -f

# Nginx error logs
tail -f /var/log/nginx/api.intowns.in_error.log
tail -f /var/log/nginx/intowns.in_error.log

# MongoDB logs
tail -f /var/log/mongodb/mongod.log
```

**Step 3: Frontend Debug**

```bash
# Open browser Developer Tools (F12)
# Go to Console tab
# Look for errors or network failures
# Go to Network tab and check API calls
```

---

## 🚀 Performance Optimization

If data loads but is slow:

```bash
# 1. Check system resources
top
free -h
df -h

# 2. Check database indexes
mongosh
> use intowns_db
> db.products.getIndexes()
> db.categories.getIndexes()

# 3. Optimize backend
systemctl stop intowns-backend
cd /var/www/intowns/backend
pip install --upgrade-deps
pip install -r requirements.txt
systemctl start intowns-backend

# 4. Clear Nginx cache
systemctl reload nginx
```

---

## ✅ Final Verification

Once everything is configured:

1. **Open Frontend**: https://intowns.in
   - Should see 4 main category tiles
   - Images should load

2. **Click a Category**: e.g., "Massage"
   - Should see 10 sub-categories fade in
   - No errors in console

3. **Click Sub-Category**: e.g., "Swedish Massage"
   - Should see 10 products appear
   - Prices and descriptions visible

4. **Test Payment Method**:
   - Should see COD and Online payment options
   - If Razorpay configured, both appear

5. **Check Console** (F12):
   - No red errors
   - Network tab shows successful API calls (200 status)

---

## 📞 Support Resources

- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **MongoDB Docs**: https://docs.mongodb.com/
- **Nginx Docs**: https://nginx.org/en/docs/
- **React Docs**: https://react.dev/
- **CloudPanel Help**: https://www.cloudpanel.io/docs/

