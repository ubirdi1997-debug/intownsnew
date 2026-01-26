# CloudPanel Setup Guide for Intowns.in

Complete step-by-step guide to deploy the Intowns application using CloudPanel.

---

## 📋 Table of Contents

1. [Initial Server Setup](#initial-server-setup)
2. [CloudPanel Installation](#cloudpanel-installation)
3. [Domain Configuration](#domain-configuration)
4. [Backend Setup (API)](#backend-setup-api)
5. [Frontend Setup](#frontend-setup)
6. [Reverse Proxy Configuration](#reverse-proxy-configuration)
7. [SSL Certificate Setup](#ssl-certificate-setup)
8. [Database Setup](#database-setup)
9. [Environment Configuration](#environment-configuration)
10. [Troubleshooting](#troubleshooting)

---

## 1. Initial Server Setup

### Prerequisites
- Ubuntu 22.04 LTS or Ubuntu 24.04 LTS
- Minimum 4GB RAM, 2 CPU cores
- 50GB SSD storage
- Root access or sudo privileges
- Domain names: `intowns.in` and `api.intowns.in`

### Step 1.1: Update System

```bash
# SSH into your server
ssh root@your-server-ip

# Update package manager
apt update && apt upgrade -y

# Install essential tools
apt install -y curl wget git htop nano vim build-essential
```

### Step 1.2: Install Required Services

```bash
# Install Node.js (for frontend)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs

# Install Python 3.12
apt install -y python3.12 python3.12-venv python3.12-dev python3-pip

# Install MongoDB
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg --dearmor | tee /usr/share/keyrings/mongodb-archive-keyring.gpg > /dev/null
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-archive-keyring.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
apt update
apt install -y mongodb-org

# Start MongoDB
systemctl start mongod
systemctl enable mongod
```

---

## 2. CloudPanel Installation

### Step 2.1: Download and Install CloudPanel

```bash
# Download CloudPanel installer
wget https://releases.cloudpanel.io/cloudpanel-ce-ubuntu.sh

# Make it executable
chmod +x cloudpanel-ce-ubuntu.sh

# Run the installer
bash cloudpanel-ce-ubuntu.sh
```

### Step 2.2: Initial CloudPanel Setup

After installation, CloudPanel will be available at:
- **URL**: `https://your-server-ip:8443`
- **Default User**: `admin`
- **Default Password**: Check email or terminal output

**First Login:**
1. Open your browser and go to `https://your-server-ip:8443`
2. Accept SSL warning (self-signed certificate)
3. Login with default credentials
4. Change password immediately
5. Configure email settings (SMTP)

### Step 2.3: CloudPanel Configuration

1. Go to **Settings → System**
   - Set timezone to your region
   - Configure automatic backups

2. Go to **Settings → User Management**
   - Create additional admin users if needed
   - Set backup retention policies

---

## 3. Domain Configuration

### Step 3.1: DNS Configuration

Update your domain registrar's DNS records:

```
For intowns.in:
A Record: intowns.in → your-server-ip
A Record: www.intowns.in → your-server-ip

For api.intowns.in:
A Record: api.intowns.in → your-server-ip
```

### Step 3.2: Add Domains in CloudPanel

**In CloudPanel Dashboard:**

1. **Add intowns.in (Frontend)**
   - Go to **Websites**
   - Click **Create Website**
   - Domain: `intowns.in`
   - Server: Select your server
   - Document Root: `/var/www/intowns/frontend/build` (after build)
   - PHP: None (disable)
   - Save

2. **Add api.intowns.in (Backend API)**
   - Go to **Websites**
   - Click **Create Website**
   - Domain: `api.intowns.in`
   - Server: Select your server
   - Document Root: `/var/www/intowns/backend`
   - PHP: None (disable)
   - Save

---

## 4. Backend Setup (API)

### Step 4.1: Prepare Backend Directory

```bash
# SSH into server
ssh root@your-server-ip

# Create application directory
mkdir -p /var/www/intowns/backend
cd /var/www/intowns/backend

# Set proper permissions
chown -R www-data:www-data /var/www/intowns
chmod -R 755 /var/www/intowns
```

### Step 4.2: Upload Backend Code

Upload your backend files to `/var/www/intowns/backend/`:
- `server.py`
- `seed_data.py`
- `requirements.txt`
- `.env` (create this - see Environment Configuration)

You can use:
```bash
# Via SCP (from your local machine)
scp -r /path/to/backend/* root@your-server-ip:/var/www/intowns/backend/

# Or via Git
cd /var/www/intowns/backend
git clone https://your-repo.git .
```

### Step 4.3: Setup Python Virtual Environment

```bash
cd /var/www/intowns/backend

# Create virtual environment
python3.12 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Verify installation
pip list
```

### Step 4.4: Seed Database

```bash
cd /var/www/intowns/backend
source venv/bin/activate

# Run seed script
python seed_data.py
```

**Expected Output:**
```
Seeding intowns.in data...
Created 4 main categories
Created 40 sub-categories
Created 400 products
...
```

---

## 5. Frontend Setup

### Step 5.1: Prepare Frontend Directory

```bash
mkdir -p /var/www/intowns/frontend
cd /var/www/intowns/frontend

# Set proper permissions
chown -R www-data:www-data /var/www/intowns/frontend
chmod -R 755 /var/www/intowns/frontend
```

### Step 5.2: Upload Frontend Code

Upload your frontend files (React app):
```bash
# Via SCP (from your local machine)
scp -r /path/to/frontend/* root@your-server-ip:/var/www/intowns/frontend/
```

### Step 5.3: Install Dependencies and Build

```bash
cd /var/www/intowns/frontend

# Install Node dependencies
npm install

# Create .env file
cat > .env << EOF
REACT_APP_BACKEND_URL=https://api.intowns.in
REACT_APP_GOOGLE_CLIENT_ID=860163349495-dft8tg560fa5jmvs3kr255cn0g1gso70.apps.googleusercontent.com
EOF

# Build the React app
npm run build

# Verify build created successfully
ls -la build/
```

### Step 5.4: Serve Frontend with Nginx

In CloudPanel, configure Nginx for the frontend:

**Via CloudPanel Dashboard:**
1. Go to **Websites → intowns.in**
2. Click **Edit**
3. Click **Advanced Settings**
4. Add this configuration:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}

location /static/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

Save and restart Nginx:
```bash
systemctl restart nginx
```

---

## 6. Reverse Proxy Configuration

### Step 6.1: Configure Nginx Reverse Proxy for Backend

Edit the Nginx configuration for `api.intowns.in`:

```bash
# Edit the Nginx site configuration
nano /etc/nginx/sites-available/api.intowns.in.conf
```

Add/modify to:

```nginx
upstream backend {
    server 127.0.0.1:8000;
    keepalive 32;
}

server {
    listen 80;
    listen [::]:80;
    server_name api.intowns.in;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.intowns.in;

    # SSL certificates (will be added by CloudPanel)
    ssl_certificate /etc/letsencrypt/live/api.intowns.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.intowns.in/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;

    # Reverse proxy configuration
    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $server_name;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Root document path (not used but required)
    root /var/www/intowns/backend;
    access_log /var/log/nginx/api.intowns.in_access.log;
    error_log /var/log/nginx/api.intowns.in_error.log;
}
```

### Step 6.2: Test Nginx Configuration

```bash
# Test configuration syntax
nginx -t

# Reload Nginx
systemctl reload nginx
```

---

## 7. SSL Certificate Setup

### Step 7.1: Setup SSL via CloudPanel

**In CloudPanel Dashboard:**

1. Go to **Websites**
2. Select **intowns.in**
3. Go to **SSL**
4. Click **Issue SSL Certificate**
   - Provider: Let's Encrypt
   - Auto Renew: Enable
   - Save

5. Repeat for **api.intowns.in**

### Step 7.2: Verify SSL

```bash
# Check certificate validity
openssl s_client -connect api.intowns.in:443 -servername api.intowns.in

# Check certificate expiration
certbot certificates
```

---

## 8. Database Setup

### Step 8.1: Secure MongoDB

```bash
# Stop MongoDB
systemctl stop mongod

# Edit MongoDB configuration
nano /etc/mongod.conf
```

Add these settings:

```yaml
# Enable authentication
security:
  authorization: enabled

# Bind to localhost only
net:
  bindIp: 127.0.0.1
```

### Step 8.2: Create Database User

```bash
# Start MongoDB
systemctl start mongod

# Connect to MongoDB
mongosh

# In mongosh shell:
> use admin
> db.createUser({
    user: "intowns_admin",
    pwd: "your-secure-password-here",
    roles: [{ role: "root", db: "admin" }]
  })

# Create application database
> use intowns_db
> db.createCollection("categories")

> exit
```

### Step 8.3: Test Connection

```bash
mongosh --username intowns_admin --password --authenticationDatabase admin
```

---

## 9. Environment Configuration

### Step 9.1: Create Backend .env File

```bash
nano /var/www/intowns/backend/.env
```

Add:

```env
# MongoDB Configuration
MONGO_URL="mongodb://intowns_admin:your-secure-password@127.0.0.1:27017/intowns_db?authSource=admin"
DB_NAME="intowns_db"

# Frontend URLs
FRONTEND_URL="https://intowns.in"
API_URL="https://api.intowns.in"

# CORS Origins
CORS_ORIGINS="https://intowns.in,https://www.intowns.in,http://localhost:3000"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production-min-32-chars"
JWT_ALGORITHM="HS256"
JWT_EXPIRATION_HOURS=720

# Google OAuth
GOOGLE_CLIENT_ID="860163349495-dft8tg560fa5jmvs3kr255cn0g1gso70.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="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"

# Razorpay (UPDATE WITH LIVE KEYS FOR PRODUCTION)
RAZORPAY_KEY_ID="rzp_test_dummy"
RAZORPAY_KEY_SECRET="dummy_secret"

# Email Configuration (Optional)
SMTP_SERVER="smtp.mailtrap.io"
SMTP_PORT=2525
SMTP_USER="your-mailtrap-user"
SMTP_PASSWORD="your-mailtrap-password"
SMTP_FROM="noreply@intowns.in"

# WhatsApp Support Number
WHATSAPP_NUMBER="+919115535739"

# Server Port
PORT=8000
```

Set proper permissions:
```bash
chmod 600 /var/www/intowns/backend/.env
chown www-data:www-data /var/www/intowns/backend/.env
```

### Step 9.2: Verify Frontend .env

```bash
cat /var/www/intowns/frontend/.env
```

Should contain:
```
REACT_APP_BACKEND_URL=https://api.intowns.in
REACT_APP_GOOGLE_CLIENT_ID=860163349495-dft8tg560fa5jmvs3kr255cn0g1gso70.apps.googleusercontent.com
```

---

## 10. Start Backend Service

### Step 10.1: Create Systemd Service

```bash
nano /etc/systemd/system/intowns-backend.service
```

Add:

```ini
[Unit]
Description=Intowns Backend API
After=network.target mongod.service
Wants=mongod.service

[Service]
Type=notify
User=www-data
WorkingDirectory=/var/www/intowns/backend
Environment="PATH=/var/www/intowns/backend/venv/bin"
ExecStart=/var/www/intowns/backend/venv/bin/python /var/www/intowns/backend/server.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

### Step 10.2: Start Service

```bash
# Enable service on startup
systemctl enable intowns-backend

# Start service
systemctl start intowns-backend

# Check status
systemctl status intowns-backend

# View logs
journalctl -u intowns-backend -f
```

---

## 11. Troubleshooting

### Issue: Categories/Products Not Showing

**Symptoms:** Frontend shows loading but no data

**Fix:**

1. **Check Backend API Connectivity:**
```bash
# Test API endpoint
curl -H "Accept: application/json" https://api.intowns.in/api/categories

# Should return JSON array of categories
```

2. **Verify Frontend Environment Variables:**
```bash
cat /var/www/intowns/frontend/.env
# Check REACT_APP_BACKEND_URL is correct
```

3. **Rebuild Frontend if Changed:**
```bash
cd /var/www/intowns/frontend
npm run build
systemctl reload nginx
```

4. **Check Nginx Logs:**
```bash
tail -f /var/log/nginx/api.intowns.in_error.log
tail -f /var/log/nginx/intowns.in_error.log
```

### Issue: Backend Won't Start

**Fix:**

```bash
# Check service status
systemctl status intowns-backend

# View detailed logs
journalctl -u intowns-backend -n 50

# Test backend directly
cd /var/www/intowns/backend
source venv/bin/activate
python server.py
```

### Issue: SSL Certificate Issues

**Fix:**

```bash
# Check certificate
certbot certificates

# Renew all certificates
certbot renew --dry-run

# Force renewal
certbot renew --force-renewal
```

### Issue: Database Connection Failed

**Fix:**

```bash
# Test MongoDB connection
mongosh --username intowns_admin --password --authenticationDatabase admin

# Check MongoDB status
systemctl status mongod

# View MongoDB logs
tail -f /var/log/mongodb/mongod.log
```

### Issue: High CPU/Memory Usage

**Monitor and optimize:**

```bash
# Monitor processes
htop

# Check backend status
ps aux | grep python

# Restart backend
systemctl restart intowns-backend
```

---

## 12. Security Hardening

### Step 12.1: Firewall Configuration

```bash
# Enable UFW
ufw enable

# Allow SSH
ufw allow 22/tcp

# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Allow CloudPanel
ufw allow 8443/tcp

# Check status
ufw status
```

### Step 12.2: Fail2Ban Setup

```bash
# Install Fail2Ban
apt install -y fail2ban

# Enable
systemctl enable fail2ban
systemctl start fail2ban
```

### Step 12.3: Regular Backups

**In CloudPanel Dashboard:**

1. Go to **Settings → Backups**
2. Set backup frequency (Daily)
3. Configure remote storage (optional)
4. Enable automatic cleanup

---

## 13. Monitoring and Maintenance

### Daily Tasks

```bash
# Check backend status
systemctl status intowns-backend

# Monitor logs
journalctl -u intowns-backend -n 100

# Check disk usage
df -h
```

### Weekly Tasks

- Review access logs
- Check certificate expiration
- Monitor database size

### Monthly Tasks

- Review security settings
- Update system packages
- Backup database

---

## 14. Useful Commands Reference

```bash
# Backend Control
systemctl start intowns-backend
systemctl stop intowns-backend
systemctl restart intowns-backend
systemctl status intowns-backend

# Nginx Control
systemctl reload nginx
systemctl restart nginx
nginx -t

# MongoDB Control
systemctl start mongod
systemctl stop mongod
systemctl status mongod

# View Logs
journalctl -u intowns-backend -f
tail -f /var/log/nginx/api.intowns.in_error.log
tail -f /var/log/nginx/intowns.in_error.log

# Database Management
mongosh --username intowns_admin --password --authenticationDatabase admin
```

---

## Support & Documentation

- CloudPanel Docs: https://www.cloudpanel.io/docs/
- FastAPI Docs: https://fastapi.tiangolo.com/
- MongoDB Docs: https://docs.mongodb.com/
- Nginx Docs: https://nginx.org/en/docs/
- Let's Encrypt Docs: https://letsencrypt.org/docs/

