# 🔐 Simple Login Guide - Intowns.in

## Admin & Staff Login Made Easy!

---

## 🎯 Quick Access

### **Admin Login**
- **URL:** `http://localhost:3000/admin-login`
- **Username:** `admin`
- **Password:** `pass`
- **Access:** Full admin dashboard at `/admin`

### **Professional/Employee Login**
- **URL:** `http://localhost:3000/admin-login` (same page)
- **Username:** `rajni`
- **Password:** `pass`
- **Access:** Professional dashboard at `/professional`

---

## 📋 Step-by-Step Login

### For Admin:
1. Go to: `http://localhost:3000/admin-login`
2. Enter username: `admin`
3. Enter password: `pass`
4. Click "Sign In"
5. You'll be redirected to `/admin` automatically
6. See all admin features (Coupons, Wallet, Blog, Config, Mailing)

### For Professional (Rajni):
1. Go to: `http://localhost:3000/admin-login`
2. Enter username: `rajni`
3. Enter password: `pass`
4. Click "Sign In"
5. You'll be redirected to `/professional` automatically
6. See all orders, timer, maps, QR code features

---

## 🔗 Direct URLs

- **Admin Login Page:** `/admin-login`
- **Admin Dashboard:** `/admin` (after login)
- **Professional Dashboard:** `/professional` (after login)
- **Homepage:** `/`

---

## 💡 What About Google Login?

Google login still works for **regular users** who want to book services:

- **Regular Users:** Use "Login with Google" on homepage
- **Admin/Staff:** Use `/admin-login` with username/password

**Note:** Google OAuth redirect issue is bypassed with username/password login. No Google OAuth setup needed for admin/staff!

---

## 🎨 Login Page Features

✅ Beautiful gradient background with animations  
✅ Demo credentials shown on the page  
✅ Error messages if wrong credentials  
✅ Auto-redirect to correct dashboard  
✅ "Back to Home" button  

---

## 🔄 Logout

To logout from admin/professional:
1. Refresh the page
2. Or click logout button (if added)
3. Or clear browser localStorage: `localStorage.clear()`

---

## 🆕 Want to Add More Admins/Staff?

Current system is hardcoded. To add more users, edit `/app/backend/server.py`:

```python
# Find the username_password_login function
# Add new user in users_db dictionary:

'newadmin': {
    'password': 'newpass',
    'user_data': {
        'id': 'newadmin-id',
        'email': 'newadmin@intowns.in',
        'name': 'New Admin',
        'picture': 'https://ui-avatars.com/api/?name=NewAdmin&background=0284c7&color=fff',
        'role': 'admin',
        ...
    }
}
```

Then restart backend: `sudo supervisorctl restart backend`

---

## 🛠️ Troubleshooting

**Issue: Can't access admin page after login**
- Solution: Make sure you're using `/admin-login` URL (not `/admin` directly)
- The login page will auto-redirect you after successful login

**Issue: "Invalid username or password" error**
- Solution: Check spelling - username and password are case-sensitive
- Admin: `admin` / `pass`
- Rajni: `rajni` / `pass`

**Issue: Redirected but showing "Admin access required"**
- Solution: Refresh the page or clear browser cache
- The token is saved in localStorage

**Issue: Want to switch between admin and professional**
- Solution: Logout (clear localStorage) and login with different credentials

---

## 📊 Credentials Summary

| Role | Username | Password | Dashboard URL | Features |
|------|----------|----------|---------------|----------|
| Admin | `admin` | `pass` | `/admin` | Coupons, Wallet, Blog, Config, Stats |
| Professional | `rajni` | `pass` | `/professional` | Orders, Timer, Maps, QR Code |
| Regular User | Google OAuth | - | `/` | Browse, Book, Wallet, My Bookings |

---

## 🎯 Production Recommendations

For production deployment:

1. **Change default passwords** in the code
2. **Use hashed passwords** instead of plain text
3. **Add password reset** functionality
4. **Add 2FA** for admin accounts
5. **Store credentials** in environment variables
6. **Add session timeout** for security
7. **Log all admin actions** for audit trail

---

## ✅ All Set!

You can now:
- Login as admin at `/admin-login`
- Login as professional at `/admin-login`
- Access all features without MongoDB setup
- No Google OAuth configuration needed for staff

**Enjoy your fully functional admin panel!** 🚀
