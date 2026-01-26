# DNS & SSL Certificate Setup Guide

Complete guide for setting up DNS records and SSL certificates for Intowns on CloudPanel.

---

## 📋 OVERVIEW

For Intowns to work properly, you need:

| Domain | Purpose | Points To | SSL |
|--------|---------|-----------|-----|
| `intowns.in` | Frontend website | Your server IP | ✅ Required |
| `api.intowns.in` | Backend API (reverse proxy) | Your server IP | ✅ Required |

---

## 1️⃣ CLOUDPANEL DNS SETUP

### Step 1: Add Domain to CloudPanel

```bash
# Login to CloudPanel
# Go to: Domains → New Domain

# Add intowns.in
Domain: intowns.in
Select Hosting: Your Server

# Add api.intowns.in
Domain: api.intowns.in
Select Hosting: Your Server
```

### Step 2: Get Nameservers from CloudPanel

After adding domains in CloudPanel, you'll see 4 nameservers:

```
ns-1xxx.cloudpanel.io
ns-2xxx.cloudpanel.io
ns-3xxx.cloudpanel.io
ns-4xxx.cloudpanel.io
```

**Note these down!**

### Step 3: Update Domain Registrar

Where you bought your domain (GoDaddy, Namecheap, etc.):

1. Login to domain registrar
2. Find **Nameserver** settings
3. Replace with CloudPanel nameservers
4. Save

**Example for GoDaddy:**
```
Nameserver 1: ns-1xxx.cloudpanel.io
Nameserver 2: ns-2xxx.cloudpanel.io
Nameserver 3: ns-3xxx.cloudpanel.io
Nameserver 4: ns-4xxx.cloudpanel.io
```

⏰ **Wait 24-48 hours** for DNS propagation

### Verify DNS is Working

```bash
# Check if intowns.in resolves to your server IP
nslookup intowns.in

# Should show your server IP, e.g., 1.2.3.4

# Check api.intowns.in
nslookup api.intowns.in

# Should also show your server IP
```

---

## 2️⃣ A RECORDS (IF USING DIFFERENT DNS PROVIDER)

If you don't want to use CloudPanel's nameservers, add A records at your registrar:

### A Records to Add

| Subdomain | Type | Value | TTL |
|-----------|------|-------|-----|
| @ (intowns.in) | A | Your Server IP | 3600 |
| api | A | Your Server IP | 3600 |
| www | A | Your Server IP | 3600 |

**Example for GoDaddy DNS Manager:**

```
Type: A
Name: intowns.in
Value: 1.2.3.4 (your server IP)
TTL: 3600

Type: A
Name: api.intowns.in
Value: 1.2.3.4
TTL: 3600

Type: A
Name: www.intowns.in
Value: 1.2.3.4
TTL: 3600
```

---

## 3️⃣ SSL CERTIFICATE SETUP

### Automatic SSL (Recommended - CloudPanel)

CloudPanel can auto-generate Let's Encrypt certificates:

```bash
# In CloudPanel UI:
# 1. Go to your domain (intowns.in)
# 2. Click "SSL Certificate"
# 3. Click "Generate Free Let's Encrypt Certificate"
# 4. Wait 2-5 minutes

# For api.intowns.in:
# 1. Go to api.intowns.in domain
# 2. Click "SSL Certificate"
# 3. Click "Generate Free Let's Encrypt Certificate"
```

### Manual SSL (If CloudPanel doesn't work)

```bash
# Install Certbot
apt-get install certbot python3-certbot-nginx -y

# Generate certificate for intowns.in
certbot certonly --nginx -d intowns.in -d www.intowns.in

# Generate certificate for api.intowns.in
certbot certonly --nginx -d api.intowns.in

# Auto-renewal
systemctl enable certbot.timer
systemctl start certbot.timer
```

### Verify SSL Certificate

```bash
# Check certificate for intowns.in
openssl s_client -connect intowns.in:443 -servername intowns.in | grep -A 2 "subject="

# Check certificate for api.intowns.in
openssl s_client -connect api.intowns.in:443 -servername api.intowns.in | grep -A 2 "subject="

# Or use curl
curl -I https://intowns.in
# Should show: HTTP/2 200 and no certificate warning

curl -I https://api.intowns.in/api/categories
# Should show: HTTP/2 200 and no certificate warning
```

---

## 4️⃣ NGINX VHOST CONFIGURATION

### Vhost for intowns.in (Frontend)

**Location:** `/var/www/intowns/nginx_intowns.in.conf`

```nginx
server {
    listen 80;
    server_name intowns.in www.intowns.in;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name intowns.in www.intowns.in;
    
    # SSL Certificates (CloudPanel generated)
    ssl_certificate /etc/ssl/cloudpanel/intowns.in/cert.pem;
    ssl_certificate_key /etc/ssl/cloudpanel/intowns.in/key.pem;
    
    # Or if manually created:
    # ssl_certificate /etc/letsencrypt/live/intowns.in/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/intowns.in/privkey.pem;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # HSTS (optional but recommended)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Frontend root
    root /var/www/intowns/frontend/build;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css text/javascript application/json application/javascript;
    
    # React routing - all requests go to index.html
    location / {
        try_files $uri /index.html;
    }
    
    # Static files (cache long)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Deny access to hidden files
    location ~ /\. {
        deny all;
    }
    
    # Logging
    access_log /var/log/nginx/intowns.in_access.log combined;
    error_log /var/log/nginx/intowns.in_error.log;
}
```

### Vhost for api.intowns.in (Backend Reverse Proxy)

**Location:** `/var/www/intowns/nginx_api.intowns.in.conf`

```nginx
upstream intowns_backend {
    server 127.0.0.1:8000;
    keepalive 32;
}

server {
    listen 80;
    server_name api.intowns.in;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.intowns.in;
    
    # SSL Certificates (CloudPanel generated)
    ssl_certificate /etc/ssl/cloudpanel/api.intowns.in/cert.pem;
    ssl_certificate_key /etc/ssl/cloudpanel/api.intowns.in/key.pem;
    
    # Or if manually created:
    # ssl_certificate /etc/letsencrypt/live/api.intowns.in/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/api.intowns.in/privkey.pem;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # HSTS (optional)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Proxy settings
    location / {
        proxy_pass http://intowns_backend;
        proxy_http_version 1.1;
        
        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffering
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;
    }
    
    # Logging
    access_log /var/log/nginx/api.intowns.in_access.log combined;
    error_log /var/log/nginx/api.intowns.in_error.log;
}
```

### Enable Vhosts

```bash
# Check if CloudPanel created vhost files
ls -la /var/www/intowns/

# If files don't exist, create them as shown above

# Test Nginx configuration
nginx -t

# Should show: nginx: configuration file test is successful

# Reload Nginx
systemctl reload nginx
```

---

## 5️⃣ DNS PROPAGATION CHECK

### Online Tools

Visit these websites to check DNS propagation:

1. **MXToolbox** - https://mxtoolbox.com/
2. **What's My DNS** - https://www.whatsmydns.net/
3. **DNS Checker** - https://dnschecker.org/

**Check for:**
- `intowns.in` → resolves to your server IP
- `api.intowns.in` → resolves to your server IP

### Command Line Check

```bash
#!/bin/bash

echo "=== DNS Propagation Check ==="

echo "1. intowns.in"
nslookup intowns.in

echo ""
echo "2. api.intowns.in"
nslookup api.intowns.in

echo ""
echo "3. www.intowns.in"
nslookup www.intowns.in

echo ""
echo "=== SSL Certificate Check ==="

echo "1. intowns.in SSL"
openssl s_client -connect intowns.in:443 -servername intowns.in < /dev/null | grep -E "subject=|issuer="

echo ""
echo "2. api.intowns.in SSL"
openssl s_client -connect api.intowns.in:443 -servername api.intowns.in < /dev/null | grep -E "subject=|issuer="
```

---

## 6️⃣ CLOUDPANEL DOMAIN MANAGEMENT

### In CloudPanel Dashboard

```
Domains → intowns.in

Tab: Information
  - Domain: intowns.in
  - Nameserver: CloudPanel (if you chose this option)
  - Status: Active

Tab: Vhost
  - DocumentRoot: /var/www/intowns/frontend/build
  - PHP: Disabled (React app)
  - SSL: Enabled
  - Status: Active

Tab: DNS Records (if using CloudPanel DNS)
  - Type A, intowns.in, 1.2.3.4
  - Type A, www, 1.2.3.4
  - Type A, api, 1.2.3.4
```

---

## 7️⃣ TROUBLESHOOTING

### Issue: DNS not resolving

```bash
# Check nameservers
whois intowns.in | grep -A 5 "Name Server"

# Should show CloudPanel nameservers

# Force DNS refresh (Linux)
systemctl restart systemd-resolved

# Wait and try again
sleep 30
nslookup intowns.in
```

### Issue: SSL certificate not working

```bash
# Check certificate validity
curl -v https://intowns.in

# Check certificate dates
openssl x509 -in /etc/ssl/cloudpanel/intowns.in/cert.pem -text -noout | grep -A 2 "Validity"

# Should show: Not Before and Not After dates

# Regenerate if expired
certbot renew --force-renewal
```

### Issue: Can't access intowns.in

```bash
# 1. Check Nginx is running
systemctl status nginx

# 2. Check vhost config
nginx -t

# 3. Check frontend files exist
ls -la /var/www/intowns/frontend/build/index.html

# 4. Check Nginx logs
tail -f /var/log/nginx/intowns.in_error.log

# 5. Test locally
curl -I http://127.0.0.1:80
```

### Issue: Can't access api.intowns.in

```bash
# 1. Check backend is running
systemctl status intowns-backend

# 2. Check backend is listening on 8000
netstat -tlnp | grep 8000

# 3. Check Nginx logs
tail -f /var/log/nginx/api.intowns.in_error.log

# 4. Test locally
curl http://127.0.0.1:8000/api/categories

# 5. Test via reverse proxy
curl https://api.intowns.in/api/categories
```

---

## ✅ VERIFICATION CHECKLIST

Complete these checks to verify DNS & SSL are working:

- [ ] `nslookup intowns.in` returns your server IP
- [ ] `nslookup api.intowns.in` returns your server IP
- [ ] `https://intowns.in` loads without SSL warning
- [ ] `https://api.intowns.in/api/categories` returns JSON
- [ ] Frontend shows 4 categories (Massage, Therapy, Bridal, Packages)
- [ ] No mixed content warnings (F12 → Console)
- [ ] No CORS errors in browser console
- [ ] SSL certificate is valid (not expired)

---

## 📞 QUICK REFERENCE

```bash
# Check everything at once
{
    echo "=== DNS ==="
    nslookup intowns.in
    nslookup api.intowns.in
    
    echo ""
    echo "=== SSL ==="
    curl -v https://intowns.in 2>&1 | grep "subject="
    curl -v https://api.intowns.in 2>&1 | grep "subject="
    
    echo ""
    echo "=== SERVICES ==="
    systemctl status nginx
    systemctl status intowns-backend
    
    echo ""
    echo "=== TEST ==="
    curl -I https://intowns.in
    curl -I https://api.intowns.in/api/categories
}
```
