# 🔐 Admin Password Management

## Current Admin Credentials
- **Username**: `admin`
- **Password**: `mypassword456` (recently changed)

## 🔄 How to Change Admin Password

### Method 1: Using the Admin Dashboard (Recommended)
1. Go to `http://localhost:3000/admin`
2. Login with current credentials
3. Click on the **"Settings"** tab
4. Fill in the password change form:
   - Current Password: Enter your current password
   - New Password: Enter your new password (minimum 6 characters)
   - Confirm New Password: Re-enter your new password
5. Click **"Change Password"**

### Method 2: Using Command Line Script
```bash
# Change password using the script
node change-password.js yournewpassword123

# Example
node change-password.js securepassword456
```

### Method 3: Direct Database Update (Advanced)
```bash
# Connect to SQLite database
sqlite3 lost_found.db

# Update password directly (password will be hashed)
UPDATE admins SET password = '$2b$10$yourhashedpassword' WHERE username = 'admin';
```

## 🔒 Security Features

### Password Requirements
- Minimum 6 characters
- Passwords are hashed using bcrypt
- Current password verification required
- Password confirmation required

### Security Best Practices
- Use strong passwords with mixed characters
- Change password regularly
- Don't share admin credentials
- Keep the database file secure

## 🚨 Reset Password (Emergency)

If you forget the admin password, you can reset it using the command line script:

```bash
# Reset to default password
node change-password.js admin123

# Or set a new password
node change-password.js yournewpassword
```

## 📝 Password History
- **Original**: `admin123`
- **Changed to**: `newpassword123`
- **Current**: `mypassword456`

## 🔧 Technical Details

### Database Schema
```sql
CREATE TABLE admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### API Endpoints
- `POST /api/admin/login` - Login verification
- `POST /api/admin/change-password` - Change password

### Password Hashing
- Algorithm: bcrypt
- Salt rounds: 10
- Storage: Hashed passwords only (never plain text)

## ✅ Verification

To verify your password change worked:
1. Try logging in with the new password
2. Check the admin dashboard settings
3. Verify the database contains the hashed password

Your Lost & Found Portal admin password management is now fully functional! 🎉
