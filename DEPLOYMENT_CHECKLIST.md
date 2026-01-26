# Quick Deployment Checklist for Intowns.in

Quick reference checklist to verify everything is working after deployment.

---

## ✅ Pre-Deployment Checklist

### Server Infrastructure
- [ ] Ubuntu 22.04 LTS or 24.04 LTS installed
- [ ] Root access verified
- [ ] 4GB+ RAM available
- [ ] 50GB+ SSD space available
- [ ] SSH key configured

### DNS & Domains
- [ ] Domain registrar updated with server IP
- [ ] `intowns.in` A record → server IP
- [ ] `www.intowns.in` A record → server IP
- [ ] `api.intowns.in` A record → server IP
- [ ] DNS propagated (wait 24 hours if new)

### Required Services Installed
- [ ] Node.js 20.x installed
- [ ] Python 3.12 installed
- [ ] MongoDB 7.0 installed
- [ ] Nginx installed
- [ ] CloudPanel installed
- [ ] Git installed

---

## 🚀 Deployment Execution Checklist

### Step 1: Server Setup (5 minutes)
```bash
ssh root@your-server-ip
apt update && apt upgrade -y
```
- [ ] System updated
- [ ] Essential tools installed

### Step 2: Application Directories (2 minutes)
```bash
mkdir -p /var/www/intowns/{backend,frontend}
chown -R www-data:www-data /var/www/intowns
```
- [ ] Directories created
- [ ] Permissions set

### Step 3: Backend Setup (10 minutes)
```bash
cd /var/www/intowns/backend
# Upload files via SCP or git
git clone your-repo .
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```
- [ ] Backend files uploaded
- [ ] Virtual environment created
- [ ] Dependencies installed

### Step 4: Backend Configuration (5 minutes)
```bash
nano /var/www/intowns/backend/.env
```
Add these values:
```env
MONGO_URL="mongodb://intowns_admin:secure-password@127.0.0.1:27017/intowns_db?authSource=admin"
DB_NAME="intowns_db"
FRONTEND_URL="https://intowns.in"
CORS_ORIGINS="https://intowns.in,https://www.intowns.in,http://localhost:3000"
JWT_SECRET="your-32-char-min-secret-key-here"
GOOGLE_CLIENT_ID="860163349495-dft8tg560fa5jmvs3kr255cn0g1gso70.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="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"
RAZORPAY_KEY_ID="rzp_test_dummy"
RAZORPAY_KEY_SECRET="dummy_secret"
WHATSAPP_NUMBER="+919115535739"
PORT=8000
```
- [ ] .env file created
- [ ] All values filled
- [ ] Permissions set (600)

### Step 5: Database Setup (5 minutes)
```bash
systemctl start mongod
mongosh
```
In mongosh shell:
```javascript
use admin
db.createUser({
  user: "intowns_admin",
  pwd: "secure-password",
  roles: [{ role: "root", db: "admin" }]
})
use intowns_db
db.createCollection("categories")
exit
```
- [ ] MongoDB started
- [ ] Admin user created
- [ ] Database initialized

### Step 6: Seed Database (2 minutes)
```bash
cd /var/www/intowns/backend
source venv/bin/activate
python seed_data.py
```
Expected output:
```
Seeding intowns.in data...
Created 4 main categories
Created 40 sub-categories
Created 400 products
Seed completed successfully!
```
- [ ] Seed script executed successfully
- [ ] 44 categories created
- [ ] 400 products created

### Step 7: Backend Service Setup (3 minutes)
```bash
nano /etc/systemd/system/intowns-backend.service
```
- [ ] Systemd service file created
- [ ] Service enabled: `systemctl enable intowns-backend`
- [ ] Service started: `systemctl start intowns-backend`
- [ ] Service verified: `systemctl status intowns-backend`

### Step 8: Frontend Setup (5 minutes)
```bash
cd /var/www/intowns/frontend
npm install
```
- [ ] Frontend files uploaded
- [ ] Dependencies installed

### Step 9: Frontend Configuration (2 minutes)
```bash
nano /var/www/intowns/frontend/.env
```
Add:
```
REACT_APP_BACKEND_URL=https://api.intowns.in
REACT_APP_GOOGLE_CLIENT_ID=860163349495-dft8tg560fa5jmvs3kr255cn0g1gso70.apps.googleusercontent.com
```
- [ ] .env file created
- [ ] Backend URL correct
- [ ] Google Client ID added

### Step 10: Frontend Build (3 minutes)
```bash
cd /var/www/intowns/frontend
npm run build
```
- [ ] Build completed successfully
- [ ] `build/` directory created
- [ ] No build errors

### Step 11: Nginx Configuration (5 minutes)

**For Frontend (intowns.in):**
```bash
nano /etc/nginx/sites-available/intowns.in.conf
```
Add:
```nginx
server {
    listen 80;
    server_name intowns.in www.intowns.in;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name intowns.in www.intowns.in;
    
    ssl_certificate /etc/letsencrypt/live/intowns.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/intowns.in/privkey.pem;
    
    root /var/www/intowns/frontend/build;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**For Backend (api.intowns.in):**
```bash
nano /etc/nginx/sites-available/api.intowns.in.conf
```
Add:
```nginx
upstream backend {
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
    
    ssl_certificate /etc/letsencrypt/live/api.intowns.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.intowns.in/privkey.pem;
    
    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

Enable sites:
```bash
ln -s /etc/nginx/sites-available/intowns.in.conf /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/api.intowns.in.conf /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```
- [ ] Frontend Nginx config created
- [ ] Backend Nginx config created
- [ ] Nginx syntax valid
- [ ] Nginx reloaded

### Step 12: SSL Certificates (5 minutes)
```bash
# Via CloudPanel or Certbot
certbot certonly --standalone -d intowns.in -d www.intowns.in
certbot certonly --standalone -d api.intowns.in
certbot renew --dry-run
```
- [ ] Frontend certificate issued
- [ ] Backend certificate issued
- [ ] Auto-renewal enabled
- [ ] Certificates valid

---

## 🧪 Post-Deployment Testing

### API Tests
```bash
# Test categories endpoint
curl https://api.intowns.in/api/categories

# Should return:
# [{"name":"Massage",...},{"name":"Therapy",...},...]
```
- [ ] Returns 200 status
- [ ] Returns JSON array
- [ ] Contains 4 main categories

### Frontend Tests

1. **Open Frontend**
   ```
   https://intowns.in
   ```
   - [ ] Page loads without errors
   - [ ] Logo visible
   - [ ] Navigation menu visible

2. **Check Categories Display**
   - [ ] See 4 category tiles: Massage, Therapy, Bridal Makeup, Packages
   - [ ] Images load
   - [ ] Tiles clickable

3. **Test Category Drill-Down**
   - Click "Massage"
   - [ ] 10 sub-categories appear (Swedish, Deep Tissue, etc.)
   - [ ] Smooth animation

4. **Test Sub-Category Products**
   - Click "Swedish Massage"
   - [ ] 10 products appear with prices
   - [ ] Descriptions visible
   - [ ] "Add to Cart" buttons visible

5. **Test Responsive Design**
   - [ ] Works on mobile (open DevTools mobile view)
   - [ ] Works on tablet
   - [ ] Works on desktop

6. **Test Payment Options**
   - [ ] COD option visible
   - [ ] Online payment option visible (if Razorpay enabled)
   - [ ] Payment method selector works

### Console & Network Tests

1. **Open Browser Developer Tools** (F12)

2. **Console Tab**
   - [ ] No red errors
   - [ ] No CORS warnings
   - [ ] No JavaScript errors

3. **Network Tab**
   - [ ] API calls show 200 status
   - [ ] `/api/categories` successful
   - [ ] `/api/products` successful
   - [ ] Images load (200 status)

4. **Performance**
   - [ ] Page loads in < 3 seconds
   - [ ] Categories API responds < 500ms
   - [ ] Products API responds < 500ms

---

## 🔒 Security Verification

- [ ] HTTPS enabled for both domains
- [ ] SSL certificates valid
- [ ] HTTP redirects to HTTPS
- [ ] Security headers present
- [ ] MongoDB has authentication enabled
- [ ] .env file not accessible from web
- [ ] Firewall enabled (UFW)
- [ ] SSH port protected

---

## 📊 Performance Verification

```bash
# Check system health
top -bn1 | head -20

# Check disk usage
df -h

# Check memory
free -h

# Check backend process
ps aux | grep python

# Check Nginx status
systemctl status nginx

# Check MongoDB status
systemctl status mongod
```

- [ ] CPU usage < 50%
- [ ] Memory usage < 60%
- [ ] Disk usage < 70%
- [ ] All services running
- [ ] No error messages

---

## 📝 Monitoring Setup

```bash
# Install monitoring tools
apt install -y htop glances

# View real-time stats
htop
glances
```

- [ ] Monitoring tools installed
- [ ] Regular checks scheduled
- [ ] Alert thresholds configured

---

## 🚨 Backup Configuration

- [ ] Database backups enabled
- [ ] Backup frequency: Daily
- [ ] Backup retention: 30 days
- [ ] Remote backup storage configured (optional)
- [ ] Test restore procedure

---

## 📋 Final Sign-Off

- [ ] All tests passed
- [ ] Categories display correctly
- [ ] Products display correctly
- [ ] API responds properly
- [ ] Frontend loads fast
- [ ] No security issues
- [ ] Monitoring in place
- [ ] Backups configured
- [ ] Documentation updated
- [ ] Team trained on deployment

---

## 🔄 Rollback Procedure (If Issues)

```bash
# Stop services
systemctl stop intowns-backend
systemctl stop nginx

# Restore from backup
# (restore database, code, configs)

# Start services
systemctl start mongod
systemctl start intowns-backend
systemctl start nginx

# Verify
curl https://api.intowns.in/api/categories
```

---

## 📞 Emergency Contacts

- **Server Provider**: [Your provider contact]
- **Domain Registrar**: [Your registrar contact]
- **Backup Location**: [Where backups stored]
- **Database Admin**: [Database admin contact]

---

**Deployment Date**: _______________

**Deployed By**: _______________

**Verified By**: _______________

**Sign-Off**: _______________

