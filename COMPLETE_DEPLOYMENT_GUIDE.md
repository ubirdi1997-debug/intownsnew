# 🚀 COMPLETE DEPLOYMENT GUIDE - INTOWNS ON CLOUDPANEL

**Complete step-by-step guide to deploy Intowns from scratch on CloudPanel with proper DNS and SSL configuration.**

---

## 📋 TABLE OF CONTENTS

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Server Setup](#server-setup)
3. [DNS & SSL Configuration](#dns--ssl-configuration)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Post-Deployment Testing](#post-deployment-testing)
7. [Troubleshooting](#troubleshooting)
8. [Security Hardening](#security-hardening)
9. [Maintenance](#maintenance)

---

## PRE-DEPLOYMENT CHECKLIST

### Requirements

- [ ] Domain registered (e.g., intowns.in)
- [ ] Server with CloudPanel installed (Ubuntu 22.04 LTS+)
- [ ] SSH access to server
- [ ] Administrator email for SSL certificate
- [ ] Google OAuth credentials (Client ID & Secret)
- [ ] Razorpay API keys (Key ID & Secret)
- [ ] MongoDB credentials for admin user

### Estimated Time

- Full deployment: **30-45 minutes**
- Waiting for DNS propagation: **24-48 hours** (DNS may propagate faster)
- SSL certificate generation: **2-5 minutes**

### Resource Requirements

- **RAM:** 2GB minimum, 4GB recommended
- **Disk:** 20GB free space
- **Ports:** 80 (HTTP), 443 (HTTPS), 8000 (Backend), 27017 (MongoDB)
- **CPU:** 1-2 cores minimum

---

## SERVER SETUP

### Step 1: SSH into Server

```bash
ssh root@your.server.ip
# Enter password when prompted

# Verify OS
lsb_release -a
# Should show: Ubuntu 22.04 LTS or higher
```

### Step 2: Update System

```bash
apt-get update -y
apt-get upgrade -y

# Install essential tools
apt-get install -y \
    curl \
    wget \
    git \
    nano \
    htop \
    net-tools \
    build-essential

# Restart if kernel was updated
# reboot
```

### Step 3: Verify CloudPanel Installation

```bash
# CloudPanel should be at https://your.server.ip:8443

# Or check if it's running
systemctl status cloudpanel

# Check default port
netstat -tlnp | grep -E ":8443|:80|:443"
```

### Step 4: Create Application Directory Structure

```bash
# Create main directory
mkdir -p /var/www/intowns
cd /var/www/intowns

# Create subdirectories
mkdir -p backend
mkdir -p frontend
mkdir -p logs
mkdir -p backups

# Verify structure
tree /var/www/intowns/
# Or:
find /var/www/intowns -type d
```

---

## DNS & SSL CONFIGURATION

### Step 5: Add Domains in CloudPanel

1. **Login to CloudPanel:**
   - URL: `https://your.server.ip:8443`
   - Username: `admin`
   - Password: (your CloudPanel password)

2. **Add Domain intowns.in:**
   - Navigate: **Domains → New Domain**
   - Domain Name: `intowns.in`
   - Select Hosting: Select your server
   - Click **Create**

3. **Add Domain api.intowns.in:**
   - Click **New Domain** again
   - Domain Name: `api.intowns.in`
   - Select Hosting: Same server
   - Click **Create**

### Step 6: Configure Nameservers (Choose one option)

**Option A: Use CloudPanel Nameservers (Recommended)**

1. In CloudPanel, click on each domain
2. You'll see 4 nameservers (ns-xxxx.cloudpanel.io)
3. Go to your domain registrar (GoDaddy, Namecheap, etc.)
4. Update nameservers to CloudPanel's nameservers
5. Save changes
6. Wait 24-48 hours for propagation

**Option B: Use A Records (If keeping current registrar)**

1. In your domain registrar's DNS panel
2. Add A records:

```
Domain: intowns.in
Type: A
Name: @ (or leave blank)
Value: your.server.ip
TTL: 3600

Domain: api.intowns.in
Type: A
Name: api
Value: your.server.ip
TTL: 3600

Domain: www.intowns.in
Type: A
Name: www
Value: your.server.ip
TTL: 3600
```

### Step 7: Generate SSL Certificates

**In CloudPanel UI:**

1. Go to **Domains → intowns.in**
2. Click **SSL Certificate**
3. Click **Generate Free Let's Encrypt Certificate**
4. Wait 2-5 minutes

5. Go to **Domains → api.intowns.in**
6. Click **SSL Certificate**
7. Click **Generate Free Let's Encrypt Certificate**
8. Wait 2-5 minutes

**Or via command line:**

```bash
apt-get install certbot python3-certbot-nginx -y

# Generate for intowns.in
certbot certonly --standalone -d intowns.in -d www.intowns.in

# Generate for api.intowns.in
certbot certonly --standalone -d api.intowns.in

# Auto-renewal
systemctl enable certbot.timer
systemctl start certbot.timer
```

### Step 8: Verify DNS & SSL

```bash
# Wait 5 minutes, then test
nslookup intowns.in
nslookup api.intowns.in

# Should return your server IP

# Test SSL
curl -I https://intowns.in
curl -I https://api.intowns.in

# Should show "HTTP/2 200" and no SSL warnings
```

---

## BACKEND DEPLOYMENT

### Step 9: Clone/Download Backend Code

```bash
cd /var/www/intowns/backend

# If using Git:
git clone https://github.com/yourusername/intowns-backend.git .

# Or download and extract your files
# Then:
cd /var/www/intowns/backend
```

### Step 10: Install Python & Dependencies

```bash
# Install Python 3.12
apt-get install -y python3.12 python3.12-venv python3-pip

# Verify
python3.12 --version

# Create virtual environment
cd /var/www/intowns/backend
python3.12 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install requirements
pip install -r requirements.txt
# or
pip install -r requirements-server.txt

# Verify installation
pip list | grep -E "fastapi|motor|pymongo"
```

### Step 11: Setup MongoDB

```bash
# Install MongoDB (if not already installed)
apt-get install -y mongodb

# Or use MongoDB 7.0:
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
apt-get update
apt-get install -y mongodb-org

# Start MongoDB
systemctl start mongod
systemctl enable mongod

# Verify
systemctl status mongod

# Create MongoDB admin user
mongosh

# In mongosh:
> use admin
> db.createUser({
    user: "intowns_admin",
    pwd: "YourSecurePassword123!",
    roles: ["root"]
  })
> exit
```

### Step 12: Configure Backend .env

```bash
cd /var/www/intowns/backend

# Create .env file
cat > .env << 'EOF'
# Server
HOST=0.0.0.0
PORT=8000
ENVIRONMENT=production
DEBUG=false

# MongoDB
MONGO_URL=mongodb://intowns_admin:YourSecurePassword123!@127.0.0.1:27017/intowns_db?authSource=admin&retryWrites=true&w=majority

# CORS - VERY IMPORTANT!
CORS_ORIGINS=https://intowns.in,https://www.intowns.in,http://localhost:3000

# JWT
JWT_SECRET=your_super_secret_jwt_key_min_32_characters_long_here
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Razorpay
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret_key
RAZORPAY_ENABLED=true

# COD Payment
COD_ENABLED=true

# Features
WOMEN_ONLY_ENABLED=true
WHATSAPP_ENABLED=true
WHATSAPP_NUMBER=919876543210

# Logging
LOG_LEVEL=INFO

# Security
ALLOWED_HOSTS=api.intowns.in,intowns.in,www.intowns.in
EOF

# Edit file with your actual values
nano .env
```

### Step 13: Seed Database

```bash
cd /var/www/intowns/backend
source venv/bin/activate

# Run seed script
python seed_data.py

# Should output:
# Created 4 main categories...
# Created 40 sub-categories...
# Created 400 products...
# Database seeding completed!

# Verify data in MongoDB
mongosh -u intowns_admin -p --authenticationDatabase admin
> use intowns_db
> db.categories.countDocuments()  # Should show 44
> db.products.countDocuments()    # Should show 400
> exit
```

### Step 14: Create Systemd Service for Backend

```bash
# Create service file
cat > /etc/systemd/system/intowns-backend.service << 'EOF'
[Unit]
Description=Intowns Backend API
After=network.target mongod.service

[Service]
Type=notify
User=root
WorkingDirectory=/var/www/intowns/backend
ExecStart=/var/www/intowns/backend/venv/bin/python server.py
Restart=always
RestartSec=10
Environment="PYTHONUNBUFFERED=1"
StandardOutput=journal
StandardError=journal
SyslogIdentifier=intowns-backend

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
systemctl daemon-reload

# Enable and start service
systemctl enable intowns-backend
systemctl start intowns-backend

# Verify
systemctl status intowns-backend

# Check logs
journalctl -u intowns-backend -n 20
```

### Step 15: Test Backend

```bash
# Test local
curl http://127.0.0.1:8000/api/categories

# Should return JSON with categories

# Check port is listening
netstat -tlnp | grep 8000

# Should show: python... LISTEN :::8000
```

---

## FRONTEND DEPLOYMENT

### Step 16: Install Node.js

```bash
# Install Node.js 20
apt-get install -y nodejs npm

# Or use NVM for better version management:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20

# Verify
node --version  # v20.x.x
npm --version
```

### Step 17: Setup Frontend

```bash
cd /var/www/intowns/frontend

# If using Git:
git clone https://github.com/yourusername/intowns-frontend.git .

# Install dependencies
npm install

# Verify critical files exist
ls src/App.js
ls src/index.js
ls public/index.html
```

### Step 18: Configure Frontend .env

```bash
cd /var/www/intowns/frontend

# Create .env file
cat > .env << 'EOF'
REACT_APP_BACKEND_URL=https://api.intowns.in
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
REACT_APP_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
REACT_APP_WHATSAPP_NUMBER=919876543210
REACT_APP_ENABLE_PWA=true
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_RAZORPAY=true
REACT_APP_ENABLE_COD=true
REACT_APP_ENABLE_WOMEN_ONLY=true
REACT_APP_LOG_LEVEL=warn
EOF

# Edit with your actual values
nano .env

# CRITICAL: Verify backend URL is correct
grep REACT_APP_BACKEND_URL .env
# Should show: REACT_APP_BACKEND_URL=https://api.intowns.in
```

### Step 19: Build Frontend

```bash
cd /var/www/intowns/frontend

# Build production version
npm run build

# Wait 2-5 minutes...
# Should complete with "The build folder is ready to be deployed"

# Verify build exists
ls -la build/index.html
```

### Step 20: Configure Nginx for Frontend

```bash
# Create Nginx config for intowns.in
cat > /etc/nginx/sites-available/intowns.in << 'EOF'
server {
    listen 80;
    server_name intowns.in www.intowns.in;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name intowns.in www.intowns.in;

    # SSL certificates (CloudPanel generated)
    ssl_certificate /etc/ssl/cloudpanel/intowns.in/cert.pem;
    ssl_certificate_key /etc/ssl/cloudpanel/intowns.in/key.pem;

    # Or if using certbot:
    # ssl_certificate /etc/letsencrypt/live/intowns.in/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/intowns.in/privkey.pem;

    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # React app
    root /var/www/intowns/frontend/build;
    index index.html;

    # Gzip
    gzip on;
    gzip_types text/plain text/css text/javascript application/json application/javascript;
    gzip_min_length 1000;

    # React routing
    location / {
        try_files $uri /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # Deny hidden files
    location ~ /\. {
        deny all;
    }

    # Logging
    access_log /var/log/nginx/intowns.in_access.log;
    error_log /var/log/nginx/intowns.in_error.log;
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/intowns.in /etc/nginx/sites-enabled/intowns.in

# Test Nginx config
nginx -t

# Reload Nginx
systemctl reload nginx
```

### Step 21: Configure Nginx for Backend (Reverse Proxy)

```bash
# Create upstream
cat > /etc/nginx/sites-available/api.intowns.in << 'EOF'
upstream intowns_backend {
    server 127.0.0.1:8000;
    keepalive 32;
}

server {
    listen 80;
    server_name api.intowns.in;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.intowns.in;

    # SSL certificates
    ssl_certificate /etc/ssl/cloudpanel/api.intowns.in/cert.pem;
    ssl_certificate_key /etc/ssl/cloudpanel/api.intowns.in/key.pem;

    # Or if using certbot:
    # ssl_certificate /etc/letsencrypt/live/api.intowns.in/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/api.intowns.in/privkey.pem;

    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Reverse proxy
    location / {
        proxy_pass http://intowns_backend;
        proxy_http_version 1.1;
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }

    # Logging
    access_log /var/log/nginx/api.intowns.in_access.log;
    error_log /var/log/nginx/api.intowns.in_error.log;
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/api.intowns.in /etc/nginx/sites-enabled/api.intowns.in

# Test Nginx config
nginx -t

# Reload Nginx
systemctl reload nginx
```

---

## POST-DEPLOYMENT TESTING

### Step 22: Test All Components

```bash
echo "=== SERVICE STATUS ==="
systemctl status intowns-backend
systemctl status nginx
systemctl status mongod

echo ""
echo "=== LISTENING PORTS ==="
netstat -tlnp | grep -E ":80|:443|:8000|:27017"

echo ""
echo "=== API TEST ==="
curl https://api.intowns.in/api/categories | head -c 200

echo ""
echo "=== DATABASE TEST ==="
mongosh -u intowns_admin -p --authenticationDatabase admin << 'EOF'
use intowns_db
db.categories.count()
EOF
```

### Step 23: Browser Testing

1. **Open Frontend:**
   - Go to `https://intowns.in`
   - Should load without SSL warnings
   - Should see 4 category tiles

2. **Test Categories:**
   - Click "Massage" tile
   - Should see 10 sub-categories
   - Click "Swedish Massage"
   - Should see 10 products with prices

3. **Test Console:**
   - Press F12 → Console tab
   - Should have no errors
   - Should have no CORS errors

4. **Test Network:**
   - Press F12 → Network tab
   - Reload page
   - Check API calls to `https://api.intowns.in/api/categories`
   - Should return status 200

5. **Test Booking Flow:**
   - Click on a product
   - Verify booking modal opens
   - Select payment method (COD or Razorpay)
   - Verify prices are correct

---

## TROUBLESHOOTING

### Categories/Products Not Showing

**Symptom:** Frontend loads but no categories visible

**Checklist:**
```bash
# 1. Verify backend is running
systemctl status intowns-backend

# 2. Verify database has data
mongosh -u intowns_admin -p --authenticationDatabase admin
> use intowns_db
> db.categories.count()  # Should show > 0
> exit

# 3. Test API directly
curl https://api.intowns.in/api/categories

# 4. Check frontend .env
grep REACT_APP_BACKEND_URL /var/www/intowns/frontend/.env
# Must be: REACT_APP_BACKEND_URL=https://api.intowns.in

# 5. Check browser console (F12)
# Look for CORS errors or network errors
```

**Fix:**
```bash
# If .env was wrong, fix it
nano /var/www/intowns/frontend/.env

# Then rebuild
cd /var/www/intowns/frontend
npm run build

# Then reload Nginx
systemctl reload nginx

# Clear browser cache: Ctrl+Shift+Delete
```

### 502 Bad Gateway Error

**Cause:** Nginx can't reach backend

**Fix:**
```bash
# 1. Check backend is running
systemctl status intowns-backend

# 2. Check port 8000
netstat -tlnp | grep 8000
# Should show: python... LISTEN :::8000

# 3. If not listening, restart
systemctl restart intowns-backend

# 4. Check Nginx logs
tail -f /var/log/nginx/api.intowns.in_error.log

# 5. Test connection
curl http://127.0.0.1:8000/api/categories
```

### CORS Errors in Console

**Fix:**
```bash
# Check backend CORS settings
grep CORS_ORIGINS /var/www/intowns/backend/.env

# Must include: https://intowns.in

# If wrong, fix it:
nano /var/www/intowns/backend/.env

# Then restart:
systemctl restart intowns-backend
```

### DNS Not Resolving

**Fix:**
```bash
# Check nameservers
whois intowns.in | grep "Name Server"

# Should show CloudPanel nameservers

# Force DNS refresh
systemctl restart systemd-resolved

# Wait 5 minutes and test
sleep 300
nslookup intowns.in

# Should return your server IP
```

### SSL Certificate Errors

**Fix:**
```bash
# Check certificate validity
openssl x509 -in /etc/ssl/cloudpanel/intowns.in/cert.pem -text -noout | grep -E "Not Before|Not After"

# If expired, regenerate:
certbot renew --force-renewal

# Or regenerate in CloudPanel UI:
# Domains → intowns.in → SSL Certificate → Generate
```

---

## SECURITY HARDENING

### Step 24: Setup Firewall

```bash
# Install UFW
apt-get install -y ufw

# Allow SSH (DO THIS FIRST!)
ufw allow 22/tcp

# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Allow backend (internal only)
ufw allow from 127.0.0.1 to 127.0.0.1 port 8000

# Allow MongoDB (internal only)
ufw allow from 127.0.0.1 to 127.0.0.1 port 27017

# Enable firewall
ufw --force enable

# Verify
ufw status
```

### Step 25: Setup Fail2Ban

```bash
# Install Fail2Ban
apt-get install -y fail2ban

# Copy default config
cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Edit config
nano /etc/fail2ban/jail.local

# Find and set:
# maxretry = 5
# findtime = 600
# bantime = 3600

# Enable and start
systemctl enable fail2ban
systemctl start fail2ban

# Verify
systemctl status fail2ban
```

### Step 26: Setup Log Rotation

```bash
# Create log rotation config
cat > /etc/logrotate.d/intowns << 'EOF'
/var/www/intowns/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 0640 root root
    sharedscripts
}

/var/log/nginx/intowns.in*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    sharedscripts
    postrotate
        if [ -f /var/run/nginx.pid ]; then
            kill -USR1 `cat /var/run/nginx.pid`
        fi
    endscript
}
EOF

# Test
logrotate -d /etc/logrotate.d/intowns
```

---

## MAINTENANCE

### Regular Backups

```bash
# Backup database
mongosh -u intowns_admin -p --authenticationDatabase admin intowns_db --eval "db.collections()" > /var/www/intowns/backups/db-backup-$(date +%Y%m%d).json

# Or use mongodump
mongodump --uri="mongodb://intowns_admin:password@127.0.0.1:27017/intowns_db?authSource=admin" --out=/var/www/intowns/backups/$(date +%Y%m%d)

# Backup frontend source
tar -czf /var/www/intowns/backups/frontend-$(date +%Y%m%d).tar.gz /var/www/intowns/frontend/

# Backup backend source
tar -czf /var/www/intowns/backups/backend-$(date +%Y%m%d).tar.gz /var/www/intowns/backend/
```

### SSL Certificate Renewal

```bash
# Automatic (already configured)
certbot renew

# Manual check
certbot certificates

# View expiry
openssl x509 -in /etc/ssl/cloudpanel/intowns.in/cert.pem -text -noout | grep "Not After"
```

### System Monitoring

```bash
# Check disk space
df -h /var/www

# Check memory
free -h

# Check CPU
top -b -n 1 | head -20

# Check services
systemctl status intowns-backend nginx mongod

# View logs
tail -f /var/log/nginx/intowns.in_access.log
tail -f /var/log/nginx/api.intowns.in_access.log
journalctl -u intowns-backend -f
```

---

## ✅ FINAL VERIFICATION CHECKLIST

- [ ] Server is running (SSH access working)
- [ ] CloudPanel is accessible
- [ ] DNS records pointing to server
- [ ] SSL certificates generated and valid
- [ ] MongoDB running with data seeded
- [ ] Backend service running on port 8000
- [ ] Frontend built and files in place
- [ ] Nginx configured for both domains
- [ ] Frontend loads without SSL warnings
- [ ] Categories display on homepage
- [ ] Clicking categories shows sub-categories
- [ ] Clicking sub-categories shows products
- [ ] Prices and descriptions visible
- [ ] No console errors (F12)
- [ ] API returns 200 status (Network tab)
- [ ] Booking flow works
- [ ] Payment methods display correctly
- [ ] WhatsApp button visible
- [ ] PWA install prompt shows
- [ ] Firewall configured
- [ ] Backups configured

---

## 🎉 DEPLOYMENT COMPLETE!

Your Intowns application is now live!

**Access Points:**
- **Frontend:** https://intowns.in
- **Backend API:** https://api.intowns.in/api
- **CloudPanel:** https://your.server.ip:8443

**Support Guides:**
- Troubleshooting: See QUICK_FIX_GUIDE.md
- Environment Setup: See ENV_CONFIGURATION.md
- DNS & SSL: See DNS_SSL_SETUP.md
- Integration Issues: See API_FRONTEND_INTEGRATION.md

---

## 📞 QUICK COMMAND REFERENCE

```bash
# Service management
systemctl start intowns-backend
systemctl stop intowns-backend
systemctl restart intowns-backend
systemctl status intowns-backend

# View logs
journalctl -u intowns-backend -f
tail -f /var/log/nginx/intowns.in_error.log
tail -f /var/log/nginx/api.intowns.in_error.log

# Database operations
mongosh -u intowns_admin -p --authenticationDatabase admin
# In mongosh:
# use intowns_db
# db.categories.count()
# db.products.count()

# Nginx
nginx -t
systemctl reload nginx
systemctl restart nginx

# Frontend rebuild
cd /var/www/intowns/frontend
npm run build

# Backend restart
systemctl restart intowns-backend

# Full system check
{
    echo "=== SERVICES ===" && systemctl status intowns-backend nginx mongod
    echo "" && echo "=== PORTS ===" && netstat -tlnp
    echo "" && echo "=== API ===" && curl -I https://api.intowns.in/api/categories
}
```
