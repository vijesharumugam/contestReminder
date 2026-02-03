# Gmail SMTP Port Configuration Guide

## ✅ Changes Made

I've added support for configurable SMTP ports. You can now try different ports to bypass Render's firewall.

## 🔧 How to Configure in Render

### Option 1: Try Port 465 (SSL/TLS)

1. Go to **Render Dashboard** → Your backend service → **Environment**
2. Add/Update these variables:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_SECURE=true
   ```
3. Click **Save Changes** and wait for redeploy

### Option 2: Try Port 587 (STARTTLS) - Default

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
```

### Option 3: Try Port 2525 (Alternative)

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=2525
SMTP_SECURE=false
```

## 📋 Complete Render Environment Variables

Make sure ALL these are set in Render:

```bash
# Database
MONGODB_URI=mongodb+srv://vijeshvijesh2601_db_user:tYHwbVP4MbDsYcSC@contestreminder.gtbdtr2.mongodb.net/?appName=ContestReminder

# CLIST API
CLIST_USERNAME=vijesh_a
CLIST_API_KEY=5ac64e7407ff853a7697ed00f1436be30e3ba9fa

# Email Configuration
EMAIL_PROVIDER=gmail
GMAIL_USER=vij748448@gmail.com
GMAIL_PASS=ddlh pyeu xgef ozkv

# SMTP Configuration - TRY PORT 465 FIRST
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true

# Telegram
TELEGRAM_BOT_TOKEN=8547689026:AAHIZV-KEG-crsk595aDfQx1eYsUW01dMJ0

# Admin
NEXT_PUBLIC_ADMIN_EMAIL=vijesharumugam26@gmail.com

# Server
PORT=5000
NODE_ENV=production
RENDER_EXTERNAL_URL=https://contestreminder-krrf.onrender.com
```

## 🚀 Deploy and Test

1. **Commit and push changes:**
   ```bash
   git add .
   git commit -m "feat: add configurable SMTP port for Gmail"
   git push origin main
   ```

2. **Wait for Render to deploy** (~2-3 minutes)

3. **Check logs** to see which port is being used:
   - Look for: `[Mailer] SMTP Configuration: smtp.gmail.com:465 (secure: true)`

4. **Test email** from admin dashboard

## ⚠️ Important Note

**Even with port configuration, Gmail SMTP may still not work on Render** because:
- Render blocks outbound SMTP connections on free tier
- Gmail blocks datacenter IPs for security

**If ports 465, 587, and 2525 all fail, you MUST use SendGrid.** There's no way around it on Render's free tier.

## 🎯 Next Steps

1. Deploy this code
2. Try port 465 first (most likely to work if any port works)
3. If it fails, check Render logs for the exact error
4. If all ports fail → Switch to SendGrid (I can help with this)
