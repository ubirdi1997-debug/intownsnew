# Quick Fix Guide - Categories & Products Not Showing

**Problem:** Categories and products don't appear on frontend

**Time to fix:** 5-15 minutes

---

## 🚨 IMMEDIATE FIX (Try First)

### Fix 1: Rebuild Frontend (Most Common Issue)

```bash
ssh root@your-server-ip

# Go to frontend directory
cd /var/www/intowns/frontend

# Verify .env has correct backend URL
cat .env
# Should show: REACT_APP_BACKEND_URL=https://api.intowns.in

# If wrong, fix it
nano .env
# Change to: REACT_APP_BACKEND_URL=https://api.intowns.in

# Rebuild
npm run build

# Reload Nginx
systemctl reload nginx
```

**Then:** Hard refresh browser (Ctrl+Shift+R)

### Fix 2: Restart Backend Service

```bash
systemctl restart intowns-backend

# Wait 2 seconds
sleep 2

# Verify it's running
systemctl status intowns-backend
```

### Fix 3: Clear Browser Cache

1. Open Developer Tools (F12)
2. Right-click refresh button → **Empty Cache and Hard Refresh**
3. Or open in Incognito window

---

## ✅ VERIFY FIXES WORKED

```bash
# Test 1: API returns data
curl https://api.intowns.in/api/categories

# Should show JSON with Massage, Therapy, Bridal Makeup, Packages

# Test 2: Reverse proxy works
curl https://api.intowns.in/api/categories | grep "Massage"

# Should return the word "Massage"
```

**Result:**
- If you see categories in API response → **Frontend issue**
- If you get error/timeout → **Backend or reverse proxy issue**

---

## 🔧 TROUBLESHOOTING BY SYMPTOM

### Symptom 1: "No categories" + API call timeout

**Problem:** Backend not responding

**Fix:**
```bash
# Check if backend is running
ps aux | grep "python.*server.py"

# If not in list, start it
systemctl start intowns-backend

# Check for errors
journalctl -u intowns-backend -n 20
```

### Symptom 2: "No categories" + API returns data

**Problem:** Frontend not connecting to backend

**Fix:**
```bash
# Check frontend .env
cat /var/www/intowns/frontend/.env

# MUST have:
# REACT_APP_BACKEND_URL=https://api.intowns.in

# If missing or wrong, fix it
nano /var/www/intowns/frontend/.env

# Rebuild and reload
npm run build
systemctl reload nginx
```

**Clear cache:**
- Press F12 → DevTools
- Right-click refresh → "Empty cache and hard refresh"

### Symptom 3: CORS error in console

**Problem:** Backend CORS settings incorrect

**Fix:**
```bash
# Edit backend .env
nano /var/www/intowns/backend/.env

# Verify CORS_ORIGINS has your domain:
# CORS_ORIGINS=https://intowns.in,https://www.intowns.in,http://localhost:3000

# Restart backend
systemctl restart intowns-backend

# Wait 3 seconds
sleep 3
```

### Symptom 4: API returns empty array []

**Problem:** Database has no data

**Fix:**
```bash
# Seed database
cd /var/www/intowns/backend
source venv/bin/activate
python seed_data.py

# Wait for completion
# Should see: "Created 4 main categories"
#            "Created 40 sub-categories"
#            "Created 400 products"
```

### Symptom 5: 502 Bad Gateway error

**Problem:** Nginx can't reach backend

**Fix:**
```bash
# Test backend is running on port 8000
netstat -tlnp | grep 8000

# Should show: python... LISTEN :::8000

# If not, start it
systemctl start intowns-backend

# Verify Nginx config
nginx -t

# Reload Nginx
systemctl reload nginx
```

---

## 🔍 DETAILED DEBUGGING

### Step 1: Verify All Services Running

```bash
#!/bin/bash
echo "=== SERVICE STATUS ==="

echo -n "Backend: "
systemctl is-active intowns-backend

echo -n "Nginx: "
systemctl is-active nginx

echo -n "MongoDB: "
systemctl is-active mongod

echo ""
echo "=== LISTENING PORTS ==="
netstat -tlnp | grep -E ":(80|443|8000|27017)"

echo ""
echo "=== API TEST ==="
echo "Test 1: Direct API"
curl -s http://127.0.0.1:8000/api/categories | head -c 100

echo ""
echo "Test 2: Via Reverse Proxy"
curl -s https://api.intowns.in/api/categories | head -c 100
```

### Step 2: Check Nginx Logs

```bash
# Real-time errors
tail -f /var/log/nginx/api.intowns.in_error.log

# Real-time access
tail -f /var/log/nginx/api.intowns.in_access.log

# Frontend errors
tail -f /var/log/nginx/intowns.in_error.log
```

### Step 3: Check Backend Logs

```bash
# Real-time backend logs
journalctl -u intowns-backend -f

# Last 50 lines
journalctl -u intowns-backend -n 50

# Full output
journalctl -u intowns-backend
```

### Step 4: Test Backend Directly

```bash
cd /var/www/intowns/backend
source venv/bin/activate

# Run directly to see errors
python server.py

# Should show:
# INFO:     Uvicorn running on http://0.0.0.0:8000
# INFO:     Application startup complete
```

### Step 5: Check Database

```bash
# Connect to MongoDB
mongosh --username intowns_admin --password --authenticationDatabase admin

# In mongosh:
> use intowns_db
> db.categories.countDocuments()

# Should show 44 (4 main + 40 sub)

> db.products.countDocuments()

# Should show 400

> db.categories.find({level: 1}).pretty()

# Should show 4 main categories
```

---

## 📋 STEP-BY-STEP FULL RESET

If everything is broken, do a full reset:

### Step 1: Stop All Services
```bash
systemctl stop intowns-backend
systemctl stop nginx
systemctl stop mongod
```

### Step 2: Clear Database
```bash
systemctl start mongod
mongosh --username intowns_admin --password --authenticationDatabase admin

# In mongosh:
> use intowns_db
> db.categories.deleteMany({})
> db.products.deleteMany({})
> exit
```

### Step 3: Verify Backend .env
```bash
cat /var/www/intowns/backend/.env

# Check these values:
# MONGO_URL - correct MongoDB connection
# CORS_ORIGINS - includes https://intowns.in
# JWT_SECRET - has value
# GOOGLE_CLIENT_ID - has value
```

### Step 4: Seed Database
```bash
cd /var/www/intowns/backend
source venv/bin/activate
python seed_data.py

# Wait for completion
```

### Step 5: Verify Frontend .env
```bash
cat /var/www/intowns/frontend/.env

# Must have:
# REACT_APP_BACKEND_URL=https://api.intowns.in
```

### Step 6: Rebuild Frontend
```bash
cd /var/www/intowns/frontend
npm run build
```

### Step 7: Start All Services
```bash
systemctl start mongod
systemctl start intowns-backend
systemctl start nginx

# Wait 5 seconds
sleep 5

# Verify
systemctl status intowns-backend
systemctl status nginx
```

### Step 8: Test
```bash
# API test
curl https://api.intowns.in/api/categories

# Frontend test
# Open https://intowns.in in browser
```

---

## 🆘 IF STILL NOT WORKING

### Enable Debug Mode

**Backend:**
```bash
nano /var/www/intowns/backend/.env

# Add:
DEBUG=true
LOG_LEVEL=DEBUG

# Save and restart
systemctl restart intowns-backend
```

**Then collect logs:**
```bash
# Collect all logs to a file
{
    echo "=== BACKEND LOGS ==="
    journalctl -u intowns-backend -n 100
    
    echo ""
    echo "=== NGINX ERROR LOG ==="
    tail -n 50 /var/log/nginx/api.intowns.in_error.log
    
    echo ""
    echo "=== NGINX ACCESS LOG ==="
    tail -n 50 /var/log/nginx/api.intowns.in_access.log
    
    echo ""
    echo "=== PROCESSES ==="
    ps aux | grep -E "python|nginx|mongod"
    
    echo ""
    echo "=== PORTS ==="
    netstat -tlnp
    
} > intowns-debug.log

# View the log
cat intowns-debug.log
```

### Common Error Messages

| Error | Cause | Fix |
|-------|-------|-----|
| "Connection refused" | Backend not running | `systemctl start intowns-backend` |
| "502 Bad Gateway" | Nginx can't reach backend | Check port 8000 is listening |
| "CORS error" | Wrong domain in backend | Update `CORS_ORIGINS` in .env |
| "Empty array []" | Database empty | Run `python seed_data.py` |
| "timeout" | API too slow | Check RAM/CPU, restart backend |
| "Can't reach api.intowns.in" | DNS/SSL issue | Wait for DNS, check certificate |

---

## ✅ FINAL VERIFICATION

When fixed, verify with this checklist:

- [ ] `https://intowns.in` loads
- [ ] See 4 category tiles
- [ ] Click Massage → see 10 sub-categories
- [ ] Click Swedish Massage → see 10 products
- [ ] Prices visible
- [ ] No console errors (F12)
- [ ] API returns 200 status (Network tab)
- [ ] Images load (Unsplash)

---

## 🆘 CONTACT SUPPORT IF

- Services won't start after restart
- Database connection fails repeatedly
- SSL certificate errors persist
- Network timeout even after fixes
- Nginx config errors won't resolve

When contacting support, include:
```bash
# Generate support info
{
    echo "=== SYSTEM INFO ==="
    lsb_release -a
    uname -r
    
    echo ""
    echo "=== SERVICE STATUS ==="
    systemctl status intowns-backend
    systemctl status nginx
    systemctl status mongod
    
    echo ""
    echo "=== ERROR LOGS ==="
    journalctl -u intowns-backend -n 50
    tail -n 20 /var/log/nginx/api.intowns.in_error.log
    
} > support-info.log

# Share: support-info.log
```

